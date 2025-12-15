const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  hrEmail: String,
  packageName: String,
  employeeLimit: Number,
  amount: Number,
  transactionId: String,
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['completed','failed','pending'], default: 'completed' }
});

module.exports = mongoose.model('Payment', paymentSchema);
