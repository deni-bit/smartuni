const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    studentId: {
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
    year: {
      type: Number,
      required: true,
      min: 1,
      max: 6,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    gpa: { type: Number, default: 0, min: 0, max: 4 },
    totalCredits: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'suspended', 'graduated', 'withdrawn'],
      default: 'active',
    },
    admissionDate: { type: Date, default: Date.now },
    guardianName:  { type: String, default: '' },
    guardianPhone: { type: String, default: '' },
    address:       { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);