const express = require('express');
const router  = express.Router();

const {
  getAllFaculty,
  getFacultyById,
  getMyFacultyProfile,
  updateFaculty,
  getMyStudents,
} = require('../controllers/facultyController');

const { protect, adminOnly, facultyOnly } = require('../middleware/authMiddleware');

router.get('/',             protect, getAllFaculty);
router.get('/me',           protect, facultyOnly, getMyFacultyProfile);
router.get('/my-students',  protect, facultyOnly, getMyStudents);
router.get('/:id',          protect, getFacultyById);
router.put('/:id',          protect, updateFaculty);

module.exports = router;