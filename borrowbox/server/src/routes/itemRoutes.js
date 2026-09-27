const express = require('express');
const router = express.Router();
const itemsController = require('../controllers/itemsController');
const { requireAuth } = require('../middleware/auth');
const { validateBody, validateItem } = require('../middleware/validate');

// NOTE: /mine must be defined before /:id so it is not swallowed by the param route.
router.get('/mine', requireAuth, itemsController.mine);
router.get('/', itemsController.list);
router.get('/:id/availability', itemsController.availability);
router.get('/:id', itemsController.getOne);
router.post('/', requireAuth, validateBody(validateItem), itemsController.create);
router.put('/:id', requireAuth, itemsController.update);
router.delete('/:id', requireAuth, itemsController.remove);

module.exports = router;
