const asyncHandler = require('express-async-handler');
const mongoose     = require('mongoose');
const User         = require('../models/User');
const Student      = require('../models/Student');
const Faculty      = require('../models/Faculty');
const Course       = require('../models/Course');
const Enrollment   = require('../models/Enrollment');
const Attendance   = require('../models/Attendance');
const Grade        = require('../models/Grade');
const Fee          = require('../models/Fee');
const Department   = require('../models/Department');
const { formatTZS } = require('../utils/formatCurrency');

// @desc    Get admin summary
// @route   GET /api/reports/summary
// @access  Admin
const getSummary = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    totalFaculty,
    totalCourses,
    totalDepartments,
    activeStudents,
    totalEnrollments,
    pendingFees,
    overdueFees,
  ] = await Promise.all([
    Student.countDocuments(),
    Faculty.countDocuments({ isActive: true }),
    Course.countDocuments({ status: 'active' }),
    Department.countDocuments({ isActive: true }),
    Student.countDocuments({ status: 'active' }),
    Enrollment.countDocuments({ status: 'enrolled' }),
    Fee.countDocuments({ status: 'pending'  }),
    Fee.countDocuments({ status: 'overdue'  }),
  ]);

  // ── Fee summary ───────────────────────────────────
  const feeResult = await Fee.aggregate([
    {
      $group: {
        _id:            null,
        totalInvoiced:  { $sum: '$amount' },
        totalCollected: { $sum: '$paid'   },
      },
    },
  ]);

  const totalInvoiced  = feeResult[0]?.totalInvoiced  || 0;
  const totalCollected = feeResult[0]?.totalCollected || 0;
  const totalBalance   = totalInvoiced - totalCollected;
  const collectionRate = totalInvoiced > 0
    ? parseFloat((totalCollected / totalInvoiced * 100).toFixed(1))
    : 0;

  // ── Average GPA ───────────────────────────────────
  const gpaResult = await Student.aggregate([
    { $match: { gpa: { $gt: 0 } } },
    { $group: { _id: null, avgGpa: { $avg: '$gpa' } } },
  ]);
  const avgGpa = parseFloat((gpaResult[0]?.avgGpa || 0).toFixed(2));

  // ── Attendance rate ───────────────────────────────
  const totalAttendance   = await Attendance.countDocuments();
  const presentAttendance = await Attendance.countDocuments({ status: 'present' });
  const attendanceRate    = totalAttendance > 0
    ? parseFloat((presentAttendance / totalAttendance * 100).toFixed(1))
    : 0;

  // ── Grade stats ───────────────────────────────────
  const totalGrades     = await Grade.countDocuments({ status: 'approved' });
  const passingGrades   = await Grade.countDocuments({
    status:      'approved',
    letterGrade: { $nin: ['F', 'I'] },
  });
  const passRate = totalGrades > 0
    ? parseFloat((passingGrades / totalGrades * 100).toFixed(1))
    : 0;

  res.json({
    // ── Counts ──
    totalStudents,
    totalFaculty,
    totalCourses,
    totalDepartments,
    activeStudents,
    totalEnrollments,
    pendingFees,
    overdueFees,

    // ── Academic ──
    avgGpa,
    attendanceRate,
    passRate,
    totalGrades,

    // ── Finance in TZS ──
    currency:               'TZS',
    totalInvoiced,
    totalCollected,
    totalBalance,
    collectionRate,
    totalInvoicedFormatted:  formatTZS(totalInvoiced),
    totalCollectedFormatted: formatTZS(totalCollected),
    totalBalanceFormatted:   formatTZS(totalBalance),
  });
});

