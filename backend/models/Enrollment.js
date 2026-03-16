const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    semester:     { type: Number, required: true },
    academicYear: { type: String, required: true },
    status: {
      type: String,
      enum: ['enrolled', 'dropped', 'completed', 'failed'],
      default: 'enrolled',
    },
    enrollmentDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate enrollment
enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);