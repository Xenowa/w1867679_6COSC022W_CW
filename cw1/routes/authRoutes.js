'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.showRegisterForm);
router.post('/register', authController.register);
router.get('/verify-email', authController.verifyEmail);

module.exports = router;
