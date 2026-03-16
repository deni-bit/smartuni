const asyncHandler = require('express-async-handler');
const Fee          = require('../models/Fee');
const Student      = require('../models/Student');
const Notification = require('../models/Notification');
const { formatTZS, withTZS } = require('../utils/formatCurrency');

// ── Helper: format fee object with TZS ───────────────
const formatFee = (fee) => {
  const f = fee.toObject ? fee.toObject() : fee;
  return {
    ...f,
    amountFormatted:  formatTZS(f.amount),
    paidFormatted:    formatTZS(f.paid),
    balanceFormatted: formatTZS(f.balance),
    currency:         'TZS',
  };
};

// @desc    Get all fees
// @route   GET /api/fees
// @access  Admin
const getAllFees = asyncHandler(async (req, res) => {
  const { status, type, academicYear, semester } = req.cleanQuery || req.query;

  const filter = {};
  if (status)       filter.status       = status;
  if (type)         filter.type         = type;
  if (academicYear) filter.academicYear = academicYear;
  if (semester)     filter.semester     = Number(semester);

  const fees = await Fee.find(filter)
    .populate({
      path: 'student',
      populate: [
        { path: 'user',       select: 'name email phone' },
        { path: 'department', select: 'name code'        },
      ],
    })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  const totalAmount  = fees.reduce((s, f) => s + f.amount,  0);
  const totalPaid    = fees.reduce((s, f) => s + f.paid,    0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);

  res.json({
    fees: fees.map(formatFee),
    summary: {
      totalAmount,
      totalPaid,
      totalBalance,
      count:                fees.length,
      totalAmountFormatted:  formatTZS(totalAmount),
      totalPaidFormatted:    formatTZS(totalPaid),
      totalBalanceFormatted: formatTZS(totalBalance),
      currency:              'TZS',
    },
  });
});

// @desc    Get my fees (student)
// @route   GET /api/fees/my
// @access  Student
const getMyFees = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id });

  if (!student) {
    res.status(404);
    throw new Error('Student profile not found');
  }

  const fees = await Fee.find({ student: student._id })
    .sort({ createdAt: -1 });

  const totalAmount  = fees.reduce((s, f) => s + f.amount,  0);
  const totalPaid    = fees.reduce((s, f) => s + f.paid,    0);
  const totalBalance = fees.reduce((s, f) => s + f.balance, 0);
  const overdue      = fees.filter(f => f.status === 'overdue').length;

  res.json({
    fees: fees.map(formatFee),
    summary: {
      totalAmount,
      totalPaid,
      totalBalance,
      overdue,
      totalAmountFormatted:  formatTZS(totalAmount),
      totalPaidFormatted:    formatTZS(totalPaid),
      totalBalanceFormatted: formatTZS(totalBalance),
      currency:              'TZS',
    },
  });
});

// @desc    Create fee record
// @route   POST /api/fees
// @access  Admin
const createFee = asyncHandler(async (req, res) => {
  const {
    studentId, type, semester, academicYear,
    amount, dueDate, notes,
  } = req.body;

  if (!studentId || !type || !semester || !academicYear || !amount || !dueDate) {
    res.status(400);
    throw new Error('All required fields must be filled');
  }

  const student = await Student.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const existing = await Fee.findOne({
    student:      studentId,
    type,
    semester:     Number(semester),
    academicYear,
  });

  if (existing) {
    res.status(400);
    throw new Error(`${type} fee for semester ${semester} already exists`);
  }

  const fee = await Fee.create({
    student:      studentId,
    type,
    semester:     Number(semester),
    academicYear,
    amount:       Number(amount),
    paid:         0,
    currency:     'TZS',
    dueDate:      new Date(dueDate),
    notes:        notes || '',
    createdBy:    req.user._id,
  });

  // Notify student
  const studentDoc = await Student.findById(studentId).populate('user', '_id');
  if (studentDoc?.user) {
    await Notification.create({
      recipient: studentDoc.user._id,
      title:     'New Fee Invoice',
      message:   `A ${type} fee of ${formatTZS(Number(amount))} has been added for semester ${semester}. Due date: ${new Date(dueDate).toLocaleDateString('en-TZ')}`,
      type:      'fee',
      createdBy: req.user._id,
    });
  }

  res.status(201).json({ success: true, fee: formatFee(fee) });
});

