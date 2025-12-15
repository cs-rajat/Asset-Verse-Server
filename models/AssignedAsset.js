const mongoose = require('mongoose');

const assignedSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName: { type: String, required: true },
  assetImage: String,
  assetType: { type: String, enum: ['Returnable','Non-returnable'] },
  employeeEmail: { type: String, required: true },
  employeeName: { type: String, required: true },
  hrEmail: { type: String, required: true },
  companyName: String,
  assignmentDate: { type: Date, default: Date.now },
  returnDate: Date,
  status: { type: String, enum: ['assigned','returned'], default: 'assigned' }
});

module.exports = mongoose.model('AssignedAsset', assignedSchema);
