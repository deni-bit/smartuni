const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    type: {
      type: String,
      enum: ['tuition', 'hostel', 'library', 'exam', 'registration', 'other'],
      required: true,
    },
    semester:     { type: Number, required: true },
    academicYear: { type: String, required: true },

    // ── Amounts in TZS ────────────────────────────────
    amount:   { type: Number, required: true, min: 0 },
    paid:     { type: Number, default: 0,     min: 0 },
    balance:  { type: Number, default: 0             },
    currency: { type: String, default: 'TZS'         },

    dueDate:  { type: Date, required: true },
    paidDate: { type: Date, default: null  },

    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'waived'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'card', 'scholarship'],
      default: 'cash',
    },
    receiptNumber: { type: String, default: '' },
    notes:         { type: String, default: '' },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Auto calculate balance & status ───────────────────
feeSchema.pre('save', function () {
  this.balance = this.amount - this.paid;

  if (this.status === 'waived') return;

  if (this.paid >= this.amount) {
    this.status   = 'paid';
    this.paidDate = this.paidDate || new Date();
  } else if (this.paid > 0) {
    this.status = 'partial';
  } else if (new Date() > new Date(this.dueDate)) {
    this.status = 'overdue';
  } else {
    this.status = 'pending';
  }
});

// ── Virtual: formatted amounts in TZS ─────────────────
feeSchema.virtual('amountFormatted').get(function () {
  return `TZS ${Number(this.amount).toLocaleString('en-TZ')}`;
});

feeSchema.virtual('paidFormatted').get(function () {
  return `TZS ${Number(this.paid).toLocaleString('en-TZ')}`;
});

feeSchema.virtual('balanceFormatted').get(function () {
  return `TZS ${Number(this.balance).toLocaleString('en-TZ')}`;
});

feeSchema.virtual('isOverdue').get(function () {
  return this.status !== 'paid' &&
         this.status !== 'waived' &&
         new Date() > new Date(this.dueDate);
});

feeSchema.virtual('daysOverdue').get(function () {
  if (!this.isOverdue) return 0;
  const diff = new Date() - new Date(this.dueDate);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

feeSchema.virtual('paymentPercentage').get(function () {
  if (this.amount === 0) return 0;
  return parseFloat((this.paid / this.amount * 100).toFixed(1));
});

module.exports = mongoose.model('Fee', feeSchema);