const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const { validateBody, validateRegister, validateLogin } = require('../middleware/validate');

router.post('/register', validateBody(validateRegister), authController.register);
router.post('/login', validateBody(validateLogin), authController.login);
router.get('/me', requireAuth, authController.me);

module.exports = router;
