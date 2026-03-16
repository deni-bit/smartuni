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
      uppercase: true,
    },
    // ── Registration number used for login ────────────
    // Format: T26-03-00001 (T + year + month + sequence)
    registrationNo: {
      type:     String,
      unique:   true,
      sparse:   true,
      trim:     true,
      uppercase:true,
      match: [
        /^T\d{2}-\d{2}-\d{5}$/,
        'Registration number must be in format T26-03-00001',
      ],
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
    gpa:          { type: Number, default: 0, min: 0, max: 4 },
    totalCredits: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['active', 'suspended', 'graduated', 'withdrawn'],
      default: 'active',
    },
    admissionDate: { type: Date,   default: Date.now },
    guardianName:  { type: String, default: ''       },
    guardianPhone: { type: String, default: ''       },
    address:       { type: String, default: ''       },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Virtual: display ID (reg no or student ID) ────────
studentSchema.virtual('displayId').get(function () {
  return this.registrationNo || this.studentId;
});

// ── Virtual: academic year label ──────────────────────
studentSchema.virtual('yearLabel').get(function () {
  const labels = ['', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];
  return labels[this.year] || `Year ${this.year}`;
});

// ── Virtual: GPA classification ───────────────────────
studentSchema.virtual('gpaClass').get(function () {
  if (this.gpa >= 4.0) return 'First Class';
  if (this.gpa >= 3.5) return 'Upper Second';
  if (this.gpa >= 2.7) return 'Lower Second';
  if (this.gpa >= 2.0) return 'Pass';
  return 'Fail';
});

module.exports = mongoose.model('Student', studentSchema);