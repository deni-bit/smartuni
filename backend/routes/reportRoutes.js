const express = require('express');
const router  = express.Router();

const {
  getSummary,
  getEnrollmentByDepartment,
  getGradeDistribution,
  getFeeCollection,
  getTopStudents,
  getAttendanceReport,
  getFinancialOverview,
} = require('../controllers/reportController');

const { protect, adminOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.get('/summary',                  protect, adminOnly,      getSummary);
router.get('/enrollment-by-department', protect, adminOnly,      getEnrollmentByDepartment);
router.get('/grade-distribution',       protect, adminOnly,      getGradeDistribution);
router.get('/fee-collection',           protect, adminOnly,      getFeeCollection);
router.get('/financial-overview',       protect, adminOnly,      getFinancialOverview);
router.get('/top-students',             protect, facultyOrAdmin, getTopStudents);
router.get('/attendance',               protect, facultyOrAdmin, getAttendanceReport);

module.exports = router;