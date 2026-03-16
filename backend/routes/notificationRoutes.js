const express = require('express');
const router  = express.Router();

const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotification,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/',                protect,            getMyNotifications);
router.patch('/read-all',      protect,            markAllAsRead);
router.post('/send',           protect, adminOnly, sendNotification);
router.patch('/:id/read',      protect,            markAsRead);
router.delete('/:id',          protect,            deleteNotification);

module.exports = router;