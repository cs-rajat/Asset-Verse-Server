const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
  assetName: String,
  assetType: String,
  requesterName: String,
  requesterEmail: String,
  hrEmail: String,
  companyName: String,
  requestDate: { type: Date, default: Date.now },
  approvalDate: Date,
  requestStatus: { type: String, enum: ['pending','approved','rejected','returned'], default: 'pending' },
  note: String,
  processedBy: String
});

module.exports = mongoose.model('Request', requestSchema);
