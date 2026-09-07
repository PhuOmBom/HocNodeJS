const service = require('../services/categoryService');
async function list(req, res, next) { try { res.json({ categories: await service.listCategories() }); } catch (error) { next(error); } }
async function create(req, res, next) { try { res.status(201).json({ category: await service.createCategory(req.body) }); } catch (error) { next(error); } }
async function update(req, res, next) { try { const category = await service.updateCategory(req.params.id, req.body); if (!category) return res.status(404).json({ message: 'Category not found.' }); res.json({ category }); } catch (error) { next(error); } }
async function remove(req, res, next) { try { const category = await service.deleteCategory(req.params.id); if (!category) return res.status(404).json({ message: 'Category not found.' }); res.json({ message: 'Category archived.' }); } catch (error) { next(error); } }
async function getTopSelling(req, res, next) { try { const categories = await service.getTopSellingCategories(3); res.json({ categories }); } catch (error) { next(error); } }
module.exports = { list, create, update, remove, getTopSelling };