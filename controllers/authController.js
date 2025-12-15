const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.registerHR = async (req, res) => {
  try {
    const { name, email, password, companyName, companyLogo, dateOfBirth } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'hr', companyName, companyLogo, dateOfBirth });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { name: user.name, email: user.email, role: user.role }, token });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.registerEmployee = async (req, res) => {
  try {
    const { name, email, password, dateOfBirth } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'User exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: 'employee', dateOfBirth });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { name: user.name, email: user.email, role: user.role }, token });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'No user' });
    const match = await bcrypt.compare(password, user.password || '');
    if (!match) return res.status(400).json({ msg: 'Invalid creds' });
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { name: user.name, email: user.email, role: user.role }, token });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
