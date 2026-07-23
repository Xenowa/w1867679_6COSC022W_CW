"use strict";

const { csrfSync } = require("csrf-sync");

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: function (req) {
    return req.body._csrf;
  },
});

module.exports = { csrfSynchronisedProtection, generateToken };
