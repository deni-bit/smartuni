const express = require('express');
const router  = express.Router();

const {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByFaculty,
  getMyCourses,
} = require('../controllers/courseController');

const { protect, adminOnly, facultyOnly, facultyOrAdmin } = require('../middleware/authMiddleware');

router.get('/',                        getCourses);
router.post('/',                       protect, adminOnly, createCourse);
router.get('/my',                      protect, facultyOnly, getMyCourses);
router.get('/faculty/:facultyId',      protect, facultyOrAdmin, getCoursesByFaculty);
router.get('/:id',                     protect, getCourseById);
router.put('/:id',                     protect, adminOnly, updateCourse);
router.delete('/:id',                  protect, adminOnly, deleteCourse);

module.exports = router;