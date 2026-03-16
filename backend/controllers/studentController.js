const asyncHandler = require('express-async-handler');
const Student      = require('../models/Student');
const User         = require('../models/User');
const Enrollment   = require('../models/Enrollment');
const Grade        = require('../models/Grade');
const Attendance   = require('../models/Attendance');
const Fee          = require('../models/Fee');
const Notification = require('../models/Notification');

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

  // Search by name or student ID
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

  // Students can only view their own profile
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

  // Enrollments
  const enrollments = await Enrollment.find({ student: student._id })
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

  // Fee summary
  const fees = await Fee.find({ student: student._id })
    .sort({ createdAt: -1 });

  const totalFees    = fees.reduce((sum, f) => sum + f.amount, 0);
  const totalPaid    = fees.reduce((sum, f) => sum + f.paid,   0);
  const totalBalance = fees.reduce((sum, f) => sum + f.balance,0);

  res.json({
    student,
    enrollments,
    notifications,
    feeSummary: {
      totalFees,
      totalPaid,
      totalBalance,
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

  // Admin can update everything, students can only update address/guardian
  let allowedFields = {};
  if (req.user.role === 'admin') {
    const { year, semester, status, department, guardianName, guardianPhone, address } = req.body;
    allowedFields = { year, semester, status, department, guardianName, guardianPhone, address };
  } else {
    const { guardianName, guardianPhone, address } = req.body;
    allowedFields = { guardianName, guardianPhone, address };
  }

  // Remove undefined fields
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

// @desc    Get student grades
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
    .sort({ academicYear: -1, semester: -1 });

  // Calculate GPA
  const completed = grades.filter(g => g.status === 'approved' && g.letterGrade !== 'I');
  let totalPoints  = 0;
  let totalCredits = 0;

  for (const g of completed) {
    const credits  = g.course?.credits || 0;
    totalPoints   += g.gradePoints * credits;
    totalCredits  += credits;
  }

  const gpa = totalCredits > 0
    ? parseFloat((totalPoints / totalCredits).toFixed(2))
    : 0;

  res.json({ grades, gpa, totalCredits });
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

  // Summary per course
  const summary = {};
  for (const record of attendance) {
    const courseId = record.course?._id?.toString();
    if (!courseId) continue;

    if (!summary[courseId]) {
      summary[courseId] = {
        course:   record.course,
        total:    0,
        present:  0,
        absent:   0,
        late:     0,
        excused:  0,
        percentage: 0,
      };
    }

    summary[courseId].total++;
    summary[courseId][record.status]++;
  }

  // Calculate percentage
  for (const key of Object.keys(summary)) {
    const s = summary[key];
    s.percentage = s.total > 0
      ? parseFloat(((s.present + s.excused) / s.total * 100).toFixed(1))
      : 0;
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

  const totalFees    = fees.reduce((sum, f) => sum + f.amount,  0);
  const totalPaid    = fees.reduce((sum, f) => sum + f.paid,    0);
  const totalBalance = fees.reduce((sum, f) => sum + f.balance, 0);

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