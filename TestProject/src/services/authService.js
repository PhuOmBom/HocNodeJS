const User = require('../models/User');
const { signToken } = require('../utils/jwt');

function publicUser(user) {
  return {
    userID: user.userID,
    name: user.name,
    email: user.email,
    role: user.role === 'user' ? 'customer' : user.role,
    avatar: user.avatar,
    phone: user.phone || '',
    address: user.address || '',
    shippingAddresses: user.shippingAddresses || [],
    status: user.status,
    isBanned: user.isBanned,
    sellerProfile: user.sellerProfile
  };
}

async function registerUser({ name, email, password, phone = '', address = '' }) {
  if (!name || !email || !password) throw Object.assign(new Error('Name, email and password are required.'), { statusCode: 400 });
  if (password.length < 6) throw Object.assign(new Error('Password must contain at least 6 characters.'), { statusCode: 400 });
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();
  if (!trimmedPhone && !trimmedAddress) {
    throw Object.assign(new Error('Please provide at least a contact phone number or shipping address for order delivery.'), { statusCode: 400 });
  }
  if (await User.exists({ email: email.toLowerCase().trim() })) throw Object.assign(new Error('This email is already registered.'), { statusCode: 409 });
  
  const shippingAddresses = [];
  if (trimmedAddress) {
    shippingAddresses.push({
      label: 'Địa chỉ mặc định',
      recipientName: name.trim(),
      phone: trimmedPhone,
      address: trimmedAddress,
      isDefault: true
    });
  }

  await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'customer',
    phone: trimmedPhone,
    address: trimmedAddress,
    shippingAddresses
  });
}

async function loginUser({ email, password }) {
  const user = await User.findOne({ email: email?.toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password || ''))) throw Object.assign(new Error('Incorrect email or password.'), { statusCode: 401 });
  user.status = 'logged_in';
  await user.save();
  return { token: signToken(user), user: publicUser(user) };
}

async function logoutUser(userID) {
  await User.findOneAndUpdate({ userID }, { status: 'offline' });
}

async function updateProfile(user, { name, avatar, phone, address, shippingAddresses }) {
  if (!name || name.trim().length < 2) throw Object.assign(new Error('Name must contain at least 2 characters.'), { statusCode: 400 });
  if (avatar && (!avatar.startsWith('data:image/') || avatar.length > 14 * 1024 * 1024)) throw Object.assign(new Error('Invalid image or image is larger than 10MB.'), { statusCode: 400 });
  user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar;
  if (phone !== undefined) user.phone = phone.trim();
  if (address !== undefined) user.address = address.trim();
  if (Array.isArray(shippingAddresses)) user.shippingAddresses = shippingAddresses;
  await user.save();
  return publicUser(user);
}

async function addAddress(user, { label = 'Home', recipientName, phone, address, isDefault = false }) {
  if (!address || !address.trim()) throw Object.assign(new Error('Street address is required.'), { statusCode: 400 });
  if (!phone || !phone.trim()) throw Object.assign(new Error('Contact phone is required.'), { statusCode: 400 });
  const trimmedName = recipientName?.trim() || user.name;
  const trimmedPhone = phone.trim();
  const trimmedAddress = address.trim();
  const trimmedLabel = label.trim() || 'Home';
  const makeDefault = isDefault || !user.shippingAddresses || user.shippingAddresses.length === 0;

  if (makeDefault && user.shippingAddresses) {
    user.shippingAddresses.forEach((a) => { a.isDefault = false; });
  }

  const newAddress = {
    label: trimmedLabel,
    recipientName: trimmedName,
    phone: trimmedPhone,
    address: trimmedAddress,
    isDefault: makeDefault
  };

  user.shippingAddresses.push(newAddress);
  if (makeDefault) {
    user.address = trimmedAddress;
    user.phone = trimmedPhone;
  }
  await user.save();
  return user.shippingAddresses;
}

async function deleteAddress(user, addressId) {
  const index = user.shippingAddresses.findIndex((a) => a._id.toString() === addressId);
  if (index === -1) throw Object.assign(new Error('Address not found.'), { statusCode: 404 });
  const wasDefault = user.shippingAddresses[index].isDefault;
  user.shippingAddresses.splice(index, 1);
  if (wasDefault && user.shippingAddresses.length > 0) {
    user.shippingAddresses[0].isDefault = true;
    user.address = user.shippingAddresses[0].address;
    user.phone = user.shippingAddresses[0].phone;
  }
  await user.save();
  return user.shippingAddresses;
}

async function setDefaultAddress(user, addressId) {
  let found = false;
  user.shippingAddresses.forEach((a) => {
    if (a._id.toString() === addressId) {
      a.isDefault = true;
      user.address = a.address;
      user.phone = a.phone;
      found = true;
    } else {
      a.isDefault = false;
    }
  });
  if (!found) throw Object.assign(new Error('Address not found.'), { statusCode: 404 });
  await user.save();
  return user.shippingAddresses;
}

async function updateAddress(user, addressId, { label, recipientName, phone, address, isDefault }) {
  const item = user.shippingAddresses.find((a) => a._id.toString() === addressId);
  if (!item) throw Object.assign(new Error('Address not found.'), { statusCode: 404 });
  if (label !== undefined) item.label = label.trim() || 'Home';
  if (recipientName !== undefined) item.recipientName = recipientName.trim() || user.name;
  if (phone !== undefined) item.phone = phone.trim();
  if (address !== undefined) item.address = address.trim();
  if (isDefault) {
    user.shippingAddresses.forEach((a) => { a.isDefault = false; });
    item.isDefault = true;
    user.address = item.address;
    user.phone = item.phone;
  }
  await user.save();
  return user.shippingAddresses;
}

module.exports = {
  publicUser,
  registerUser,
  loginUser,
  logoutUser,
  updateProfile,
  addAddress,
  deleteAddress,
  setDefaultAddress,
  updateAddress
};