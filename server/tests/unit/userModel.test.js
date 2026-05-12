const mongoose = require('mongoose');
const User = require('../../models/User');
require('../db');

describe('User Model', () => {
  const validUserData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  };

  it('should create a user with valid data', async () => {
    const user = await User.create(validUserData);
    expect(user.username).toBe('testuser');
    expect(user.email).toBe('test@example.com');
    expect(user.toJSON().password).toBeUndefined();
    expect(user.role).toBe('user');
  });

  it('should hash password before saving', async () => {
    const user = await User.create(validUserData);
    const found = await User.findById(user._id).select('+password');
    expect(found.password).not.toBe('password123');
    expect(found.password).toMatch(/^\$2[ayb]\$.{56}$/);
  });

  it('should not re-hash password if not modified', async () => {
    const user = await User.create(validUserData);
    const found = await User.findById(user._id).select('+password');
    const originalHash = found.password;

    found.username = 'updateduser';
    await found.save();

    const reFetched = await User.findById(user._id).select('+password');
    expect(reFetched.password).toBe(originalHash);
  });

  it('should reject duplicate email', async () => {
    await User.create(validUserData);
    await expect(
      User.create({ ...validUserData, username: 'other' })
    ).rejects.toThrow();
  });

  it('should reject duplicate username', async () => {
    await User.create(validUserData);
    await expect(
      User.create({ ...validUserData, email: 'other@example.com' })
    ).rejects.toThrow();
  });

  it('should validate required fields', async () => {
    await expect(User.create({})).rejects.toThrow();
  });

  it('should match password correctly', async () => {
    const user = await User.create(validUserData);
    const isMatch = await user.matchPassword('password123');
    const isNotMatch = await user.matchPassword('wrongpassword');
    expect(isMatch).toBe(true);
    expect(isNotMatch).toBe(false);
  });

  it('should generate auth token', async () => {
    const user = await User.create(validUserData);
    const token = user.generateAuthToken();
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);
  });

  it('should generate reset password token', async () => {
    const user = await User.create(validUserData);
    const resetToken = user.getResetPasswordToken();
    expect(typeof resetToken).toBe('string');
    expect(user.resetPasswordToken).toBeDefined();
    expect(user.resetPasswordExpire).toBeDefined();
    expect(user.resetPasswordExpire.getTime()).toBeGreaterThan(Date.now());
  });

  it('should have default preferences', async () => {
    const user = await User.create(validUserData);
    expect(user.preferences.language).toBe('en');
    expect(user.preferences.theme).toBe('dark');
    expect(user.preferences.autoPlay).toBe(true);
    expect(user.preferences.notificationsEnabled).toBe(true);
  });

  it('should enforce username minlength', async () => {
    await expect(
      User.create({ ...validUserData, username: 'ab' })
    ).rejects.toThrow();
  });

  it('should enforce password minlength', async () => {
    await expect(
      User.create({ ...validUserData, password: '12345' })
    ).rejects.toThrow();
  });
});
