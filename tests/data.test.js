require('dotenv').config();
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/app');
require('./setup');

const AUTH = '/api/v1/auth';
const DATA = '/api/v1/data';

describe('Data API — /api/v1/data', () => {
  let researcherToken, adminToken, dataId;

  const researcher = { name: 'Researcher', email: 'r@test.com', password: 'Test@1234', role: 'researcher' };
  const admin      = { name: 'Admin',      email: 'a@test.com', password: 'Test@1234', role: 'admin' };

  const getToken = async (user) => {
    await request(app).post(`${AUTH}/register`).send(user);
    const res = await request(app).post(`${AUTH}/login`).send({ email: user.email, password: user.password });
    return res.body.data.accessToken;
  };

  beforeEach(async () => {
    researcherToken = await getToken(researcher);
    adminToken      = await getToken(admin);
  });

  describe('POST /data', () => {
    it('should create a data record with JSON payload', async () => {
      const res = await request(app)
        .post(DATA)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Research A', description: 'Test data', jsonData: { key: 'value' }, accessLevel: 'private' });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.title).toBe('Research A');
      dataId = res.body.data._id;
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).post(DATA).send({ title: 'Test' });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /data', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post(DATA)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'My Record', jsonData: { x: 1 } });
      dataId = res.body.data._id;
    });

    it('should return researcher own data', async () => {
      const res = await request(app)
        .get(DATA)
        .set('Authorization', `Bearer ${researcherToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.records.length).toBeGreaterThan(0);
    });

    it('should return all data for admin', async () => {
      const res = await request(app)
        .get(DATA)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('GET /data/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post(DATA)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Private Record', jsonData: { secret: 42 }, accessLevel: 'private' });
      dataId = res.body.data._id;
    });

    it('should return decrypted data for owner', async () => {
      const res = await request(app)
        .get(`${DATA}/${dataId}`)
        .set('Authorization', `Bearer ${researcherToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveProperty('decryptedData');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .get(`${DATA}/64f1a2b3c4d5e6f7a8b9c0d1`)
        .set('Authorization', `Bearer ${researcherToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for invalid ObjectId', async () => {
      const res = await request(app)
        .get(`${DATA}/not-a-valid-id`)
        .set('Authorization', `Bearer ${researcherToken}`);
      expect(res.statusCode).toBe(422);
    });
  });

  describe('PUT /data/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post(DATA)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Update Me', jsonData: { v: 1 } });
      dataId = res.body.data._id;
    });

    it('should update own data', async () => {
      const res = await request(app)
        .put(`${DATA}/${dataId}`)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Updated Title' });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });
  });

  describe('DELETE /data/:id', () => {
    beforeEach(async () => {
      const res = await request(app)
        .post(DATA)
        .set('Authorization', `Bearer ${researcherToken}`)
        .send({ title: 'Delete Me', jsonData: { v: 1 } });
      dataId = res.body.data._id;
    });

    it('should delete own data', async () => {
      const res = await request(app)
        .delete(`${DATA}/${dataId}`)
        .set('Authorization', `Bearer ${researcherToken}`);
      expect(res.statusCode).toBe(200);
    });

    it('admin can delete any data', async () => {
      const res = await request(app)
        .delete(`${DATA}/${dataId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
    });
  });
});
