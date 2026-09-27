const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookingsController');
const reviewsController = require('../controllers/reviewsController');
const { requireAuth } = require('../middleware/auth');
const { validateBody, validateBooking, validateReview } = require('../middleware/validate');

router.get('/mine', requireAuth, bookingsController.mine);
router.get('/incoming', requireAuth, bookingsController.incoming);
router.get('/:id', requireAuth, bookingsController.getOne);
router.post('/', requireAuth, validateBody(validateBooking), bookingsController.create);
router.put('/:id', requireAuth, bookingsController.update);
router.delete('/:id', requireAuth, bookingsController.remove);
router.patch('/:id/status', requireAuth, bookingsController.changeStatus);
router.post('/:id/reviews', requireAuth, validateBody(validateReview), reviewsController.create);

module.exports = router;
