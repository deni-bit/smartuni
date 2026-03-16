const express = require('express');
const router  = express.Router();

const {
  getAllFees,
  getMyFees,
  createFee,
  recordPayment,
  waiveFee,
  getFeeStats,
} = require('../controllers/feeController');

const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/',              protect, adminOnly, getAllFees);
router.get('/my',            protect,            getMyFees);
router.get('/stats',         protect, adminOnly, getFeeStats);
router.post('/',             protect, adminOnly, createFee);
router.patch('/:id/pay',     protect, adminOnly, recordPayment);
router.patch('/:id/waive',   protect, adminOnly, waiveFee);

module.exports = router;