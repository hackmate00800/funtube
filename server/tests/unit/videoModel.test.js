const User = require('../../models/User');
const Video = require('../../models/Video');
require('../db');

describe('Video Model', () => {
  let user;

  beforeAll(async () => {
    user = await User.create({
      username: 'creator',
      email: 'creator@example.com',
      password: 'password123',
    });
  });

  const validVideoData = () => ({
    user: user._id,
    title: 'Test Video',
    description: 'A test video description',
    url: '/uploads/videos/test.mp4',
    thumbnail: '/uploads/thumbnails/test.png',
  });

  it('should create a video with valid data', async () => {
    const video = await Video.create(validVideoData());
    expect(video.title).toBe('Test Video');
    expect(video.status).toBe('uploading');
    expect(video.views).toBe(0);
  });

  it('should reject missing title', async () => {
    const data = validVideoData();
    delete data.title;
    await expect(Video.create(data)).rejects.toThrow();
  });

  it('should validate category enum', async () => {
    const data = validVideoData();
    data.category = 'InvalidCategory';
    await expect(Video.create(data)).rejects.toThrow();
  });

  it('should accept valid categories', async () => {
    const categories = ['Music', 'Gaming', 'Education', 'Other'];
    for (const cat of categories) {
      const video = await Video.create({
        ...validVideoData(),
        title: `Video ${cat}`,
        category: cat,
      });
      expect(video.category).toBe(cat);
    }
  });

  it('should enforce title maxlength', async () => {
    await expect(
      Video.create({
        ...validVideoData(),
        title: 'x'.repeat(101),
      })
    ).rejects.toThrow();
  });

  it('should default to public', async () => {
    const video = await Video.create(validVideoData());
    expect(video.isPublic).toBe(true);
  });

  it('should default allowComments to true', async () => {
    const video = await Video.create(validVideoData());
    expect(video.allowComments).toBe(true);
  });

  it('should store shares field', async () => {
    const video = await Video.create(validVideoData());
    expect(video.shares).toBe(0);
  });

  it('should store videoResolutions as array', async () => {
    const video = await Video.create({
      ...validVideoData(),
      videoResolutions: ['360p', '720p'],
    });
    expect(video.videoResolutions).toContain('720p');
  });

  it('should track likes and dislikes as arrays', async () => {
    const video = await Video.create(validVideoData());
    expect(Array.isArray(video.likes)).toBe(true);
    expect(Array.isArray(video.dislikes)).toBe(true);
  });

  it('should create text indexes on title, description, tags', async () => {
    const indexes = await Video.collection.indexes();
    const textIndex = indexes.find((i) => i.key._fts === 'text');
    expect(textIndex).toBeDefined();
  });
});
