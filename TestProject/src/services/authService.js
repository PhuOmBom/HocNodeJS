const User = require('../models/User');
const { signToken } = require('../utils/jwt');

function publicUser(user) {
  return { userID: user.userID, name: user.name, email: user.email, role: user.role === 'user' ? 'customer' : user.role, avatar: user.avatar, status: user.status, isBanned: user.isBanned, sellerProfile: user.sellerProfile };
}

async function registerUser({ name, email, password }) {
  if (!name || !email || !password) throw Object.assign(new Error('Name, email and password are required.'), { statusCode: 400 });
  if (password.length < 6) throw Object.assign(new Error('Password must contain at least 6 characters.'), { statusCode: 400 });
  if (await User.exists({ email: email.toLowerCase().trim() })) throw Object.assign(new Error('This email is already registered.'), { statusCode: 409 });
  await User.create({ name, email, password, role: 'customer' });
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

async function updateProfile(user, { name, avatar }) {
  if (!name || name.trim().length < 2) throw Object.assign(new Error('Name must contain at least 2 characters.'), { statusCode: 400 });
  if (avatar && (!avatar.startsWith('data:image/') || avatar.length > 14 * 1024 * 1024)) throw Object.assign(new Error('Invalid image or image is larger than 10MB.'), { statusCode: 400 });
  user.name = name.trim();
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  return publicUser(user);
}

module.exports = { publicUser, registerUser, loginUser, logoutUser, updateProfile };