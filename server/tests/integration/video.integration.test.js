const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const User = require('../../models/User');
const Video = require('../../models/Video');
const videoRoutes = require('../../routes/videos');
const authRoutes = require('../../routes/auth');
const errorHandler = require('../../middleware/error');
const { protect } = require('../../middleware/auth');
require('../db');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/videos', videoRoutes);
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

describe('Video API Integration', () => {
  let user1Token, user2Token, user1Id, user2Id;

  const setupData = async () => {
    const u1 = await request(app).post('/api/auth/register').send({
      username: 'videotest1',
      email: 'videotest1@example.com',
      password: 'password123',
    });
    user1Token = getToken(u1);
    user1Id = u1.body.user.id || u1.body.user._id;

    const u2 = await request(app).post('/api/auth/register').send({
      username: 'videotest2',
      email: 'videotest2@example.com',
      password: 'password123',
    });
    user2Token = getToken(u2);
    user2Id = u2.body.user.id || u2.body.user._id;
  };

  const createTestVideo = async () => {
    const video = await Video.create({
      user: user1Id,
      title: 'Integration Test Video',
      description: 'Test description',
      url: '/uploads/videos/test.mp4',
      thumbnail: '/uploads/thumbnails/test.png',
      category: 'Education',
      tags: ['test', 'integration'],
      status: 'ready',
      isPublic: true,
      videoResolutions: ['360p', '720p'],
    });
    return video._id;
  };

  describe('GET /api/videos', () => {
    beforeEach(async () => {
      await setupData();
      await createTestVideo();
    });

    it('should list all videos', async () => {
      const res = await request(app).get('/api/videos').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by category', async () => {
      const res = await request(app).get('/api/videos?category=Education').expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by user', async () => {
      const res = await request(app).get(`/api/videos?user=${user1Id}`).expect(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/videos/:id', () => {
    let testVideoId;

    beforeEach(async () => {
      await setupData();
      testVideoId = await createTestVideo();
    });

    it('should get a single video', async () => {
      const res = await request(app).get(`/api/videos/${testVideoId}`).expect(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Integration Test Video');
    });

    it('should return 404 for non-existent video', async () => {
      const fakeId = '000000000000000000000000';
      await request(app).get(`/api/videos/${fakeId}`).expect(404);
    });
  });

  describe('GET /api/videos/trending', () => {
    beforeEach(async () => {
      await setupData();
      await createTestVideo();
    });

    it('should return trending videos', async () => {
      const res = await request(app).get('/api/videos/trending').expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/videos/:id/recommended', () => {
    let testVideoId;

    beforeEach(async () => {
      await setupData();
      testVideoId = await createTestVideo();
    });

    it('should return recommended videos for a valid video', async () => {
      const res = await request(app).get(`/api/videos/${testVideoId}/recommended`).expect(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('PUT /api/videos/:id/like', () => {
    let testVideoId;

    beforeEach(async () => {
      await setupData();
      testVideoId = await createTestVideo();
    });

    it('should like a video and update user likedVideos', async () => {
      const res = await request(app)
        .put(`/api/videos/${testVideoId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isLiked).toBe(true);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const likedIds = me.body.data.likedVideos.map(v => String(v._id || v));
      expect(likedIds).toContain(String(testVideoId));
    });

    it('should toggle unlike and remove from likedVideos', async () => {
      await request(app)
        .put(`/api/videos/${testVideoId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      const res = await request(app)
        .put(`/api/videos/${testVideoId}/like`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isLiked).toBe(false);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const likedIds = me.body.data.likedVideos.map(v => String(v._id || v));
      expect(likedIds).not.toContain(String(testVideoId));
    });

    it('should require authentication', async () => {
      await request(app)
        .put(`/api/videos/${testVideoId}/like`)
        .expect(401);
    });
  });

  describe('PUT /api/videos/:id/dislike', () => {
    let testVideoId;

    beforeEach(async () => {
      await setupData();
      testVideoId = await createTestVideo();
    });

    it('should dislike a video and update user dislikedVideos', async () => {
      const res = await request(app)
        .put(`/api/videos/${testVideoId}/dislike`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isDisliked).toBe(true);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const dislikedIds = me.body.data.dislikedVideos.map(v => String(v._id || v));
      expect(dislikedIds).toContain(String(testVideoId));
    });

    it('should toggle undislike and remove from dislikedVideos', async () => {
      await request(app)
        .put(`/api/videos/${testVideoId}/dislike`)
        .set('Authorization', `Bearer ${user2Token}`);

      const res = await request(app)
        .put(`/api/videos/${testVideoId}/dislike`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isDisliked).toBe(false);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const dislikedIds = me.body.data.dislikedVideos.map(v => String(v._id || v));
      expect(dislikedIds).not.toContain(String(testVideoId));
    });

    it('should remove from likedVideos when disliking a liked video', async () => {
      await request(app)
        .put(`/api/videos/${testVideoId}/like`)
        .set('Authorization', `Bearer ${user2Token}`);

      const res = await request(app)
        .put(`/api/videos/${testVideoId}/dislike`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isDisliked).toBe(true);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const likedIds = me.body.data.likedVideos.map(v => String(v._id || v));
      expect(likedIds).not.toContain(String(testVideoId));
    });
  });

  describe('PUT /api/videos/:id/watch-later', () => {
    let testVideoId;

    beforeEach(async () => {
      await setupData();
      testVideoId = await createTestVideo();
    });

    it('should add video to watch later and update user watchLater', async () => {
      const res = await request(app)
        .put(`/api/videos/${testVideoId}/watch-later`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isInWatchLater).toBe(true);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const laterIds = me.body.data.watchLater.map(v => String(v._id || v));
      expect(laterIds).toContain(String(testVideoId));
    });

    it('should toggle remove from watch later', async () => {
      await request(app)
        .put(`/api/videos/${testVideoId}/watch-later`)
        .set('Authorization', `Bearer ${user2Token}`);

      const res = await request(app)
        .put(`/api/videos/${testVideoId}/watch-later`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      expect(res.body.isInWatchLater).toBe(false);

      const me = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200);

      const laterIds = me.body.data.watchLater.map(v => String(v._id || v));
      expect(laterIds).not.toContain(String(testVideoId));
    });
  });

  describe('GET /api/videos/creator', () => {
    beforeEach(async () => {
      await setupData();
      await createTestVideo();
    });

    it('should return creator videos for authenticated user', async () => {
      const res = await request(app)
        .get('/api/videos/creator')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      await request(app).get('/api/videos/creator').expect(401);
    });
  });
});
