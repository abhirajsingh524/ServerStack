const mongoose = require('mongoose');

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('[DB] MONGO_URI environment variable is not set');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected — attempting reconnect...');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected');
    });
    mongoose.connection.on('error', (err) => {
      console.error('[DB] MongoDB error:', err.message);
    });

  } catch (error) {
    console.error(`[DB] Connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
