const AssignedAsset = require('../models/AssignedAsset');

exports.getAssignedForEmployee = async (req, res) => {
  try {
    const email = req.user.email;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const [total, items] = await Promise.all([
      AssignedAsset.countDocuments({ employeeEmail: email }),
      AssignedAsset.find({ employeeEmail: email }).skip(skip).limit(limit).sort({ assignmentDate: -1 })
    ]);
    res.json({ items, pagination: { total, page, pages: Math.ceil(total/limit) } });
  } catch (err) {
    console.error(err); res.status(500).json({ msg: 'Server error' });
  }
};
