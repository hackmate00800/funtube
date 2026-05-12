const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username: { type: String },
  avatar: { type: String },
  text: { type: String },
  type: { type: String, enum: ['text', 'code', 'system', 'join', 'leave'], default: 'text' },
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['study', 'watch', 'code', 'general'],
    default: 'general',
  },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  activeUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxMembers: { type: Number, default: 50 },
  isPrivate: { type: Boolean, default: false },
  password: { type: String },
  messages: [MessageSchema],
  videoState: {
    playing: { type: Boolean, default: false },
    currentTime: { type: Number, default: 0 },
    timestamp: { type: Date },
  },
  whiteboard: { type: String },
  tags: [{ type: String }],
}, { timestamps: true });

RoomSchema.index({ slug: 1 });
RoomSchema.index({ type: 1 });
RoomSchema.index({ 'activeUsers': 1 });

module.exports = mongoose.model('Room', RoomSchema);
