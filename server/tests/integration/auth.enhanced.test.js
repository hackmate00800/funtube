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

describe('Auth Enhanced API Integration', () => {
  describe('GET /api/auth/me returns id field', () => {
    let token, userId;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'idtestuser',
        email: 'idtest@example.com',
        password: 'password123',
      });
      token = getToken(res);
      userId = res.body.user.id || res.body.user._id;
    });

    it('should return user with id field in JSON', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data.id).toBeDefined();
      expect(typeof res.body.data.id).toBe('string');
      expect(res.body.data._id).toBeDefined();
      expect(res.body.data.id).toBe(String(res.body.data._id));
    });
  });

  describe('PUT /api/auth/create-channel', () => {
    let token, userId;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'channelcreator',
        email: 'channelcreator@example.com',
        password: 'password123',
      });
      token = getToken(res);
      userId = res.body.user.id || res.body.user._id;
    });

    it('should create a channel and set role to creator', async () => {
      const res = await request(app)
        .put('/api/auth/create-channel')
        .set('Authorization', `Bearer ${token}`)
        .field('channelDescription', 'My awesome channel')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('creator');
      expect(res.body.data.channelDescription).toBe('My awesome channel');
    });

    it('should return user with id field after creating channel', async () => {
      const res = await request(app)
        .put('/api/auth/create-channel')
        .set('Authorization', `Bearer ${token}`)
        .field('channelDescription', 'Test channel')
        .expect(200);

      expect(res.body.data.id).toBeDefined();
      expect(typeof res.body.data.id).toBe('string');
    });

    it('should update existing channel description', async () => {
      await request(app)
        .put('/api/auth/create-channel')
        .set('Authorization', `Bearer ${token}`)
        .field('channelDescription', 'First description');

      const res = await request(app)
        .put('/api/auth/create-channel')
        .set('Authorization', `Bearer ${token}`)
        .field('channelDescription', 'Updated description')
        .expect(200);

      expect(res.body.data.channelDescription).toBe('Updated description');
    });
  });

  describe('GET /api/auth/channel/:id', () => {
    let token, userId;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'channeltest',
        email: 'channeltest@example.com',
        password: 'password123',
      });
      token = getToken(res);
      userId = res.body.user.id || res.body.user._id;

      await request(app)
        .put('/api/auth/create-channel')
        .set('Authorization', `Bearer ${token}`)
        .field('channelDescription', 'Channel description');
    });

    it('should return channel data by ID', async () => {
      const res = await request(app)
        .get(`/api/auth/channel/${userId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('channeltest');
      expect(res.body.data.channelDescription).toBe('Channel description');
      expect(res.body.data.subscribers).toBeDefined();
    });

    it('should return 404 for non-existent channel', async () => {
      const fakeId = '000000000000000000000000';
      await request(app)
        .get(`/api/auth/channel/${fakeId}`)
        .expect(404);
    });
  });

  describe('PUT /api/auth/preferences', () => {
    let token;

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send({
        username: 'prefuser',
        email: 'prefuser@example.com',
        password: 'password123',
      });
      token = getToken(res);
    });

    it('should update language preference', async () => {
      const res = await request(app)
        .put('/api/auth/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ language: 'es' })
        .expect(200);

      expect(res.body.data.language).toBe('es');
    });

    it('should update theme preference', async () => {
      const res = await request(app)
        .put('/api/auth/preferences')
        .set('Authorization', `Bearer ${token}`)
        .send({ theme: 'light' })
        .expect(200);

      expect(res.body.data.theme).toBe('light');
    });
  });

  describe('User model JSON includes id', () => {
    it('should include id in User toJSON output', async () => {
      const user = await User.create({
        username: 'jsontest',
        email: 'json@example.com',
        password: 'password123',
      });

      const json = user.toJSON();
      expect(json.id).toBeDefined();
      expect(json.id).toBe(String(json._id));
      expect(json.password).toBeUndefined();
    });
  });
});
