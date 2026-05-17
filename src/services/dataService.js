/**
 * Data Service — business logic for the research data vault.
 * Integrates: AES-256-GCM encryption, audit logging, Redis caching.
 */
const Data         = require('../models/Data');
const { encrypt, decrypt } = require('../utils/encryption');
const { auditLog } = require('../utils/logger');
const cache        = require('./cacheService');
const logger       = require('../config/logger');
const { AUDIT_ACTIONS, CACHE_TTL, CACHE_KEYS } = require('../constants');

// Whitelist — prevents mass-assignment attacks
const UPDATABLE_FIELDS = ['title', 'description', 'accessLevel', 'tags'];

// ── Create ────────────────────────────────────────────────────────────────────
const createData = async ({ title, description, jsonData, accessLevel, tags }, file, user, req) => {
  const payload = {
    title,
    description: description || undefined,
    ownerId:     user._id,
    accessLevel: accessLevel || 'private',
    tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
  };

  if (jsonData) {
    payload.encryptedData = encrypt(jsonData);
    logger.debug('[DATA] JSON payload encrypted', { userId: user._id });
  }

  if (file) {
    payload.fileUrl          = file.path;
    payload.fileOriginalName = file.originalname;
    payload.fileMimeType     = file.mimetype;
    await auditLog({
      userId: user._id, action: AUDIT_ACTIONS.FILE_UPLOAD,
      metadata: { filename: file.originalname, title }, req,
    });
  }

  const data = await Data.create(payload);

  // Invalidate list cache for this user + admin
  await cache.delPattern(CACHE_KEYS.DATA_LIST(user._id));
  await cache.delPattern(CACHE_KEYS.DATA_LIST('admin'));

  await auditLog({
    userId: user._id, action: AUDIT_ACTIONS.DATA_CREATE,
    metadata: { dataId: data._id, title }, req,
  });

  return data;
};

// ── List ──────────────────────────────────────────────────────────────────────
const getAllData = async (user, query = {}) => {
  const cacheKey = `${CACHE_KEYS.DATA_LIST(user._id)}:${JSON.stringify(query)}`;

  return cache.getOrSet(cacheKey, async () => {
    const filter = user.role === 'admin'
      ? {}
      : {
          $or: [
            { ownerId: user._id },
            { accessLevel: 'shared' },
            { accessLevel: 'public' },
          ],
        };

    if (query.tag)         filter.tags        = query.tag;
    if (query.accessLevel && user.role === 'admin') filter.accessLevel = query.accessLevel;

    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Data.find(filter)
        .populate('ownerId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Data.countDocuments(filter),
    ]);

    return { records, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }, CACHE_TTL.DATA_LIST);
};

// ── Get by ID ─────────────────────────────────────────────────────────────────
const getDataById = async (id, user, req) => {
  // Fetch from cache (without decrypted data — decrypt on demand)
  const cacheKey = CACHE_KEYS.DATA_ITEM(id);
  let record = await cache.get(cacheKey);

  if (!record) {
    record = await Data.findById(id)
      .select('+encryptedData')
      .populate('ownerId', 'name email')
      .lean();

    if (!record) {
      const err = new Error('Data record not found');
      err.statusCode = 404;
      throw err;
    }
    // Cache the raw record (with encrypted data)
    await cache.set(cacheKey, record, CACHE_TTL.DATA_RECORD);
  }

  const isOwner = record.ownerId._id
    ? record.ownerId._id.toString() === user._id.toString()
    : record.ownerId.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  // Access control
  if (!isAdmin && !isOwner && record.accessLevel === 'private') {
    await auditLog({
      userId: user._id, action: AUDIT_ACTIONS.UNAUTHORIZED_ACCESS,
      metadata: { dataId: id }, req, severity: 'warn',
    });
    const err = new Error('Access denied: this record is private');
    err.statusCode = 403;
    throw err;
  }

  await auditLog({ userId: user._id, action: AUDIT_ACTIONS.DATA_READ, metadata: { dataId: id }, req });

  // Return a copy — never mutate the cached object
  const result = { ...record };

  // Decrypt only for owner or admin
  if (result.encryptedData && (isOwner || isAdmin)) {
    try {
      result.decryptedData = decrypt(result.encryptedData);
      await auditLog({
        userId: user._id, action: AUDIT_ACTIONS.DECRYPT_ACCESS,
        metadata: { dataId: id }, req, severity: 'info',
      });
    } catch (err) {
      logger.error('[DATA] Decryption failed', { dataId: id, error: err.message });
      result.decryptedData = null;
      result.decryptionError = 'Data could not be decrypted';
    }
  }
  delete result.encryptedData;

  return result;
};

// ── Update ────────────────────────────────────────────────────────────────────
const updateData = async (id, rawUpdates, user, req) => {
  const record = await Data.findById(id);
  if (!record) {
    const err = new Error('Data record not found');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = record.ownerId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const err = new Error('Access denied: you do not own this record');
    err.statusCode = 403;
    throw err;
  }

  // Whitelist fields
  const updates = {};
  UPDATABLE_FIELDS.forEach(field => {
    if (rawUpdates[field] !== undefined) updates[field] = rawUpdates[field];
  });

  if (Object.keys(updates).length === 0) {
    const err = new Error('No valid fields provided for update');
    err.statusCode = 400;
    throw err;
  }

  const updated = await Data.findByIdAndUpdate(
    id, { $set: updates }, { new: true, runValidators: true }
  ).lean();

  // Invalidate caches
  await cache.del(CACHE_KEYS.DATA_ITEM(id));
  await cache.delPattern(CACHE_KEYS.DATA_LIST(user._id));
  await cache.delPattern(CACHE_KEYS.DATA_LIST('admin'));

  await auditLog({
    userId: user._id, action: AUDIT_ACTIONS.DATA_UPDATE,
    metadata: { dataId: id, fields: Object.keys(updates) }, req,
  });

  return updated;
};

// ── Delete ────────────────────────────────────────────────────────────────────
const deleteData = async (id, user, req) => {
  const record = await Data.findById(id);
  if (!record) {
    const err = new Error('Data record not found');
    err.statusCode = 404;
    throw err;
  }

  const isOwner = record.ownerId.toString() === user._id.toString();
  if (!isOwner && user.role !== 'admin') {
    const err = new Error('Access denied: you do not own this record');
    err.statusCode = 403;
    throw err;
  }

  await Data.findByIdAndDelete(id);

  // Invalidate caches
  await cache.del(CACHE_KEYS.DATA_ITEM(id));
  await cache.delPattern(CACHE_KEYS.DATA_LIST(user._id));
  await cache.delPattern(CACHE_KEYS.DATA_LIST('admin'));

  await auditLog({
    userId: user._id, action: AUDIT_ACTIONS.DATA_DELETE,
    metadata: { dataId: id, title: record.title }, req,
  });
};

module.exports = { createData, getAllData, getDataById, updateData, deleteData };
