const express = require('express');
const router  = express.Router();

const {
  submitGrades,
  getCourseGrades,
  getMyGrades,
  approveGrades,
  getStudentCourseGrade,
} = require('../controllers/gradeController');

const { protect, adminOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.post('/submit',                              protect, facultyOrAdmin, submitGrades);
router.get('/my',                                   protect,                 getMyGrades);
router.patch('/approve/:courseId',                  protect, adminOnly,      approveGrades);
router.get('/course/:courseId',                     protect, facultyOrAdmin, getCourseGrades);
router.get('/student/:studentId/course/:courseId',  protect, facultyOrAdmin, getStudentCourseGrade);

module.exports = router;