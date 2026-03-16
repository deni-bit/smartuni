const jwt          = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User         = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token || token.split('.').length !== 3) {
        res.status(401);
        throw new Error('Malformed token');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (!decoded.id || !decoded.role) {
        res.status(401);
        throw new Error('Invalid token payload');
      }

      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        res.status(401);
        throw new Error('User no longer exists');
      }

      if (!user.isActive) {
        res.status(403);
        throw new Error('Your account has been deactivated');
      }

      req.user = user;
      next();

    } catch (error) {
      res.status(401);
      throw new Error(
        error.name === 'TokenExpiredError'  ? 'Session expired, please login again'
        : error.name === 'JsonWebTokenError' ? 'Invalid token, please login again'
        : error.message
      );
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }
});

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403);
  throw new Error('Access denied: Admins only');
};

const facultyOnly = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') return next();
  res.status(403);
  throw new Error('Access denied: Faculty only');
};

const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  res.status(403);
  throw new Error('Access denied: Students only');
};

const facultyOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'faculty' || req.user.role === 'admin')) return next();
  res.status(403);
  throw new Error('Access denied: Faculty or Admin only');
};

module.exports = { protect, adminOnly, facultyOnly, studentOnly, facultyOrAdmin };