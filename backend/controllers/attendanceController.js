const asyncHandler = require('express-async-handler');
const Attendance   = require('../models/Attendance');
const Course       = require('../models/Course');
const Student      = require('../models/Student');
const Faculty      = require('../models/Faculty');
const Enrollment   = require('../models/Enrollment');
const Notification = require('../models/Notification');

// @desc    Mark attendance for a course
// @route   POST /api/attendance/mark
// @access  Faculty/Admin
const markAttendance = asyncHandler(async (req, res) => {
  const { courseId, date, records } = req.body;

  // records = [{ studentId, status, remarks }]
  if (!courseId || !date || !records || !Array.isArray(records)) {
    res.status(400);
    throw new Error('Course ID, date and attendance records are required');
  }

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const attendanceDate = new Date(date);
  const results        = [];
  const warnings       = [];

  for (const record of records) {
    const { studentId, status, remarks } = record;

    try {
      // Upsert — update if exists, create if not
      const attendance = await Attendance.findOneAndUpdate(
        {
          student: studentId,
          course:  courseId,
          date:    attendanceDate,
        },
        {
          student:   studentId,
          course:    courseId,
          date:      attendanceDate,
          status:    status || 'absent',
          markedBy:  req.user._id,
          remarks:   remarks || '',
        },
        { upsert: true, new: true }
      );
      results.push(attendance);

      // Send notification if absent
      if (status === 'absent') {
        const student = await Student.findById(studentId).populate('user', '_id');
        if (student?.user) {
          await Notification.create({
            recipient: student.user._id,
            title:     'Attendance Alert',
            message:   `You were marked absent in ${course.title} on ${new Date(date).toLocaleDateString()}`,
            type:      'attendance',
            createdBy: req.user._id,
          });
        }
      }
    } catch (err) {
      warnings.push({ studentId, error: err.message });
    }
  }

  res.status(201).json({
    success:  true,
    message:  `Attendance marked for ${results.length} students`,
    marked:   results.length,
    warnings,
  });
});

// @desc    Get attendance for a course on a date
// @route   GET /api/attendance/course/:courseId
// @access  Faculty/Admin
const getCourseAttendance = asyncHandler(async (req, res) => {
  const { date, startDate, endDate } = req.cleanQuery || req.query;
  const { courseId }                  = req.params;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const filter = { course: courseId };

  if (date) {
    const d         = new Date(date);
    filter.date     = {
      $gte: new Date(d.setHours(0,  0,  0,  0)),
      $lte: new Date(d.setHours(23, 59, 59, 999)),
    };
  } else if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const attendance = await Attendance.find(filter)
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ date: -1 });

  // Summary
  const summary = {
    total:   attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent:  attendance.filter(a => a.status === 'absent').length,
    late:    attendance.filter(a => a.status === 'late').length,
    excused: attendance.filter(a => a.status === 'excused').length,
  };

  res.json({ course, attendance, summary });
});

// @desc    Get my attendance (student)
// @route   GET /api/attendance/my
// @access  Student
const getMyAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const { courseId } = req.cleanQuery || req.query;
  const filter       = { student: student._id };
  if (courseId) filter.course = courseId;

  const attendance = await Attendance.find(filter)
    .populate('course', 'title code')
    .sort({ date: -1 });

  // Summary per course
  const courseMap = {};
  for (const record of attendance) {
    const cid = record.course?._id?.toString();
    if (!cid) continue;

    if (!courseMap[cid]) {
      courseMap[cid] = {
        course:     record.course,
        total:      0,
        present:    0,
        absent:     0,
        late:       0,
        excused:    0,
        percentage: 0,
        records:    [],
      };
    }

    courseMap[cid].total++;
    courseMap[cid][record.status]++;
    courseMap[cid].records.push(record);
  }

  for (const key of Object.keys(courseMap)) {
    const c = courseMap[key];
    c.percentage = c.total > 0
      ? parseFloat(((c.present + c.excused) / c.total * 100).toFixed(1))
      : 0;
  }

  res.json({
    attendance,
    summary: Object.values(courseMap),
  });
});

// @desc    Get attendance summary for all courses (faculty)
// @route   GET /api/attendance/faculty-summary
// @access  Faculty
const getFacultyAttendanceSummary = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty profile not found');
  }

  const courses    = await Course.find({ faculty: faculty._id });
  const courseIds  = courses.map(c => c._id);

  const summary = [];

  for (const course of courses) {
    const enrollCount = await Enrollment.countDocuments({
      course: course._id,
      status: 'enrolled',
    });

    const totalAttendance = await Attendance.countDocuments({ course: course._id });
    const presentCount    = await Attendance.countDocuments({ course: course._id, status: 'present' });

    summary.push({
      course:          { _id: course._id, title: course.title, code: course.code },
      enrolledStudents: enrollCount,
      totalClasses:    Math.floor(totalAttendance / Math.max(enrollCount, 1)),
      avgAttendance:   totalAttendance > 0
        ? parseFloat((presentCount / totalAttendance * 100).toFixed(1))
        : 0,
    });
  }

  res.json(summary);
});

module.exports = {
  markAttendance,
  getCourseAttendance,
  getMyAttendance,
  getFacultyAttendanceSummary,
};