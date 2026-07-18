'use strict';

module.exports = function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user || req.session.user.role !== role) {
      res.message('You do not have access to that page.');
      return res.redirect('/');
    }
    next();
  };
};
