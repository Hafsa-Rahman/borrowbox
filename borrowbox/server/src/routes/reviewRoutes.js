const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');

router.put('/:id', requireAuth, reviewsController.update);
router.delete('/:id', requireAuth, reviewsController.remove);

module.exports = router;
