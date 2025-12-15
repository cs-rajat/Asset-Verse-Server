const mongoose = require('mongoose');

const affiliationSchema = new mongoose.Schema({
  employeeEmail: { type: String, required: true },
  employeeName: { type: String, required: true },
  hrEmail: { type: String, required: true },
  companyName: String,
  companyLogo: String,
  affiliationDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['active','inactive'], default: 'active' }
});

affiliationSchema.index({ employeeEmail: 1, hrEmail: 1 }, { unique: true });

module.exports = mongoose.model('Affiliation', affiliationSchema);
