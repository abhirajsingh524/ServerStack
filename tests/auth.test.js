require('dotenv').config();
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
require('./setup');

describe('Auth API', () => {
  const testUser = {
    name: 'Test Researcher',
    email: 'researcher@test.com',
    password: 'Test@1234',
    role: 'researcher',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app).post('/api/auth/register').send(testUser);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, password: 'weak' });
      expect(res.statusCode).toBe(422);
    });

    it('should reject missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'x@x.com' });
      expect(res.statusCode).toBe(422);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPass@1' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'Test@1234' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const { accessToken } = loginRes.body.data;
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      const { refreshToken } = loginRes.body.data;
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });
      expect(res.statusCode).toBe(401);
    });
  });
});
