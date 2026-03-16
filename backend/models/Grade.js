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

    // Marks breakdown
    assignment:  { type: Number, default: 0, min: 0, max: 20 },
    midterm:     { type: Number, default: 0, min: 0, max: 30 },
    finalExam:   { type: Number, default: 0, min: 0, max: 50 },
    totalMarks:  { type: Number, default: 0, min: 0, max: 100 },

    // Grade
    letterGrade: {
      type: String,
      enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'I'],
      default: 'I', // I = Incomplete
    },
    gradePoints:  { type: Number, default: 0, min: 0, max: 4 },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'approved'],
      default: 'pending',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    remarks: { type: String, default: '' },
  },
  { timestamps: true }
);

// Auto calculate letter grade and grade points
gradeSchema.pre('save', function () {
  const total = this.assignment + this.midterm + this.finalExam;
  this.totalMarks = total;

  if      (total >= 95) { this.letterGrade = 'A+'; this.gradePoints = 4.0; }
  else if (total >= 90) { this.letterGrade = 'A';  this.gradePoints = 4.0; }
  else if (total >= 85) { this.letterGrade = 'A-'; this.gradePoints = 3.7; }
  else if (total >= 80) { this.letterGrade = 'B+'; this.gradePoints = 3.3; }
  else if (total >= 75) { this.letterGrade = 'B';  this.gradePoints = 3.0; }
  else if (total >= 70) { this.letterGrade = 'B-'; this.gradePoints = 2.7; }
  else if (total >= 65) { this.letterGrade = 'C+'; this.gradePoints = 2.3; }
  else if (total >= 60) { this.letterGrade = 'C';  this.gradePoints = 2.0; }
  else if (total >= 55) { this.letterGrade = 'C-'; this.gradePoints = 1.7; }
  else if (total >= 50) { this.letterGrade = 'D';  this.gradePoints = 1.0; }
  else if (total > 0)   { this.letterGrade = 'F';  this.gradePoints = 0.0; }
});

module.exports = mongoose.model('Grade', gradeSchema);