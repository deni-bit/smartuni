const asyncHandler   = require('express-async-handler');
const Notification   = require('../models/Notification');
const User           = require('../models/User');

// @desc    Get my notifications
// @route   GET /api/notifications
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
  const { type, isRead } = req.cleanQuery || req.query;

  const filter = { recipient: req.user._id };
  if (type)   filter.type   = type;
  if (isRead !== undefined) filter.isRead = isRead === 'true';

  const notifications = await Notification.find(filter)
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(50);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user._id,
    isRead:    false,
  });

  res.json({ notifications, unreadCount });
});

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  notification.isRead = true;
  await notification.save();

  res.json({ success: true, message: 'Marked as read' });
});

// @desc    Mark all as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Send notification (admin)
// @route   POST /api/notifications/send
// @access  Admin
const sendNotification = asyncHandler(async (req, res) => {
  const { recipients, title, message, type, link } = req.body;

  if (!recipients || !title || !message) {
    res.status(400);
    throw new Error('Recipients, title and message are required');
  }

  // recipients can be: 'all', 'students', 'faculty', or array of user IDs
  let recipientIds = [];

  if (recipients === 'all') {
    const users    = await User.find({ isActive: true }).select('_id');
    recipientIds   = users.map(u => u._id);
  } else if (recipients === 'students') {
    const users    = await User.find({ role: 'student', isActive: true }).select('_id');
    recipientIds   = users.map(u => u._id);
  } else if (recipients === 'faculty') {
    const users    = await User.find({ role: 'faculty', isActive: true }).select('_id');
    recipientIds   = users.map(u => u._id);
  } else if (Array.isArray(recipients)) {
    recipientIds   = recipients;
  } else {
    res.status(400);
    throw new Error('Invalid recipients value');
  }

  const notifications = recipientIds.map(id => ({
    recipient:  id,
    title,
    message,
    type:       type  || 'general',
    link:       link  || '',
    createdBy:  req.user._id,
  }));

  await Notification.insertMany(notifications);

  // Real-time via WebSocket
  const io = req.app.get('io');
  if (io) {
    for (const id of recipientIds) {
      io.to(`user_${id}`).emit('new_notification', {
        title,
        message,
        type: type || 'general',
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Notification sent to ${recipientIds.length} users`,
    count:    recipientIds.length,
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  if (notification.recipient.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Access denied');
  }

  await notification.deleteOne();

  res.json({ success: true, message: 'Notification deleted' });
});

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
};