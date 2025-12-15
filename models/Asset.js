const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  productImage: String,
  productType: { type: String, enum: ['Returnable','Non-returnable'], required: true },
  productQuantity: { type: Number, required: true },
  availableQuantity: { type: Number, required: true },
  dateAdded: { type: Date, default: Date.now },
  hrEmail: { type: String, required: true },
  companyName: String
});

module.exports = mongoose.model('Asset', assetSchema);
