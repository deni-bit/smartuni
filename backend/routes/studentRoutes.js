const express = require('express');
const router  = express.Router();

const {
  getAllStudents,
  getStudentById,
  getMyProfile,
  updateStudent,
  getStudentGrades,
  getStudentAttendance,
  getStudentFees,
} = require('../controllers/studentController');

const { protect, adminOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.get('/',              protect, facultyOrAdmin, getAllStudents);
router.get('/me',            protect, getMyProfile);
router.get('/:id',           protect, getStudentById);
router.put('/:id',           protect, updateStudent);
router.get('/:id/grades',    protect, getStudentGrades);
router.get('/:id/attendance',protect, getStudentAttendance);
router.get('/:id/fees',      protect, getStudentFees);

module.exports = router;