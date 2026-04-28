const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_in_production!';

/**
 * Encrypt a value using AES
 * @param {any} data - data to encrypt (will be JSON stringified)
 * @returns {string} encrypted string
 */
const encrypt = (data) => {
  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringified, ENCRYPTION_KEY).toString();
};

/**
 * Decrypt an AES-encrypted string
 * @param {string} cipherText - encrypted string
 * @returns {any} decrypted and parsed value
 */
const decrypt = (cipherText) => {
  const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
};

module.exports = { encrypt, decrypt };
