/**
 * CogniVault Encryption Service
 * AES-256-GCM authenticated encryption with:
 * - Algorithm versioning (supports future key rotation)
 * - Random IV per encryption
 * - Auth tag for tamper detection
 * - Structured ciphertext format: version:iv:authTag:ciphertext
 */
const crypto = require('crypto');
const { ENCRYPTION } = require('../constants');
const logger = require('../config/logger');

const { ALGORITHM, IV_LENGTH, TAG_LENGTH, VERSION } = ENCRYPTION;

// ── Key Management ────────────────────────────────────────────────────────────

/**
 * Derive a 32-byte AES key from the ENCRYPTION_KEY env variable.
 * Uses SHA-256 so any string length works as input.
 */
const deriveKey = (rawKey) =>
  crypto.createHash('sha256').update(rawKey).digest();

/**
 * Get the active encryption key. Throws if not configured.
 */
const getActiveKey = () => {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  return deriveKey(raw);
};

/**
 * Get a previous key for decryption during rotation.
 * Set ENCRYPTION_KEY_PREV in .env during rotation window.
 */
const getPreviousKey = () => {
  const raw = process.env.ENCRYPTION_KEY_PREV;
  return raw ? deriveKey(raw) : null;
};

// ── Encrypt ───────────────────────────────────────────────────────────────────

/**
 * Encrypt data using AES-256-GCM.
 * @param {any} data - Value to encrypt (objects are JSON-stringified)
 * @returns {string} Versioned ciphertext: "v1:iv:authTag:ciphertext" (all hex)
 */
const encrypt = (data) => {
  const key       = getActiveKey();
  const iv        = crypto.randomBytes(IV_LENGTH);
  const cipher    = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Format: version:iv:authTag:ciphertext
  return [
    VERSION,
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
};

// ── Decrypt ───────────────────────────────────────────────────────────────────

/**
 * Decrypt an AES-256-GCM ciphertext.
 * Supports both current and previous keys (for rotation).
 * @param {string} cipherText - "v1:iv:authTag:ciphertext" or legacy "iv:authTag:ciphertext"
 * @returns {any} Decrypted and JSON-parsed value
 */
const decrypt = (cipherText) => {
  if (!cipherText) throw new Error('No ciphertext provided');

  const parts = cipherText.split(':');

  // Support versioned (4 parts) and legacy (3 parts) formats
  let version, ivHex, authTagHex, encryptedHex;
  if (parts.length === 4) {
    [version, ivHex, authTagHex, encryptedHex] = parts;
  } else if (parts.length === 3) {
    version = 'legacy';
    [ivHex, authTagHex, encryptedHex] = parts;
  } else {
    throw new Error('Invalid encrypted data format');
  }

  const iv        = Buffer.from(ivHex, 'hex');
  const authTag   = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  // Try active key first, then previous key (rotation support)
  const keysToTry = [getActiveKey()];
  const prevKey   = getPreviousKey();
  if (prevKey) keysToTry.push(prevKey);

  let lastError;
  for (const key of keysToTry) {
    try {
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');

      try {
        return JSON.parse(decrypted);
      } catch {
        return decrypted;
      }
    } catch (err) {
      lastError = err;
    }
  }

  logger.error('[ENCRYPTION] Decryption failed — possible key mismatch or tampered data', {
    version,
    error: lastError?.message,
  });
  throw new Error('Decryption failed — data may be corrupted or key is incorrect');
};

// ── Utilities ─────────────────────────────────────────────────────────────────

/**
 * Check if a string looks like a valid versioned ciphertext.
 */
const isEncrypted = (value) => {
  if (typeof value !== 'string') return false;
  const parts = value.split(':');
  return parts.length === 4 && parts[0] === VERSION;
};

/**
 * Re-encrypt a ciphertext with the current key.
 * Use during key rotation to migrate existing records.
 */
const reEncrypt = (cipherText) => {
  const decrypted = decrypt(cipherText);
  return encrypt(decrypted);
};

module.exports = { encrypt, decrypt, isEncrypted, reEncrypt };
