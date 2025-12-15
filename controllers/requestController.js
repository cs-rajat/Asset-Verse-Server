const mongoose = require('mongoose');
const Request = require('../models/Request');
const Asset = require('../models/Asset');
const AssignedAsset = require('../models/AssignedAsset');
const Affiliation = require('../models/Affiliation');
const User = require('../models/User');

exports.createRequest = async (req, res) => {
  try {
    const { assetId, note } = req.body;
    const requesterEmail = req.user.email;
    const requesterName = req.user.name || req.body.name;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });

    const reqDoc = await Request.create({
      assetId,
      assetName: asset.productName,
      assetType: asset.productType,
      requesterName,
      requesterEmail,
      hrEmail: asset.hrEmail,
      companyName: asset.companyName,
      note
    });
    res.status(201).json(reqDoc);
  } catch (err) {
    console.error('createRequest error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.getRequestsForHR = async (req, res) => {
  try {
    const hrEmail = req.user.email;
    const requests = await Request.find({ hrEmail }).sort({ requestDate: -1 });
    res.json(requests);
  } catch (err) {
    console.error('getRequestsForHR', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.approveRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const requestId = req.params.id;
    const hrEmail = req.user.email;

    const reqDoc = await Request.findById(requestId).session(session);
    if (!reqDoc) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: 'Request not found' }); }
    if (reqDoc.hrEmail !== hrEmail) { await session.abortTransaction(); session.endSession(); return res.status(403).json({ msg: 'Not allowed' }); }
    if (reqDoc.requestStatus !== 'pending') { await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: 'Request already processed' }); }

    const asset = await Asset.findById(reqDoc.assetId).session(session);
    if (!asset) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: 'Linked asset not found' }); }
    if (asset.availableQuantity < 1) { await session.abortTransaction(); session.endSession(); return res.status(400).json({ msg: 'Out of stock' }); }

    let affiliation = await Affiliation.findOne({ employeeEmail: reqDoc.requesterEmail, hrEmail }).session(session);
    const hrUser = await User.findOne({ email: hrEmail }).session(session);
    if (!hrUser) { await session.abortTransaction(); session.endSession(); return res.status(404).json({ msg: 'HR user not found' }); }

    if (!affiliation) {
      if ((hrUser.currentEmployees || 0) + 1 > (hrUser.packageLimit || 0)) {
        await session.abortTransaction(); session.endSession();
        return res.status(400).json({ msg: 'Package limit reached. Upgrade required.' });
      }
      affiliation = (await Affiliation.create([{
        employeeEmail: reqDoc.requesterEmail,
        employeeName: reqDoc.requesterName,
        hrEmail,
        companyName: reqDoc.companyName,
        companyLogo: reqDoc.companyLogo || ''
      }], { session }))[0];

      hrUser.currentEmployees = (hrUser.currentEmployees || 0) + 1;
      await hrUser.save({ session });
    }

    const assigned = (await AssignedAsset.create([{
      assetId: asset._id,
      assetName: asset.productName,
      assetImage: asset.productImage || '',
      assetType: asset.productType,
      employeeEmail: reqDoc.requesterEmail,
      employeeName: reqDoc.requesterName,
      hrEmail,
      companyName: reqDoc.companyName
    }], { session }))[0];

    asset.availableQuantity = (asset.availableQuantity || 0) - 1;
    if (asset.availableQuantity < 0) asset.availableQuantity = 0;
    await asset.save({ session });

    reqDoc.requestStatus = 'approved';
    reqDoc.approvalDate = new Date();
    reqDoc.processedBy = hrEmail;
    await reqDoc.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ message: 'Approved', assigned, request: reqDoc, affiliation });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('approveRequest error', err);
    if (err && err.code === 11000) return res.status(409).json({ msg: 'Affiliation race conflict. Try again.' });
    res.status(500).json({ msg: 'Server error' });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const requestId = req.params.id;
    const hrEmail = req.user.email;
    const reqDoc = await Request.findById(requestId);
    if (!reqDoc) return res.status(404).json({ msg: 'Request not found' });
    if (reqDoc.hrEmail !== hrEmail) return res.status(403).json({ msg: 'Not allowed' });
    if (reqDoc.requestStatus !== 'pending') return res.status(400).json({ msg: 'Already processed' });

    reqDoc.requestStatus = 'rejected';
    reqDoc.processedBy = hrEmail;
    await reqDoc.save();
    res.json({ message: 'Rejected', request: reqDoc });
  } catch (err) {
    console.error('rejectRequest error', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
