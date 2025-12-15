const Asset = require('../models/Asset');

exports.createAsset = async (req, res) => {
  try {
    const hrEmail = req.user.email;
    const { productName, productImage, productType, productQuantity, companyName } = req.body;
    if (!productName || !productType || !productQuantity) return res.status(400).json({ msg: 'Missing fields' });
    const asset = await Asset.create({ productName, productImage, productType, productQuantity, availableQuantity: productQuantity, hrEmail, companyName });
    res.status(201).json(asset);
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};

exports.getAssets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const q = {};
    if (req.query.search) q.productName = { $regex: req.query.search, $options: 'i' };
    const [total, assets] = await Promise.all([
      Asset.countDocuments(q),
      Asset.find(q).skip(skip).limit(limit).sort({ dateAdded: -1 })
    ]);
    res.json({ assets, pagination: { total, page, pages: Math.ceil(total/limit) } });
  } catch (err) { console.error(err); res.status(500).json({ msg: 'Server error' }); }
};
