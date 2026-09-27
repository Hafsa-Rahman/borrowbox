const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { requireAuth } = require('../middleware/auth');

router.put('/me', requireAuth, usersController.updateMe);
router.delete('/me', requireAuth, usersController.deleteMe);
router.get('/:id', usersController.getPublicProfile);

module.exports = router;
