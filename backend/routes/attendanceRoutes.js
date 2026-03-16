const express = require('express');
const router  = express.Router();

const {
  markAttendance,
  getCourseAttendance,
  getMyAttendance,
  getFacultyAttendanceSummary,
} = require('../controllers/attendanceController');

const { protect, facultyOrAdmin, facultyOnly } = require('../middleware/authMiddleware');

router.post('/mark',                    protect, facultyOrAdmin, markAttendance);
router.get('/my',                       protect,                 getMyAttendance);
router.get('/faculty-summary',          protect, facultyOnly,    getFacultyAttendanceSummary);
router.get('/course/:courseId',         protect, facultyOrAdmin, getCourseAttendance);

module.exports = router;