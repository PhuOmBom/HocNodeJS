const service = require('../services/sellerService');
async function submit(req, res, next) { try { res.status(201).json({ request: await service.submitRequest(req.user.userID, req.body) }); } catch (error) { next(error); } }
async function list(req, res, next) { try { res.json({ requests: await service.listRequests(req.query.status) }); } catch (error) { next(error); } }
async function review(req, res, next) { try { const request = await service.reviewRequest(req.params.id, req.user.userID, req.body.status); res.json({ request }); } catch (error) { next(error); } }
module.exports = { submit, list, review };