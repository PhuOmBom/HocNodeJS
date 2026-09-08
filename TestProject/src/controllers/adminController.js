const adminService = require('../services/adminService');

async function overview(req, res, next) {
	try {
		res.json(await adminService.overview());
	} catch (error) {
		next(error);
	}
}

async function users(req, res, next) {
	try {
		const users = await adminService.listUsers();
		res.json({ users });
	} catch (error) {
		next(error);
	}
}

async function ban(req, res, next) {
	try {
		const user = await adminService.updateBan(req.params.userID, req.body.isBanned !== false);
		if (!user) return res.status(404).json({ message: 'User not found or protected.' });
		res.json({ user });
	} catch (error) {
		next(error);
	}
}

async function role(req, res, next) {
	try {
		if (!['customer', 'seller'].includes(req.body.role)) {
			return res.status(400).json({ message: 'Role must be customer or seller.' });
		}

		const user = await adminService.updateRole(req.params.userID, req.body.role);
		if (!user) return res.status(404).json({ message: 'User not found or protected.' });
		res.json({ user });
	} catch (error) {
		next(error);
	}
}

async function deleteUser(req, res, next) {
	try {
		const user = await adminService.deleteUser(req.params.userID);
		if (!user) return res.status(404).json({ message: 'User not found or protected.' });
		res.json({ message: 'User deleted successfully.', user });
	} catch (error) {
		next(error);
	}
}

async function sellerDashboard(req, res, next) {
	try {
		res.json(await adminService.sellerMetrics(req.user.userID));
	} catch (error) {
		next(error);
	}
}

module.exports = { overview, users, ban, role, deleteUser, sellerDashboard };