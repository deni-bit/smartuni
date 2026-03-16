const asyncHandler = require('express-async-handler');
const Student      = require('../models/Student');
const User         = require('../models/User');
const Enrollment   = require('../models/Enrollment');
const Grade        = require('../models/Grade');
const Attendance   = require('../models/Attendance');
const Fee          = require('../models/Fee');
const Notification = require('../models/Notification');

// ── GPA helpers (5.0 scale) ───────────────────────────
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

// @desc    Get all students
// @route   GET /api/students
// @access  Admin/Faculty
const getAllStudents = asyncHandler(async (req, res) => {
  const { department, year, semester, status, search } = req.cleanQuery || req.query;

  const filter = {};
  if (department) filter.department = department;
  if (year)       filter.year       = Number(year);
  if (semester)   filter.semester   = Number(semester);
  if (status)     filter.status     = status;

  let students = await Student.find(filter)
    .populate('user',       'name email phone isActive')
    .populate('department', 'name code')
    .sort({ studentId: 1 });

  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s =>
      s.user?.name?.toLowerCase().includes(q) ||
      s.studentId?.toLowerCase().includes(q)  ||
      s.user?.email?.toLowerCase().includes(q)
    );
  }

  res.json(students);
});

// @desc    Get student by ID
// @route   GET /api/students/:id
// @access  Admin/Faculty/Own student
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user',       'name email phone isActive lastLogin')
    .populate('department', 'name code');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (
    req.user.role === 'student' &&
    student.user._id.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  res.json(student);
});

// @desc    Get my profile (logged-in student)
// @route   GET /api/students/me
// @access  Student
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user',       'name email phone lastLogin')
    .populate('department', 'name code');

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  // Current semester enrollments only
  const enrollments = await Enrollment.find({
    student: student._id,
    status:  'enrolled',
  })
    .populate({
      path: 'course',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'faculty',    populate: { path: 'user', select: 'name' } },
      ],
    });

  // Unread notifications
  const notifications = await Notification.find({
    recipient: req.user._id,
    isRead:    false,
  }).sort({ createdAt: -1 }).limit(10);

  // Fee summary — all fees
  const fees = await Fee.find({ student: student._id })
    .sort({ createdAt: -1 });

  const totalFees    = fees.reduce((s, f) => s + f.amount,  0);
  const totalPaid    = fees.reduce((s, f) => s + f.paid,    0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);
  const overdueCount = fees.filter(f => f.status === 'overdue').length;

  res.json({
    student,
    enrollments,
    notifications,
    feeSummary: {
      totalFees,
      totalPaid,
      totalBalance,
      overdueCount,
      records: fees,
    },
  });
});

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Admin/Own student
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (
    req.user.role === 'student' &&
    student.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  let allowedFields = {};
  if (req.user.role === 'admin') {
    const { year, semester, status, department, guardianName, guardianPhone, address } = req.body;
    allowedFields = { year, semester, status, department, guardianName, guardianPhone, address };
  } else {
    const { guardianName, guardianPhone, address } = req.body;
    allowedFields = { guardianName, guardianPhone, address };
  }

  Object.keys(allowedFields).forEach(k =>
    allowedFields[k] === undefined && delete allowedFields[k]
  );

  const updated = await Student.findByIdAndUpdate(
    req.params.id,
    allowedFields,
    { new: true, runValidators: true }
  ).populate('user', 'name email phone')
   .populate('department', 'name code');

  res.json({ success: true, student: updated });
});

// @desc    Get student grades with full history
// @route   GET /api/students/:id/grades
// @access  Admin/Faculty/Own student
const getStudentGrades = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (
    req.user.role === 'student' &&
    student.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
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

  // Supplementary courses
  const supplementary = approved.filter(g => g.letterGrade === 'D');
  const failed        = approved.filter(g => g.letterGrade === 'E');

  // Group by semester
  const bySemester = {};
  for (const g of grades) {
    const key = `Semester ${g.semester}`;
    if (!bySemester[key]) bySemester[key] = [];
    bySemester[key].push(g);
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
  });
});

// @desc    Get student attendance summary
// @route   GET /api/students/:id/attendance
// @access  Admin/Faculty/Own student
const getStudentAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (
    req.user.role === 'student' &&
    student.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  const attendance = await Attendance.find({ student: student._id })
    .populate('course', 'title code')
    .sort({ date: -1 });

  const summary = {};
  for (const record of attendance) {
    const courseId = record.course?._id?.toString();
    if (!courseId) continue;

    if (!summary[courseId]) {
      summary[courseId] = {
        course:     record.course,
        total:      0,
        present:    0,
        absent:     0,
        late:       0,
        excused:    0,
        percentage: 0,
      };
    }
    summary[courseId].total++;
    summary[courseId][record.status]++;
  }

  for (const key of Object.keys(summary)) {
    const s = summary[key];
    s.percentage = s.total > 0
      ? parseFloat(((s.present + s.excused) / s.total * 100).toFixed(1))
      : 0;
    // Flag low attendance
    s.lowAttendance = s.percentage < 75;
  }

  res.json({
    records: attendance,
    summary: Object.values(summary),
  });
});

// @desc    Get student fees
// @route   GET /api/students/:id/fees
// @access  Admin/Own student
const getStudentFees = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  if (
    req.user.role === 'student' &&
    student.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  const fees = await Fee.find({ student: student._id })
    .sort({ createdAt: -1 });

  const totalFees    = fees.reduce((s, f) => s + f.amount,  0);
  const totalPaid    = fees.reduce((s, f) => s + f.paid,    0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);

  res.json({ fees, totalFees, totalPaid, totalBalance });
});

module.exports = {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  getStudentGrades,
  getStudentAttendance,
  getStudentFees,
};