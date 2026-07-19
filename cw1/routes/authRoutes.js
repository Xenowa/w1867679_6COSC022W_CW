"use strict";

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const requireAuth = require("../middleware/requireAuth");
const authRateLimiter = require("../middleware/authRateLimiter");

router.get("/register", authController.showRegisterForm);
router.post("/register", authRateLimiter(), authController.register);
router.get("/verify-email", authController.verifyEmail);
router.post(
  "/resend-verification",
  authRateLimiter(),
  authController.resendVerification,
);
router.get("/login", authController.showLoginForm);
router.post("/login", authRateLimiter(), authController.login);
router.post("/logout", requireAuth, authController.logout);
router.get("/forgot-password", authController.showForgotPasswordForm);
router.post(
  "/forgot-password",
  authRateLimiter(),
  authController.forgotPassword,
);
router.get("/reset-password", authController.showResetPasswordForm);
router.post("/reset-password", authRateLimiter(), authController.resetPassword);

module.exports = router;
