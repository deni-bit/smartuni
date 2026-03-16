const asyncHandler = require('express-async-handler');
const Grade        = require('../models/Grade');
const Student      = require('../models/Student');
const Course       = require('../models/Course');
const Faculty      = require('../models/Faculty');
const Enrollment   = require('../models/Enrollment');
const Notification = require('../models/Notification');

// ── Helpers ───────────────────────────────────────────
const calcGPA = (grades) => {
  const approved = grades.filter(g =>
    g.status === 'approved' && !['I','E'].includes(g.letterGrade)
  );
  let totalPoints = 0, totalCredits = 0;
  for (const g of approved) {
    const cr = g.course?.credits || 3;
    totalPoints  += g.gradePoints * cr;
    totalCredits += cr;
  }
  return {
    gpa:          totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0,
    totalCredits,
  };
};

const getGpaClass = (gpa) => {
  if (gpa >= 4.4) return 'First Class';
  if (gpa >= 3.5) return 'Upper Second';
  if (gpa >= 2.7) return 'Lower Second';
  if (gpa >= 2.0) return 'Pass';
  if (gpa >= 1.0) return 'Supplementary';
  return 'Fail';
};

// Tanzania grading reference
const GRADE_SCALE = [
  { grade: 'A',  min: 70, max: 100, points: 5.0, label: 'Excellent',     action: null            },
  { grade: 'B+', min: 60, max: 69,  points: 4.0, label: 'Very Good',     action: null            },
  { grade: 'B',  min: 50, max: 59,  points: 3.0, label: 'Good',          action: null            },
  { grade: 'C',  min: 40, max: 49,  points: 2.0, label: 'Satisfactory',  action: null            },
  { grade: 'D',  min: 35, max: 39,  points: 1.0, label: 'Supplementary', action: 'Repeat Exam'   },
  { grade: 'E',  min: 0,  max: 34,  points: 0.0, label: 'Fail',          action: 'Repeat Course' },
];

