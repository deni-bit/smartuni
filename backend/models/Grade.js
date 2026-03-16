const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
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
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },
    semester:     { type: Number, required: true },
    academicYear: { type: String, required: true },

    // ── Marks breakdown ───────────────────────────────
    assignment: { type: Number, default: 0, min: 0, max: 20 },
    midterm:    { type: Number, default: 0, min: 0, max: 30 },
    finalExam:  { type: Number, default: 0, min: 0, max: 50 },
    totalMarks: { type: Number, default: 0, min: 0, max: 100 },

    // ── Tanzania/East Africa Grading System ───────────
    // A   70–100  5.0 pts  Excellent
    // B+  60–69   4.0 pts  Very Good
    // B   50–59   3.0 pts  Good
    // C   40–49   2.0 pts  Satisfactory (Pass)
    // D   35–39   1.0 pts  Supplementary (repeat exam)
    // E    0–34   0.0 pts  Fail (repeat course)
    letterGrade: {
      type:    String,
      enum:    ['A','B+','B','C','D','E','I'],
      default: 'I',
    },
    gradePoints: { type: Number, default: 0, min: 0, max: 5 },

    status: {
      type:    String,
      enum:    ['pending','submitted','approved'],
      default: 'pending',
    },
    submittedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
    remarks: { type: String, default: '' },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Auto-calculate on save ────────────────────────────
gradeSchema.pre('save', function () {
  const total     = (this.assignment || 0) + (this.midterm || 0) + (this.finalExam || 0);
  this.totalMarks = total;

  if      (total >= 70) { this.letterGrade = 'A';  this.gradePoints = 5.0; }
  else if (total >= 60) { this.letterGrade = 'B+'; this.gradePoints = 4.0; }
  else if (total >= 50) { this.letterGrade = 'B';  this.gradePoints = 3.0; }
  else if (total >= 40) { this.letterGrade = 'C';  this.gradePoints = 2.0; }
  else if (total >= 35) { this.letterGrade = 'D';  this.gradePoints = 1.0; }
  else if (total > 0)   { this.letterGrade = 'E';  this.gradePoints = 0.0; }
  else                  { this.letterGrade = 'I';  this.gradePoints = 0.0; }
});

// ── Virtuals ──────────────────────────────────────────
gradeSchema.virtual('gradeLabel').get(function () {
  const labels = {
    'A':  'Excellent',
    'B+': 'Very Good',
    'B':  'Good',
    'C':  'Satisfactory',
    'D':  'Supplementary',
    'E':  'Fail',
    'I':  'Incomplete',
  };
  return labels[this.letterGrade] || '';
});

gradeSchema.virtual('isSupplementary').get(function () {
  return this.letterGrade === 'D';
});

gradeSchema.virtual('isFail').get(function () {
  return this.letterGrade === 'E';
});

gradeSchema.virtual('isPassing').get(function () {
  return ['A','B+','B','C'].includes(this.letterGrade);
});

module.exports = mongoose.model('Grade', gradeSchema);