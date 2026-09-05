const service = require('../services/cartService');
async function get(req, res, next) { try { res.json({ cart: await service.getCart(req.user.userID) }); } catch (error) { next(error); } }
async function add(req, res, next) { try { res.json({ cart: await service.addItem(req.user.userID, req.body.bookId, req.body.quantity) }); } catch (error) { next(error); } }
async function update(req, res, next) { try { res.json({ cart: await service.updateItem(req.user.userID, req.params.bookId, req.body.quantity) }); } catch (error) { next(error); } }
module.exports = { get, add, update };