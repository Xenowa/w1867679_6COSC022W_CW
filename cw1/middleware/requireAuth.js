'use strict';

module.exports = function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.message('Please log in to continue.');
    return res.redirect('/auth/login');
  }
  next();
};
