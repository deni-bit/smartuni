const express = require('express');
const router  = express.Router();
const asyncHandler = require('express-async-handler');
const User         = require('../models/User');
const Student      = require('../models/Student');
const Faculty      = require('../models/Faculty');
const Department   = require('../models/Department');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Get all users
router.get('/users', protect, adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').sort({ createdAt: -1 });
  res.json(users);
}));

// Toggle user active status
router.patch('/users/:id/toggle', protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, user });
}));

// Get all departments
router.get('/departments', protect, adminOnly, asyncHandler(async (req, res) => {
  const departments = await Department.find({})
    .populate('head', 'name email');
  res.json(departments);
}));

// Create department
router.post('/departments', protect, adminOnly, asyncHandler(async (req, res) => {
  const { name, code, description } = req.body;
  if (!name || !code) { res.status(400); throw new Error('Name and code required'); }
  const dept = await Department.create({ name, code: code.toUpperCase(), description });
  res.status(201).json(dept);
}));

// Update department
router.put('/departments/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!dept) { res.status(404); throw new Error('Department not found'); }
  res.json(dept);
}));

module.exports = router;