require('dotenv').config();
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
require('./setup');

// All endpoints now versioned under /api/v1/
const BASE = '/api/v1/auth';

describe('Auth API — /api/v1/auth', () => {
  const testUser = {
    name: 'Test Researcher',
    email: 'researcher@test.com',
    password: 'Test@1234',
    role: 'researcher',
  };

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post(`${BASE}/register`).send(testUser);
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject duplicate email', async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
      const res = await request(app).post(`${BASE}/register`).send(testUser);
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ ...testUser, password: 'weak' });
      expect(res.statusCode).toBe(422);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app).post(`${BASE}/register`).send({ email: 'x@x.com' });
      expect(res.statusCode).toBe(422);
    });
  });

  describe('POST /login', () => {
    beforeEach(async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: testUser.password });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: 'WrongPass@1' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: 'nobody@test.com', password: 'Test@1234' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /me', () => {
    it('should return current user with valid token', async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: testUser.password });

      const { accessToken } = loginRes.body.data;
      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app).get(`${BASE}/me`);
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: testUser.password });

      const { refreshToken } = loginRes.body.data;
      const res = await request(app)
        .post(`${BASE}/refresh`)
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post(`${BASE}/refresh`)
        .send({ refreshToken: 'invalid.token.here' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully with valid token', async () => {
      await request(app).post(`${BASE}/register`).send(testUser);
      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ email: testUser.email, password: testUser.password });

      const { accessToken } = loginRes.body.data;
      const res = await request(app)
        .post(`${BASE}/logout`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should reject logout without token', async () => {
      const res = await request(app).post(`${BASE}/logout`);
      expect(res.statusCode).toBe(401);
    });
  });
});