// @desc    Submit grades for a course
// @route   POST /api/grades/submit
// @access  Faculty/Admin
const submitGrades = asyncHandler(async (req, res) => {
  const { courseId, academicYear, semester, grades } = req.body;

  if (!courseId || !grades || !Array.isArray(grades)) {
    res.status(400);
    throw new Error('Course ID and grades array are required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const results = [], errors = [];

  for (const g of grades) {
    const { studentId, enrollmentId, assignment, midterm, finalExam, remarks } = g;

    try {
      const grade = await Grade.findOneAndUpdate(
        { student: studentId, course: courseId, academicYear },
        {
          student:      studentId,
          course:       courseId,
          enrollment:   enrollmentId,
          semester:     semester     || course.semester,
          academicYear: academicYear || '2025/2026',
          assignment:   Number(assignment) || 0,
          midterm:      Number(midterm)    || 0,
          finalExam:    Number(finalExam)  || 0,
          status:       'submitted',
          submittedBy:  req.user._id,
          remarks:      remarks || '',
        },
        { upsert: true, new: true, runValidators: true }
      );

      results.push(grade);

      // Build notification message based on grade
      const gradeInfo = GRADE_SCALE.find(s => s.grade === grade.letterGrade);
      const actionMsg = gradeInfo?.action ? ` Action required: ${gradeInfo.action}.` : '';

      const student = await Student.findById(studentId).populate('user', '_id');
      if (student?.user) {
        await Notification.create({
          recipient: student.user._id,
          title:     'Grades Submitted',
          message:   `Your grade for ${course.title}: ${grade.letterGrade} (${grade.totalMarks}/100) — ${gradeInfo?.label || ''}.${actionMsg}`,
          type:      grade.letterGrade === 'D' || grade.letterGrade === 'E' ? 'warning' : 'grade',
          createdBy: req.user._id,
        });
      }
    } catch (err) {
      errors.push({ studentId, error: err.message });
    }
  }

  res.status(201).json({
    success:   true,
    message:   `Grades submitted for ${results.length} students`,
    submitted: results.length,
    errors,
    scale:     GRADE_SCALE,
  });
});

// @desc    Get grades for a course
// @route   GET /api/grades/course/:courseId
// @access  Faculty/Admin
const getCourseGrades = asyncHandler(async (req, res) => {
  const { academicYear } = req.cleanQuery || req.query;

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const filter = { course: req.params.courseId };
  if (academicYear) filter.academicYear = academicYear;

  const grades = await Grade.find(filter)
    .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
    .sort({ totalMarks: -1 });

  const submitted = grades.filter(g => g.status !== 'pending');
  const avgMarks  = submitted.length > 0
    ? parseFloat((submitted.reduce((s, g) => s + g.totalMarks, 0) / submitted.length).toFixed(1))
    : 0;

  // Tanzania distribution
  const distribution = { A: 0, 'B+': 0, B: 0, C: 0, D: 0, E: 0, I: 0 };
  for (const g of grades) {
    if (distribution[g.letterGrade] !== undefined) distribution[g.letterGrade]++;
  }

  const supplementaryCount = distribution.D;
  const failCount          = distribution.E;
  const passCount          = distribution.A + distribution['B+'] + distribution.B + distribution.C;
  const passRate           = grades.length > 0
    ? parseFloat((passCount / grades.length * 100).toFixed(1))
    : 0;

  res.json({
    course,
    grades,
    stats: {
      avgMarks,
      distribution,
      total:             grades.length,
      passCount,
      passRate,
      supplementaryCount,
      failCount,
    },
    scale: GRADE_SCALE,
  });
});

// @desc    Get my grades (student)
// @route   GET /api/grades/my
// @access  Student
const getMyGrades = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const grades = await Grade.find({ student: student._id })
    .populate('course', 'title code credits semester year')
    .sort({ semester: 1 });

  const { gpa, totalCredits } = calcGPA(grades);

  // Grade distribution
  const dist = { A: 0, 'B+': 0, B: 0, C: 0, D: 0, E: 0 };
  const approved = grades.filter(g => g.status === 'approved');
  for (const g of approved) {
    if (dist[g.letterGrade] !== undefined) dist[g.letterGrade]++;
  }

  // Supplementary / fail alerts
  const supplementary = approved.filter(g => g.letterGrade === 'D');
  const failed        = approved.filter(g => g.letterGrade === 'E');

  // Group by semester for transcript view
  const bySemester = {};
  for (const g of grades) {
    const key = `Semester ${g.semester}`;
    if (!bySemester[key]) bySemester[key] = [];
    bySemester[key].push(g);
  }

  // Semester GPAs
  const semesterGPAs = {};
  for (const [sem, semGrades] of Object.entries(bySemester)) {
    const { gpa: semGpa } = calcGPA(semGrades);
    semesterGPAs[sem] = semGpa;
  }

  res.json({
    grades,
    gpa,
    totalCredits,
    gpaClass:      getGpaClass(gpa),
    distribution:  dist,
    supplementary,
    failed,
    bySemester,
    semesterGPAs,
    scale:         GRADE_SCALE,
  });
});

// @desc    Approve grades
// @route   PATCH /api/grades/approve/:courseId
// @access  Admin
const approveGrades = asyncHandler(async (req, res) => {
  const { academicYear } = req.body;

  const updated = await Grade.updateMany(
    {
      course:       req.params.courseId,
      academicYear: academicYear || '2025/2026',
      status:       'submitted',
    },
    { status: 'approved' }
  );

  // Recalculate GPAs for affected students
  const grades = await Grade.find({
    course:       req.params.courseId,
    academicYear: academicYear || '2025/2026',
    status:       'approved',
  });

  for (const grade of grades) {
    const allGrades = await Grade.find({
      student: grade.student,
      status:  'approved',
    }).populate('course', 'credits');

    const { gpa, totalCredits } = calcGPA(allGrades);
    await Student.findByIdAndUpdate(grade.student, { gpa, totalCredits });
  }

  res.json({
    success: true,
    message: `${updated.modifiedCount} grades approved and GPAs updated`,
    count:    updated.modifiedCount,
  });
});

// @desc    Get grade by student and course
// @route   GET /api/grades/student/:studentId/course/:courseId
// @access  Faculty/Admin/Own student
const getStudentCourseGrade = asyncHandler(async (req, res) => {
  const grade = await Grade.findOne({
    student: req.params.studentId,
    course:  req.params.courseId,
  })
    .populate('course',  'title code credits')
    .populate('student', 'studentId');

  if (!grade) {
    res.status(404);
    throw new Error('Grade not found');
  }

  res.json(grade);
});

module.exports = {
  submitGrades,
  getCourseGrades,
  getMyGrades,
  approveGrades,
  getStudentCourseGrade,
  GRADE_SCALE,
};