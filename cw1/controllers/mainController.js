'use strict';

const db = require('../config/db');

exports.home = function (req, res) {
  res.render('index');
};

exports.health = async function (req, res) {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'unreachable' });
  }
};