// @desc    Record payment
// @route   PATCH /api/fees/:id/pay
// @access  Admin
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod, receiptNumber, notes } = req.body;

  if (!amount || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Valid payment amount is required');
  }

  const fee = await Fee.findById(req.params.id)
    .populate({
      path: 'student',
      populate: { path: 'user', select: '_id name' },
    });

  if (!fee) {
    res.status(404);
    throw new Error('Fee record not found');
  }

  if (fee.status === 'paid') {
    res.status(400);
    throw new Error('This fee has already been fully paid');
  }

  if (fee.status === 'waived') {
    res.status(400);
    throw new Error('This fee has been waived');
  }

  const paymentAmount = Number(amount);
  if (paymentAmount > fee.balance) {
    res.status(400);
    throw new Error(`Payment exceeds balance of ${formatTZS(fee.balance)}`);
  }

  fee.paid          += paymentAmount;
  fee.paymentMethod  = paymentMethod || fee.paymentMethod;
  fee.receiptNumber  = receiptNumber || fee.receiptNumber;
  if (notes) fee.notes = notes;
  await fee.save();

  // Notify student
  if (fee.student?.user) {
    await Notification.create({
      recipient: fee.student.user._id,
      title:     'Payment Received',
      message:   `Payment of ${formatTZS(paymentAmount)} received for ${fee.type} fee. ${
        fee.status === 'paid'
          ? 'Your fee is now fully paid. ✅'
          : `Remaining balance: ${formatTZS(fee.balance)}`
      }`,
      type:      'fee',
      createdBy: req.user._id,
    });
  }

  res.json({
    success: true,
    message: `Payment of ${formatTZS(paymentAmount)} recorded successfully`,
    fee:     formatFee(fee),
  });
});

// @desc    Waive fee
// @route   PATCH /api/fees/:id/waive
// @access  Admin
const waiveFee = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const fee = await Fee.findById(req.params.id);
  if (!fee) {
    res.status(404);
    throw new Error('Fee record not found');
  }

  fee.status = 'waived';
  fee.notes  = reason || 'Fee waived by admin';
  await fee.save();

  res.json({
    success: true,
    message: `Fee of ${formatTZS(fee.amount)} waived successfully`,
    fee:     formatFee(fee),
  });
});

// @desc    Get fee stats
// @route   GET /api/fees/stats
// @access  Admin
const getFeeStats = asyncHandler(async (req, res) => {
  const { academicYear } = req.cleanQuery || req.query;
  const filter           = academicYear ? { academicYear } : {};

  const totalInvoicedResult = await Fee.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  const totalCollectedResult = await Fee.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$paid' } } },
  ]);

  const byStatus = await Fee.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } },
  ]);

  const byType = await Fee.aggregate([
    { $match: filter },
    { $group: {
      _id:   '$type',
      count: { $sum: 1 },
      total: { $sum: '$amount' },
      paid:  { $sum: '$paid'   },
    }},
    { $sort: { total: -1 } },
  ]);

  const totalInvoiced  = totalInvoicedResult[0]?.total  || 0;
  const totalCollected = totalCollectedResult[0]?.total || 0;
  const totalBalance   = totalInvoiced - totalCollected;

  res.json({
    currency:               'TZS',
    totalInvoiced,
    totalCollected,
    totalBalance,
    totalInvoicedFormatted:  formatTZS(totalInvoiced),
    totalCollectedFormatted: formatTZS(totalCollected),
    totalBalanceFormatted:   formatTZS(totalBalance),
    collectionRate:          totalInvoiced > 0
      ? parseFloat((totalCollected / totalInvoiced * 100).toFixed(1))
      : 0,
    byStatus: byStatus.map(s => ({
      ...s,
      amountFormatted: formatTZS(s.amount),
    })),
    byType: byType.map(t => ({
      ...t,
      totalFormatted: formatTZS(t.total),
      paidFormatted:  formatTZS(t.paid),
      balance:        t.total - t.paid,
      balanceFormatted: formatTZS(t.total - t.paid),
    })),
  });
});

module.exports = {
  getAllFees,
  getMyFees,
  createFee,
  recordPayment,
  waiveFee,
  getFeeStats,
};