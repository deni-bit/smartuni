const asyncHandler = require('express-async-handler');
const Enrollment   = require('../models/Enrollment');
const Course       = require('../models/Course');
const Student      = require('../models/Student');

// @desc    Get all enrollments
// @route   GET /api/enrollments
// @access  Admin
const getAllEnrollments = asyncHandler(async (req, res) => {
  const { course, student, status, academicYear } = req.cleanQuery || req.query;

  const filter = {};
  if (course)       filter.course       = course;
  if (student)      filter.student      = student;
  if (status)       filter.status       = status;
  if (academicYear) filter.academicYear = academicYear;

  const enrollments = await Enrollment.find(filter)
    .populate({
      path: 'student',
      populate: [
        { path: 'user',       select: 'name email' },
        { path: 'department', select: 'name code'  },
      ],
    })
    .populate('course', 'title code credits semester year')
    .sort({ createdAt: -1 });

  res.json(enrollments);
});

// @desc    Get my enrollments (student)
// @route   GET /api/enrollments/my
// @access  Student
const getMyEnrollments = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const enrollments = await Enrollment.find({ student: student._id })
    .populate({
      path: 'course',
      populate: [
        { path: 'department', select: 'name code' },
        { path: 'faculty',    populate: { path: 'user', select: 'name' } },
      ],
    })
    .sort({ createdAt: -1 });

  res.json(enrollments);
});

// @desc    Enroll student in course
// @route   POST /api/enrollments
// @access  Student/Admin
const enrollCourse = asyncHandler(async (req, res) => {
  const { courseId, academicYear } = req.body;

  if (!courseId || !academicYear) {
    res.status(400);
    throw new Error('Course ID and academic year are required');
  }

  // Get student profile
  let student;
  if (req.user.role === 'student') {
    student = await Student.findOne({ user: req.user._id });
  } else if (req.body.studentId) {
    student = await Student.findById(req.body.studentId);
  }

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  // Check course exists
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.status !== 'active') {
    res.status(400);
    throw new Error('Course is not active');
  }

  // Check capacity
  if (course.enrolled >= course.capacity) {
    res.status(400);
    throw new Error('Course is full — no seats available');
  }

  // Check duplicate enrollment
  const existing = await Enrollment.findOne({
    student:      student._id,
    course:       courseId,
    academicYear,
  });

  if (existing) {
    res.status(400);
    throw new Error('Already enrolled in this course');
  }

  // Create enrollment
  const enrollment = await Enrollment.create({
    student:      student._id,
    course:       courseId,
    semester:     student.semester,
    academicYear,
    status:       'enrolled',
  });

  // Increment enrolled count
  await Course.findByIdAndUpdate(courseId, { $inc: { enrolled: 1 } });

  const populated = await Enrollment.findById(enrollment._id)
    .populate({
      path: 'course',
      populate: { path: 'department', select: 'name code' },
    })
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    });

  res.status(201).json({
    success: true,
    message: `Successfully enrolled in ${course.title}`,
    enrollment: populated,
  });
});

// @desc    Drop course
// @route   PATCH /api/enrollments/:id/drop
// @access  Student/Admin
const dropCourse = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('student');

  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found');
  }

  // Students can only drop their own enrollments
  if (req.user.role === 'student') {
    const student = await Student.findOne({ user: req.user._id });
    if (enrollment.student._id.toString() !== student?._id.toString()) {
      res.status(403);
      throw new Error('Access denied');
    }
  }

  if (enrollment.status === 'dropped') {
    res.status(400);
    throw new Error('Already dropped this course');
  }

  if (enrollment.status === 'completed') {
    res.status(400);
    throw new Error('Cannot drop a completed course');
  }

  enrollment.status = 'dropped';
  await enrollment.save();

  // Decrement enrolled count
  await Course.findByIdAndUpdate(enrollment.course, { $inc: { enrolled: -1 } });

  res.json({ success: true, message: 'Course dropped successfully' });
});

// @desc    Get enrollments for a course
// @route   GET /api/enrollments/course/:courseId
// @access  Faculty/Admin
const getCourseEnrollments = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.courseId);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const enrollments = await Enrollment.find({
    course:  req.params.courseId,
    status: 'enrolled',
  })
    .populate({
      path: 'student',
      populate: [
        { path: 'user',       select: 'name email phone' },
        { path: 'department', select: 'name code'        },
      ],
    })
    .sort({ createdAt: 1 });

  res.json({ course, enrollments, count: enrollments.length });
});

module.exports = {
  getAllEnrollments,
  getMyEnrollments,
  enrollCourse,
  dropCourse,
  getCourseEnrollments,
};