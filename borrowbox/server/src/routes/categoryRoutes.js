const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categoriesController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.get('/', categoriesController.list);
router.post('/', requireAuth, requireRole('admin'), categoriesController.create);
router.put('/:id', requireAuth, requireRole('admin'), categoriesController.update);
router.delete('/:id', requireAuth, requireRole('admin'), categoriesController.remove);

module.exports = router;
