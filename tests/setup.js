const mongoose = require('mongoose');

// Use in-memory or test DB URI
const MONGO_TEST_URI = process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/cognivault_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_TEST_URI);
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
