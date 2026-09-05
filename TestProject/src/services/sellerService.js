const User = require('../models/User');
const SellerRequest = require('../models/SellerRequest');

async function submitRequest(userID, data) {
  if (!data.storeName || !data.address || !data.phone) throw Object.assign(new Error('Store name, address and phone are required.'), { statusCode: 400 });
  const existing = await SellerRequest.findOne({ userID, status: 'pending' });
  if (existing) throw Object.assign(new Error('You already have a pending seller request.'), { statusCode: 409 });
  return SellerRequest.create({ userID, ...data });
}

function listRequests(status) { return SellerRequest.find(status ? { status } : {}).sort({ createdAt: -1 }); }

async function reviewRequest(id, reviewerID, decision) {
  const request = await SellerRequest.findById(id);
  if (!request) throw Object.assign(new Error('Seller request not found.'), { statusCode: 404 });
  request.status = decision;
  request.reviewedAt = new Date();
  request.reviewedBy = reviewerID;
  await request.save();
  if (decision === 'approved') await User.findOneAndUpdate({ userID: request.userID }, { role: 'seller', sellerProfile: { storeName: request.storeName, address: request.address, phone: request.phone, description: request.description } });
  return request;
}

module.exports = { submitRequest, listRequests, reviewRequest };