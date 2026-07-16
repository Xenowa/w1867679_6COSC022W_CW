"use strict";

const rateLimit = require("express-rate-limit");

// Applied to login, registration, and password-related endpoints
module.exports = function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
      res.message("Too many attempts. Please try again later.");
      res.redirect(req.get("Referrer") || "/");
    },
  });
};
