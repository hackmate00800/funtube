const mongoose = require('mongoose');

const DriveAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  accessToken: {
    type: String,
    default: '',
  },
  refreshToken: {
    type: String,
    required: true,
  },
  tokenExpiry: {
    type: Date,
    default: null,
  },
  googleEmail: {
    type: String,
    default: '',
  },
  isConnected: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});



module.exports = mongoose.model('DriveAccount', DriveAccountSchema);
