const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

router.use(requireAuth, requireRole('admin'));

router.get('/stats', adminController.stats);
router.get('/users', adminController.listUsers);
router.patch('/users/:id/status', adminController.setUserStatus);
router.delete('/items/:id', adminController.removeItem);

module.exports = router;
