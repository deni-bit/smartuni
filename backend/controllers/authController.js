const asyncHandler  = require('express-async-handler');
const User          = require('../models/User');
const Student       = require('../models/Student');
const Faculty       = require('../models/Faculty');
const Department    = require('../models/Department');
const generateToken = require('../utils/generateToken');

// ── Helpers ───────────────────────────────────────────
const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ── Generate unique IDs ───────────────────────────────
const generateStudentId = async () => {
  const year  = new Date().getFullYear().toString().slice(-2);
  const count = await Student.countDocuments();
  return `STU${year}${String(count + 1).padStart(4, '0')}`;
};

const generateFacultyId = async () => {
  const year  = new Date().getFullYear().toString().slice(-2);
  const count = await Faculty.countDocuments();
  return `FAC${year}${String(count + 1).padStart(3, '0')}`;
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (student) / Admin only (faculty/admin/staff)
const registerUser = asyncHandler(async (req, res) => {
  const {
    name, email, password, role,
    phone, departmentId, year, semester,
    designation, qualification,
  } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // Only admin can create faculty/admin/staff accounts
  const assignedRole = role || 'student';
  if (['faculty', 'admin', 'staff'].includes(assignedRole)) {
    if (!req.user || req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only admins can create faculty and staff accounts');
    }
  }

  // Check duplicate
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  // Create user
  const user = await User.create({
    name:     name.trim(),
    email:    email.toLowerCase().trim(),
    password,
    role:     assignedRole,
    phone:    phone || '',
  });

  // Create role-specific profile
  if (assignedRole === 'student') {
    if (!departmentId) {
      await user.deleteOne();
      res.status(400);
      throw new Error('Department is required for student registration');
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      await user.deleteOne();
      res.status(400);
      throw new Error('Department not found');
    }

    const studentId = await generateStudentId();
    await Student.create({
      user:       user._id,
      studentId,
      department: departmentId,
      year:       year       || 1,
      semester:   semester   || 1,
    });
  }

  if (assignedRole === 'faculty') {
    if (!departmentId) {
      await user.deleteOne();
      res.status(400);
      throw new Error('Department is required for faculty registration');
    }

    const dept = await Department.findById(departmentId);
    if (!dept) {
      await user.deleteOne();
      res.status(400);
      throw new Error('Department not found');
    }

    const facultyId = await generateFacultyId();
    await Faculty.create({
      user:          user._id,
      facultyId,
      department:    departmentId,
      designation:   designation   || 'Lecturer',
      qualification: qualification || '',
    });
  }

  const token = generateToken(user._id, user.role);

  res.status(201).json({
    _id:   user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error('Invalid email format');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Contact admin.');
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Get role-specific profile
  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id })
      .populate('department', 'name code');
  }
  if (user.role === 'faculty') {
    profile = await Faculty.findOne({ user: user._id })
      .populate('department', 'name code');
  }

  const token = generateToken(user._id, user.role);

  res.json({
    _id:     user._id,
    name:    user.name,
    email:   user.email,
    role:    user.role,
    phone:   user.phone,
    profile,
    token,
  });
});

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id })
      .populate('department', 'name code');
  }
  if (user.role === 'faculty') {
    profile = await Faculty.findOne({ user: user._id })
      .populate('department', 'name code');
  }

  res.json({ user, profile });
});

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, phone, currentPassword, newPassword } = req.body;

  if (name)  user.name  = name.trim();
  if (phone) user.phone = phone;

  // Change password
  if (newPassword) {
    if (!currentPassword) {
      res.status(400);
      throw new Error('Current password is required to set a new password');
    }
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      res.status(400);
      throw new Error('Current password is incorrect');
    }
    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('New password must be at least 6 characters');
    }
    user.password = newPassword;
  }

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
      phone: user.phone,
    },
  });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Both current and new passwords are required');
  }

  const user = await User.findById(req.user._id);
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password changed successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
};