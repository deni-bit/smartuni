const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.NODE_ENV === 'production' ? '1d' : '7d' }
  );
};

module.exports = generateToken;