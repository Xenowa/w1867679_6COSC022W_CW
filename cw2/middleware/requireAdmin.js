"use strict";

module.exports = function requireAdmin(req, res, next) {
  if (!req.session.admin) {
    res.message("Please log in to continue.");
    return res.redirect("/auth/login");
  }
  next();
};
