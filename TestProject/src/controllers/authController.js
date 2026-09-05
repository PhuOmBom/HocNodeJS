const authService = require('../services/authService');
const { setAuthCookie } = require('../utils/jwt');

async function register(req, res, next) {
  try { await authService.registerUser(req.body); res.status(201).json({ message: 'Account created successfully. You can now sign in.' }); } catch (error) { next(error); }
}

async function login(req, res, next) {
  try { const result = await authService.loginUser(req.body); setAuthCookie(res, result.token); res.json({ message: 'Signed in successfully.', ...result }); } catch (error) { next(error); }
}

async function logout(req, res, next) {
  try { await authService.logoutUser(req.user.userID); res.clearCookie('auth_token', { httpOnly: true, sameSite: 'lax', path: '/' }); res.json({ message: 'You have been signed out.' }); } catch (error) { next(error); }
}

async function getProfile(req, res) { res.json({ user: authService.publicUser(req.user) }); }

async function updateProfile(req, res, next) {
  try { res.json({ message: 'Profile updated successfully.', user: await authService.updateProfile(req.user, req.body) }); } catch (error) { next(error); }
}

module.exports = { register, login, logout, getProfile, updateProfile };