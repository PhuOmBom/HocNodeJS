const service = require('../services/orderService');
async function create(req, res, next) { try { res.status(201).json({ order: await service.createOrder(req.user.userID, req.body.shipping, req.body.paymentMethod) }); } catch (error) { next(error); } }
async function list(req, res, next) { try { if (req.query.scope === 'my') { return res.json({ orders: await service.listMyPurchases(req.user) }); } res.json({ orders: await service.listOrders(req.user) }); } catch (error) { next(error); } }
async function listMyOrders(req, res, next) { try { res.json({ orders: await service.listMyPurchases(req.user) }); } catch (error) { next(error); } }
async function updateStatus(req, res, next) { try { const order = await service.updateStatus(req.params.id, req.body.status, req.user); if (!order) return res.status(404).json({ message: 'Order not found or not assigned to you.' }); res.json({ order }); } catch (error) { next(error); } }
module.exports = { create, list, listMyOrders, updateStatus };