const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');

exports.getRooms = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { isPrivate: false };
    if (type) filter.type = type;
    const rooms = await Room.find(filter)
      .populate('creator', 'username avatar')
      .sort({ 'activeUsers.length': -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    const total = await Room.countDocuments(filter);
    res.status(200).json({ success: true, data: rooms, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch rooms: ' + err.message, 500));
  }
};

exports.getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'username avatar')
      .populate('members', 'username avatar')
      .populate('activeUsers', 'username avatar');
    if (!room) return next(new ErrorResponse('Room not found', 404));
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    next(new ErrorResponse('Failed to fetch room: ' + err.message, 500));
  }
};

exports.createRoom = async (req, res, next) => {
  try {
    req.body.creator = req.user.id;
    req.body.members = [req.user.id];
    req.body.activeUsers = [req.user.id];
    const room = await Room.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(new ErrorResponse('Failed to create room: ' + err.message, 500));
  }
};

exports.joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return next(new ErrorResponse('Room not found', 404));
    if (room.isPrivate && room.password && req.body.password !== room.password) {
      return next(new ErrorResponse('Invalid room password', 401));
    }
    if (!room.members.includes(req.user.id)) {
      room.members.push(req.user.id);
    }
    if (!room.activeUsers.includes(req.user.id)) {
      room.activeUsers.push(req.user.id);
    }
    if (room.activeUsers.length > room.maxMembers) {
      return next(new ErrorResponse('Room is full', 400));
    }
    await room.save();
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    next(new ErrorResponse('Failed to join room: ' + err.message, 500));
  }
};

exports.leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return next(new ErrorResponse('Room not found', 404));
    room.activeUsers = room.activeUsers.filter(u => u.toString() !== req.user.id);
    await room.save();
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    next(new ErrorResponse('Failed to leave room: ' + err.message, 500));
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return next(new ErrorResponse('Room not found', 404));
    room.messages.push({
      user: req.user.id,
      username: req.user.username,
      avatar: req.user.avatar,
      text: req.body.text,
      type: req.body.type || 'text',
    });
    if (room.messages.length > 200) room.messages = room.messages.slice(-200);
    await room.save();
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.id}`).emit('new-message', room.messages[room.messages.length - 1]);
    res.status(200).json({ success: true, data: room.messages[room.messages.length - 1] });
  } catch (err) {
    next(new ErrorResponse('Failed to send message: ' + err.message, 500));
  }
};

exports.updateVideoState = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return next(new ErrorResponse('Room not found', 404));
    room.videoState = { ...room.videoState, ...req.body };
    await room.save();
    const io = req.app.get('io');
    if (io) io.to(`room:${req.params.id}`).emit('video-state-update', room.videoState);
    res.status(200).json({ success: true, data: room.videoState });
  } catch (err) {
    next(new ErrorResponse('Failed to update video state: ' + err.message, 500));
  }
};
