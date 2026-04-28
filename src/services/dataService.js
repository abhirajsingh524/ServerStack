const Data = require('../models/Data');
const { encrypt, decrypt } = require('../utils/encryption');
const { auditLog } = require('../utils/logger');

const createData = async ({ title, description, jsonData, accessLevel, tags }, file, user, req) => {
  const payload = {
    title,
    description,
    ownerId: user._id,
    accessLevel: accessLevel || 'private',
    tags: tags || [],
  };

  if (jsonData) {
    payload.encryptedData = encrypt(jsonData);
  }

  if (file) {
    payload.fileUrl = file.path;
    payload.fileOriginalName = file.originalname;
    payload.fileMimeType = file.mimetype;
  }

  const data = await Data.create(payload);
  await auditLog({ userId: user._id, action: 'DATA_CREATE', metadata: { dataId: data._id, title }, req });

  return data;
};

const getAllData = async (user) => {
  const filter = user.role === 'admin' ? {} : { ownerId: user._id };
  const records = await Data.find(filter)
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });
  return records;
};

const getDataById = async (id, user, req) => {
  const record = await Data.findById(id).populate('ownerId', 'name email');
  if (!record) {
    const err = new Error('Data record not found');
    err.statusCode = 404;
    throw err;
  }

  // Researchers can only access their own or public/shared data
  if (user.role !== 'admin' && record.ownerId._id.toString() !== user._id.toString()) {
    if (record.accessLevel === 'private') {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }
  }

  await auditLog({ userId: user._id, action: 'DATA_READ', metadata: { dataId: id }, req });

  // Decrypt if encrypted data exists
  const result = record.toObject();
  if (result.encryptedData) {
    result.decryptedData = decrypt(result.encryptedData);
    delete result.encryptedData;
  }

  return result;
};

const updateData = async (id, updates, user, req) => {
  const record = await Data.findById(id);
  if (!record) {
    const err = new Error('Data record not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'admin' && record.ownerId.toString() !== user._id.toString()) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  const updated = await Data.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  await auditLog({ userId: user._id, action: 'DATA_UPDATE', metadata: { dataId: id }, req });

  return updated;
};

const deleteData = async (id, user, req) => {
  const record = await Data.findById(id);
  if (!record) {
    const err = new Error('Data record not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'admin' && record.ownerId.toString() !== user._id.toString()) {
    const err = new Error('Access denied');
    err.statusCode = 403;
    throw err;
  }

  await Data.findByIdAndDelete(id);
  await auditLog({ userId: user._id, action: 'DATA_DELETE', metadata: { dataId: id }, req });
};

module.exports = { createData, getAllData, getDataById, updateData, deleteData };
