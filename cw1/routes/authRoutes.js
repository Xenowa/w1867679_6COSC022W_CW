'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const requireAuth = require('../middleware/requireAuth');

router.get('/register', authController.showRegisterForm);
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);
router.get('/login', authController.showLoginForm);
router.post('/login', authController.login);
router.post('/logout', requireAuth, authController.logout);

module.exports = router;
