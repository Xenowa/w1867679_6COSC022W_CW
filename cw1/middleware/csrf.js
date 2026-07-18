"use strict";

const { csrfSync } = require("csrf-sync");

const { csrfSynchronisedProtection, generateToken } = csrfSync({
  getTokenFromRequest: function (req) {
    return req.body._csrf;
  },
  skipCsrfProtection: function (req) {
    return Boolean(req.is("multipart/form-data"));
  },
});

module.exports = { csrfSynchronisedProtection, generateToken };
