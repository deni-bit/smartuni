const express = require('express');
const router  = express.Router();

const {
  getAllEnrollments,
  getMyEnrollments,
  enrollCourse,
  dropCourse,
  getCourseEnrollments,
} = require('../controllers/enrollmentController');

const { protect, adminOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.get('/',                         protect, adminOnly,      getAllEnrollments);
router.get('/my',                       protect,                 getMyEnrollments);
router.post('/',                        protect,                 enrollCourse);
router.patch('/:id/drop',               protect,                 dropCourse);
router.get('/course/:courseId',         protect, facultyOrAdmin, getCourseEnrollments);

module.exports = router;