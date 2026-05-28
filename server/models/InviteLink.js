const mongoose = require('mongoose');
const crypto = require('crypto');

const InviteLinkSchema = new mongoose.Schema({
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DriveVideo',
    required: true,
  },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(12).toString('hex'),
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  maxViews: {
    type: Number,
    default: 0,
  },
  viewsCount: {
    type: Number,
    default: 0,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

InviteLinkSchema.index({ video: 1 });
InviteLinkSchema.index({ uploader: 1 });

module.exports = mongoose.model('InviteLink', InviteLinkSchema);
