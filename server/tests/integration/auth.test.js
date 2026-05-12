const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const User = require('../../models/User');
const Video = require('../../models/Video');
const authRoutes = require('../../routes/auth');
const errorHandler = require('../../middleware/error');
require('../db');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const getToken = (res) => {
  const cookies = res.headers['set-cookie'];
  if (cookies) {
    const tokenCookie = cookies.find((c) => c.startsWith('token='));
    if (tokenCookie) return tokenCookie.split(';')[0].replace('token=', '');
  }
  return res.body.token;
};

describe('Auth API Integration', () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.user.username).toBe('testuser');
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate username', async () => {
      await request(app).post('/api/auth/register').send(testUser);
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...testUser, email: 'other@example.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);
      token = getToken(res);
    });

    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('should reject request without token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/subscribe/:id', () => {
    let user1Token, user2Id;

    let user1Id;

    beforeEach(async () => {
      const u1 = await request(app).post('/api/auth/register').send(testUser);
      user1Token = getToken(u1);
      user1Id = u1.body.user.id;

      const u2 = await request(app).post('/api/auth/register').send({
        username: 'channeluser',
        email: 'channel@example.com',
        password: 'password123',
      });
      user2Id = u2.body.user.id;
    });

    it('should subscribe to a channel', async () => {
      const res = await request(app)
        .put(`/api/auth/subscribe/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.isSubscribed).toBe(true);
    });

    it('should unsubscribe on second click', async () => {
      await request(app)
        .put(`/api/auth/subscribe/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`);

      const res = await request(app)
        .put(`/api/auth/subscribe/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.isSubscribed).toBe(false);
    });

    it('should not allow self-subscribe', async () => {
      const res = await request(app)
        .put(`/api/auth/subscribe/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
