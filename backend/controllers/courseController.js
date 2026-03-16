const asyncHandler = require('express-async-handler');
const Course       = require('../models/Course');
const Department   = require('../models/Department');
const Faculty      = require('../models/Faculty');
const Enrollment   = require('../models/Enrollment');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const { department, year, semester, status, search } = req.cleanQuery || req.query;

  const filter = {};
  if (department) filter.department = department;
  if (year)       filter.year       = Number(year);
  if (semester)   filter.semester   = Number(semester);
  if (status)     filter.status     = status;
  if (search)     filter.title      = { $regex: search, $options: 'i' };

  const courses = await Course.find(filter)
    .populate('department', 'name code')
    .populate({ path: 'faculty', populate: { path: 'user', select: 'name email' } })
    .sort({ year: 1, semester: 1, title: 1 });

  res.json(courses);
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate('department', 'name code')
    .populate({ path: 'faculty', populate: { path: 'user', select: 'name email phone' } });

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  res.json(course);
});

// @desc    Create course
// @route   POST /api/courses
// @access  Admin
const createCourse = asyncHandler(async (req, res) => {
  const {
    title, code, description, department,
    faculty, credits, semester, year,
    capacity, schedule, academicYear,
  } = req.body;

  if (!title || !code || !department || !credits || !semester || !year || !academicYear) {
    res.status(400);
    throw new Error('Please fill in all required fields');
  }

  const dept = await Department.findById(department);
  if (!dept) {
    res.status(404);
    throw new Error('Department not found');
  }

  const course = await Course.create({
    title:       title.trim(),
    code:        code.toUpperCase().trim(),
    description: description || '',
    department,
    faculty:     faculty || null,
    credits:     Number(credits),
    semester:    Number(semester),
    year:        Number(year),
    capacity:    capacity || 50,
    academicYear,
    schedule:    schedule || {},
  });

  const populated = await Course.findById(course._id)
    .populate('department', 'name code')
    .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } });

  res.status(201).json(populated);
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Admin
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const {
    currentBid, enrolled,
    ...safeFields
  } = req.body;

  const updated = await Course.findByIdAndUpdate(
    req.params.id,
    safeFields,
    { new: true, runValidators: true }
  ).populate('department', 'name code')
   .populate({ path: 'faculty', populate: { path: 'user', select: 'name' } });

  res.json(updated);
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);

  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  if (course.enrolled > 0) {
    res.status(400);
    throw new Error('Cannot delete a course with enrolled students');
  }

  await course.deleteOne();

  res.json({ success: true, message: 'Course deleted successfully' });
});

// @desc    Get courses by faculty
// @route   GET /api/courses/faculty/:facultyId
// @access  Faculty/Admin
const getCoursesByFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.facultyId);

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty not found');
  }

  const courses = await Course.find({ faculty: faculty._id })
    .populate('department', 'name code')
    .sort({ year: 1, semester: 1 });

  res.json(courses);
});

// @desc    Get my courses (for logged-in faculty)
// @route   GET /api/courses/my
// @access  Faculty
const getMyCourses = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty profile not found');
  }

  const courses = await Course.find({ faculty: faculty._id })
    .populate('department', 'name code')
    .sort({ year: 1, semester: 1 });

  res.json(courses);
});

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByFaculty,
  getMyCourses,
};