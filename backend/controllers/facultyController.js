const asyncHandler = require('express-async-handler');
const Faculty      = require('../models/Faculty');
const User         = require('../models/User');
const Course       = require('../models/Course');
const Enrollment   = require('../models/Enrollment');
const Student      = require('../models/Student');

// @desc    Get all faculty
// @route   GET /api/faculty
// @access  Admin/Public
const getAllFaculty = asyncHandler(async (req, res) => {
  const { department, designation, search } = req.cleanQuery || req.query;

  const filter = { isActive: true };
  if (department)   filter.department   = department;
  if (designation)  filter.designation  = designation;

  let faculty = await Faculty.find(filter)
    .populate('user',       'name email phone')
    .populate('department', 'name code')
    .sort({ facultyId: 1 });

  if (search) {
    const q = search.toLowerCase();
    faculty  = faculty.filter(f =>
      f.user?.name?.toLowerCase().includes(q)  ||
      f.facultyId?.toLowerCase().includes(q)   ||
      f.specialization?.toLowerCase().includes(q)
    );
  }

  res.json(faculty);
});

// @desc    Get faculty by ID
// @route   GET /api/faculty/:id
// @access  Private
const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('user',       'name email phone lastLogin')
    .populate('department', 'name code');

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty not found');
  }

  // Get courses taught
  const courses = await Course.find({ faculty: faculty._id })
    .populate('department', 'name code')
    .sort({ year: 1, semester: 1 });

  res.json({ faculty, courses });
});

// @desc    Get my profile (logged-in faculty)
// @route   GET /api/faculty/me
// @access  Faculty
const getMyFacultyProfile = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id })
    .populate('user',       'name email phone lastLogin')
    .populate('department', 'name code');

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty profile not found');
  }

  // My courses
  const courses = await Course.find({ faculty: faculty._id })
    .populate('department', 'name code')
    .sort({ year: 1, semester: 1 });

  // Total students across all my courses
  const courseIds    = courses.map(c => c._id);
  const enrollments  = await Enrollment.countDocuments({
    course: { $in: courseIds },
    status: 'enrolled',
  });

  res.json({ faculty, courses, totalStudents: enrollments });
});

// @desc    Update faculty profile
// @route   PUT /api/faculty/:id
// @access  Admin/Own faculty
const updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty not found');
  }

  if (
    req.user.role === 'faculty' &&
    faculty.user.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Access denied');
  }

  const { designation, qualification, specialization } = req.body;
  const allowedFields = {};

  if (designation)   allowedFields.designation   = designation;
  if (qualification) allowedFields.qualification = qualification;
  if (specialization)allowedFields.specialization= specialization;

  if (req.user.role === 'admin' && req.body.department) {
    allowedFields.department = req.body.department;
  }

  const updated = await Faculty.findByIdAndUpdate(
    req.params.id,
    allowedFields,
    { new: true }
  ).populate('user',       'name email phone')
   .populate('department', 'name code');

  res.json({ success: true, faculty: updated });
});

// @desc    Get students in faculty's courses
// @route   GET /api/faculty/my-students
// @access  Faculty
const getMyStudents = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });

  if (!faculty) {
    res.status(404);
    throw new Error('Faculty profile not found');
  }

  const courses = await Course.find({ faculty: faculty._id });
  const courseIds = courses.map(c => c._id);

  const enrollments = await Enrollment.find({
    course: { $in: courseIds },
    status: 'enrolled',
  })
    .populate({
      path: 'student',
      populate: [
        { path: 'user',       select: 'name email phone' },
        { path: 'department', select: 'name code'        },
      ],
    })
    .populate('course', 'title code');

  // Deduplicate students
  const studentMap = {};
  for (const enr of enrollments) {
    const sid = enr.student?._id?.toString();
    if (sid && !studentMap[sid]) {
      studentMap[sid] = {
        student: enr.student,
        courses: [],
      };
    }
    if (sid) {
      studentMap[sid].courses.push(enr.course);
    }
  }

  res.json(Object.values(studentMap));
});

module.exports = {
  getAllFaculty,
  getFacultyById,
  getMyFacultyProfile,
  updateFaculty,
  getMyStudents,
};