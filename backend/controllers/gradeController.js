const asyncHandler = require('express-async-handler');
const Grade        = require('../models/Grade');
const Student      = require('../models/Student');
const Course       = require('../models/Course');
const Faculty      = require('../models/Faculty');
const Enrollment   = require('../models/Enrollment');
const Notification = require('../models/Notification');

// @desc    Submit grades for a course
// @route   POST /api/grades/submit
// @access  Faculty/Admin
const submitGrades = asyncHandler(async (req, res) => {
  const { courseId, academicYear, semester, grades } = req.body;

  // grades = [{ studentId, enrollmentId, assignment, midterm, finalExam, remarks }]
  if (!courseId || !grades || !Array.isArray(grades)) {
    res.status(400);
    throw new Error('Course ID and grades array are required');
  }

  const course  = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found');
  }

  const results  = [];
  const errors   = [];

  for (const g of grades) {
    const { studentId, enrollmentId, assignment, midterm, finalExam, remarks } = g;

    try {
      const grade = await Grade.findOneAndUpdate(
        { student: studentId, course: courseId, academicYear },
        {
          student:      studentId,
          course:       courseId,
          enrollment:   enrollmentId,
          semester:     semester || course.semester,
          academicYear: academicYear || '2025/2026',
          assignment:   Number(assignment)  || 0,
          midterm:      Number(midterm)     || 0,
          finalExam:    Number(finalExam)   || 0,
          status:       'submitted',
          submittedBy:  req.user._id,
          remarks:      remarks || '',
        },
        { upsert: true, new: true, runValidators: true }
      );

      results.push(grade);

      // Notify student
      const student = await Student.findById(studentId).populate('user', '_id name');
      if (student?.user) {
        await Notification.create({
          recipient: student.user._id,
          title:     'Grades Submitted',
          message:   `Your grades for ${course.title} have been submitted. Letter Grade: ${grade.letterGrade}`,
          type:      'grade',
          createdBy: req.user._id,
        });
      }
    } catch (err) {
      errors.push({ studentId, error: err.message });
    }
  }

  res.status(201).json({
    success:  true,
    message:  `Grades submitted for ${results.length} students`,
    submitted: results.length,
    errors,
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
    .populate({
      path: 'student',
      populate: { path: 'user', select: 'name email' },
    })
    .sort({ 'student.user.name': 1 });

  // Stats
  const submitted  = grades.filter(g => g.status !== 'pending');
  const avgMarks   = submitted.length > 0
    ? parseFloat((submitted.reduce((s, g) => s + g.totalMarks, 0) / submitted.length).toFixed(1))
    : 0;

  const distribution = { 'A+':0,'A':0,'A-':0,'B+':0,'B':0,'B-':0,'C+':0,'C':0,'C-':0,'D':0,'F':0,'I':0 };
  for (const g of grades) distribution[g.letterGrade]++;

  res.json({ course, grades, stats: { avgMarks, distribution, total: grades.length } });
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
    .sort({ academicYear: -1, semester: -1 });

  // GPA calculation
  const approved     = grades.filter(g => g.status === 'approved' && g.letterGrade !== 'I');
  let totalPoints    = 0;
  let totalCredits   = 0;

  for (const g of approved) {
    const credits   = g.course?.credits || 0;
    totalPoints    += g.gradePoints * credits;
    totalCredits   += credits;
  }

  const gpa = totalCredits > 0
    ? parseFloat((totalPoints / totalCredits).toFixed(2))
    : 0;

  // Group by academic year
  const byYear = {};
  for (const g of grades) {
    if (!byYear[g.academicYear]) byYear[g.academicYear] = [];
    byYear[g.academicYear].push(g);
  }

  res.json({ grades, gpa, totalCredits, byYear });
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

  // Update student GPAs
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

    let totalPoints  = 0;
    let totalCredits = 0;

    for (const g of allGrades) {
      const credits   = g.course?.credits || 0;
      totalPoints    += g.gradePoints * credits;
      totalCredits   += credits;
    }

    const gpa = totalCredits > 0
      ? parseFloat((totalPoints / totalCredits).toFixed(2))
      : 0;

    await Student.findByIdAndUpdate(grade.student, {
      gpa,
      totalCredits,
    });
  }

  res.json({
    success: true,
    message: `${updated.modifiedCount} grades approved`,
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
};