// @desc    Get enrollment stats by department
// @route   GET /api/reports/enrollment-by-department
// @access  Admin
const getEnrollmentByDepartment = asyncHandler(async (req, res) => {
  const data = await Student.aggregate([
    {
      $group: {
        _id:    '$department',
        count:  { $sum: 1 },
        avgGpa: { $avg: '$gpa' },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from:         'departments',
        localField:   '_id',
        foreignField: '_id',
        as:           'department',
      },
    },
    { $unwind: '$department' },
    {
      $project: {
        name:   '$department.name',
        code:   '$department.code',
        count:  1,
        active: 1,
        avgGpa: { $round: ['$avgGpa', 2] },
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.json(data);
});

// @desc    Get grade distribution
// @route   GET /api/reports/grade-distribution
// @access  Admin
const getGradeDistribution = asyncHandler(async (req, res) => {
  const { academicYear } = req.cleanQuery || req.query;

  const match = { status: 'approved' };
  if (academicYear) match.academicYear = academicYear;

  const data = await Grade.aggregate([
    { $match: match },
    {
      $group: {
        _id:      '$letterGrade',
        count:    { $sum: 1 },
        avgMarks: { $avg: '$totalMarks' },
      },
    },
    {
      $project: {
        grade:    '$_id',
        count:    1,
        avgMarks: { $round: ['$avgMarks', 1] },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Total for percentage calculation
  const total = data.reduce((s, d) => s + d.count, 0);

  const withPercentage = data.map(d => ({
    ...d,
    percentage: total > 0
      ? parseFloat((d.count / total * 100).toFixed(1))
      : 0,
  }));

  res.json({ distribution: withPercentage, total });
});

// @desc    Get fee collection report
// @route   GET /api/reports/fee-collection
// @access  Admin
const getFeeCollection = asyncHandler(async (req, res) => {
  const { academicYear } = req.cleanQuery || req.query;
  const match            = academicYear ? { academicYear } : {};

  // ── By month ─────────────────────────────────────
  const byMonth = await Fee.aggregate([
    { $match: { ...match, paidDate: { $ne: null } } },
    {
      $group: {
        _id: {
          year:  { $year:  '$paidDate' },
          month: { $month: '$paidDate' },
        },
        collected: { $sum: '$paid'   },
        invoiced:  { $sum: '$amount' },
        count:     { $sum: 1         },
      },
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);

  // ── By department ─────────────────────────────────
  const byDepartment = await Fee.aggregate([
    { $match: match },
    {
      $lookup: {
        from:         'students',
        localField:   'student',
        foreignField: '_id',
        as:           'studentInfo',
      },
    },
    { $unwind: '$studentInfo' },
    {
      $group: {
        _id:       '$studentInfo.department',
        invoiced:  { $sum: '$amount' },
        collected: { $sum: '$paid'   },
        count:     { $sum: 1         },
      },
    },
    {
      $lookup: {
        from:         'departments',
        localField:   '_id',
        foreignField: '_id',
        as:           'dept',
      },
    },
    { $unwind: '$dept' },
    {
      $project: {
        name:      '$dept.name',
        code:      '$dept.code',
        invoiced:  1,
        collected: 1,
        count:     1,
        balance:   { $subtract: ['$invoiced', '$collected'] },
        rate: {
          $round: [
            { $multiply: [{ $divide: ['$collected', '$invoiced'] }, 100] },
            1,
          ],
        },
      },
    },
    { $sort: { invoiced: -1 } },
  ]);

  // ── By fee type ───────────────────────────────────
  const byType = await Fee.aggregate([
    { $match: match },
    {
      $group: {
        _id:       '$type',
        invoiced:  { $sum: '$amount' },
        collected: { $sum: '$paid'   },
        count:     { $sum: 1         },
      },
    },
    {
      $project: {
        type:      '$_id',
        invoiced:  1,
        collected: 1,
        count:     1,
        balance:   { $subtract: ['$invoiced', '$collected'] },
      },
    },
    { $sort: { invoiced: -1 } },
  ]);

  // Add TZS formatting
  const formatList = (list) =>
    list.map(item => ({
      ...item,
      invoicedFormatted:  formatTZS(item.invoiced  || 0),
      collectedFormatted: formatTZS(item.collected || 0),
      balanceFormatted:   formatTZS(item.balance   || 0),
    }));

  res.json({
    currency:      'TZS',
    byMonth:       byMonth.map(m => ({
      ...m,
      collectedFormatted: formatTZS(m.collected || 0),
      invoicedFormatted:  formatTZS(m.invoiced  || 0),
    })),
    byDepartment:  formatList(byDepartment),
    byType:        formatList(byType),
  });
});

// @desc    Get top students by GPA
// @route   GET /api/reports/top-students
// @access  Admin/Faculty
const getTopStudents = asyncHandler(async (req, res) => {
  const { department, limit } = req.cleanQuery || req.query;

  const match = { gpa: { $gt: 0 }, status: 'active' };
  if (department) {
    match.department = new mongoose.Types.ObjectId(department);
  }

  const students = await Student.find(match)
    .populate('user',       'name email phone')
    .populate('department', 'name code')
    .sort({ gpa: -1 })
    .limit(Number(limit) || 10);

  res.json(students);
});

// @desc    Get attendance report by course
// @route   GET /api/reports/attendance
// @access  Admin/Faculty
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { courseId, startDate, endDate } = req.cleanQuery || req.query;

  const match = {};
  if (courseId) {
    match.course = new mongoose.Types.ObjectId(courseId);
  }
  if (startDate && endDate) {
    match.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const data = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id:     '$course',
        total:   { $sum: 1 },
        present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
        absent:  { $sum: { $cond: [{ $eq: ['$status', 'absent']  }, 1, 0] } },
        late:    { $sum: { $cond: [{ $eq: ['$status', 'late']    }, 1, 0] } },
        excused: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } },
      },
    },
    {
      $lookup: {
        from:         'courses',
        localField:   '_id',
        foreignField: '_id',
        as:           'course',
      },
    },
    { $unwind: '$course' },
    {
      $project: {
        courseTitle: '$course.title',
        courseCode:  '$course.code',
        total:       1,
        present:     1,
        absent:      1,
        late:        1,
        excused:     1,
        rate: {
          $round: [
            { $multiply: [{ $divide: ['$present', '$total'] }, 100] },
            1,
          ],
        },
      },
    },
    { $sort: { rate: -1 } },
  ]);

  res.json(data);
});

// @desc    Get financial overview
// @route   GET /api/reports/financial-overview
// @access  Admin
const getFinancialOverview = asyncHandler(async (req, res) => {
  const { academicYear } = req.cleanQuery || req.query;
  const match            = academicYear ? { academicYear } : {};

  const overview = await Fee.aggregate([
    { $match: match },
    {
      $group: {
        _id:      '$status',
        count:    { $sum: 1 },
        amount:   { $sum: '$amount' },
        paid:     { $sum: '$paid'   },
        balance:  { $sum: '$balance'},
      },
    },
  ]);

  const result = {
    pending:  { count: 0, amount: 0, paid: 0, balance: 0 },
    partial:  { count: 0, amount: 0, paid: 0, balance: 0 },
    paid:     { count: 0, amount: 0, paid: 0, balance: 0 },
    overdue:  { count: 0, amount: 0, paid: 0, balance: 0 },
    waived:   { count: 0, amount: 0, paid: 0, balance: 0 },
  };

  for (const item of overview) {
    if (result[item._id]) {
      result[item._id] = {
        count:           item.count,
        amount:          item.amount,
        paid:            item.paid,
        balance:         item.balance,
        amountFormatted: formatTZS(item.amount),
        paidFormatted:   formatTZS(item.paid),
        balanceFormatted:formatTZS(item.balance),
      };
    }
  }

  const totals = Object.values(result).reduce(
    (acc, cur) => ({
      count:   acc.count   + cur.count,
      amount:  acc.amount  + cur.amount,
      paid:    acc.paid    + cur.paid,
      balance: acc.balance + cur.balance,
    }),
    { count: 0, amount: 0, paid: 0, balance: 0 }
  );

  res.json({
    currency:         'TZS',
    byStatus:         result,
    totals: {
      ...totals,
      amountFormatted:  formatTZS(totals.amount),
      paidFormatted:    formatTZS(totals.paid),
      balanceFormatted: formatTZS(totals.balance),
      collectionRate:   totals.amount > 0
        ? parseFloat((totals.paid / totals.amount * 100).toFixed(1))
        : 0,
    },
  });
});

module.exports = {
  getSummary,
  getEnrollmentByDepartment,
  getGradeDistribution,
  getFeeCollection,
  getTopStudents,
  getAttendanceReport,
  getFinancialOverview,
};