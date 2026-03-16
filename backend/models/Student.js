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
    registrationNo: {
      type:      String,
      unique:    true,
      sparse:    true,
      trim:      true,
      uppercase: true,
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
    year:     { type: Number, required: true, min: 1, max: 6  },
    semester: { type: Number, required: true, min: 1, max: 12 },

    // ── GPA on 5.0 scale (Tanzania) ───────────────────
    gpa:          { type: Number, default: 0, min: 0, max: 5 },
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

// ── Virtual: display ID ───────────────────────────────
studentSchema.virtual('displayId').get(function () {
  return this.registrationNo || this.studentId;
});

// ── Virtual: year label ───────────────────────────────
studentSchema.virtual('yearLabel').get(function () {
  const labels = ['','1st Year','2nd Year','3rd Year','4th Year','5th Year','6th Year'];
  return labels[this.year] || `Year ${this.year}`;
});

// ── Virtual: GPA class on 5.0 scale ──────────────────
studentSchema.virtual('gpaClass').get(function () {
  if (this.gpa >= 4.4) return 'First Class';
  if (this.gpa >= 3.5) return 'Upper Second';
  if (this.gpa >= 2.7) return 'Lower Second';
  if (this.gpa >= 2.0) return 'Pass';
  if (this.gpa >= 1.0) return 'Supplementary';
  return 'Fail';
});

// ── Virtual: GPA color for UI ─────────────────────────
studentSchema.virtual('gpaColor').get(function () {
  if (this.gpa >= 4.4) return '#16a34a';
  if (this.gpa >= 3.5) return '#2563eb';
  if (this.gpa >= 2.7) return '#0891b2';
  if (this.gpa >= 2.0) return '#d97706';
  if (this.gpa >= 1.0) return '#ea580c';
  return '#dc2626';
});

module.exports = mongoose.model('Student', studentSchema);