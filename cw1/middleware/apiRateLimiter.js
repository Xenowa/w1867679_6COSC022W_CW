"use strict";

const rateLimit = require("express-rate-limit");

// Adding rate limiting to public API endpoints
module.exports = function apiRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 60, // limit each IP to 60 requests per 15 minutes window
    standardHeaders: true,
    legacyHeaders: false,
    handler: function (req, res) {
      res
        .status(429)
        .json({ error: "Too many requests. Please try again later." });
    },
  });
};
