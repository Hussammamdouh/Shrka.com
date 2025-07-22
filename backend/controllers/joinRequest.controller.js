const JoinRequest = require('../models/joinRequest.model');
const { AppError, catchAsync } = require('../utils/error.util');

exports.submitJoinRequest = catchAsync(async (req, res) => {
  const { companyId, message } = req.body;
  const existing = await JoinRequest.findOne({ userId: req.user._id, companyId });
  if (existing) throw new AppError('Join request already exists', 409, 'JOIN_REQUEST_EXISTS');
  const joinRequest = await JoinRequest.create({ userId: req.user._id, companyId, message });
  // TODO: send notification/email to company admins
  res.status(201).json({ success: true, data: joinRequest, message: 'Join request submitted' });
});

exports.listMyJoinRequests = catchAsync(async (req, res) => {
  const requests = await JoinRequest.find({ userId: req.user._id });
  res.json({ success: true, data: requests, message: 'Join requests fetched' });
}); 