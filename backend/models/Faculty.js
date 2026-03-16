const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    facultyId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    designation: {
      type: String,
      enum: ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor'],
      default: 'Lecturer',
    },
    qualification:   { type: String, default: '' },
    specialization:  { type: String, default: '' },
    joiningDate:     { type: Date, default: Date.now },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', facultySchema);