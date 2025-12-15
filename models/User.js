const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String },
  role: { type: String, enum: ['employee','hr'], default: 'employee' },
  companyName: String,
  companyLogo: String,
  packageLimit: { type: Number, default: 5 },
  currentEmployees: { type: Number, default: 0 },
  subscription: { type: String, default: 'basic' },
  dateOfBirth: Date,
  profileImage: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
