const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.generateAuthToken();
  const cookieDays = parseInt(process.env.JWT_COOKIE_EXPIRE) || 7;
  const options = {
    expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  };

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      channelDescription: user.channelDescription,
      subscribers: user.subscribers,
      subscribedChannels: user.subscribedChannels,
      preferences: user.preferences,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(
        new ErrorResponse(
          existingUser.email === email
            ? 'Email already registered'
            : 'Username already taken',
          400
        )
      );
    }

    const user = await User.create({ username, email, password });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorResponse('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('subscribedChannels', 'username avatar')
      .populate('watchHistory.video')
      .populate('watchLater')
      .populate('likedVideos')
      .select('-password');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      username: req.body.username,
      channelDescription: req.body.channelDescription,
      avatar: req.body.avatar,
      coverImage: req.body.coverImage,
    };

    Object.keys(fieldsToUpdate).forEach(
      (key) => fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(req.body.currentPassword);
    if (!isMatch) {
      return next(new ErrorResponse('Current password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return next(new ErrorResponse('No user with that email', 404));
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'FunTube Password Reset Token',
        message: `You requested a password reset. Please use the following link: \n\n ${resetUrl} \n\n If you didn't request this, please ignore.`,
        html: `<h1>FunTube Password Reset</h1><p>Click the link below to reset your password:</p><a href="${resetUrl}" clicktracking="off">${resetUrl}</a><p>This link expires in 10 minutes.</p>`,
      });

      res.status(200).json({
        success: true,
        message: 'Email sent',
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return next(new ErrorResponse('Email could not be sent', 500));
    }
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return next(new ErrorResponse('Invalid or expired token', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { preferences: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: user.preferences,
    });
  } catch (err) {
    next(err);
  }
};

exports.getChannel = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('username avatar coverImage channelDescription subscribers')
      .populate('subscribers', 'username avatar');

    if (!user) {
      return next(new ErrorResponse('Channel not found', 404));
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

exports.createChannel = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(new ErrorResponse('User not found', 404));
    }

    const { channelDescription } = req.body;

    if (channelDescription !== undefined) {
      user.channelDescription = channelDescription;
    }
    if (req.files?.avatar) {
      user.avatar = `/uploads/avatars/${req.files.avatar[0].filename}`;
    }
    if (req.files?.cover) {
      user.coverImage = `/uploads/covers/${req.files.cover[0].filename}`;
    }
    user.role = 'creator';

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        channelDescription: user.channelDescription,
        coverImage: user.coverImage,
        subscribers: user.subscribers,
        subscribedChannels: user.subscribedChannels,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.subscribe = async (req, res, next) => {
  try {
    const channel = await User.findById(req.params.id);
    if (!channel) {
      return next(new ErrorResponse('Channel not found', 404));
    }

    if (channel._id.toString() === req.user.id) {
      return next(new ErrorResponse('Cannot subscribe to yourself', 400));
    }

    const alreadySubscribed = channel.subscribers.includes(req.user.id);
    if (alreadySubscribed) {
      channel.subscribers.pull(req.user.id);
      req.user.subscribedChannels.pull(channel._id);
    } else {
      channel.subscribers.push(req.user.id);
      req.user.subscribedChannels.push(channel._id);
    }

    await channel.save();
    await req.user.save();

    res.status(200).json({
      success: true,
      isSubscribed: !alreadySubscribed,
      subscribersCount: channel.subscribers.length,
    });
  } catch (err) {
    next(err);
  }
};
