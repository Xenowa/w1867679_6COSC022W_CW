"use strict";

const pool = require("../config/db");

exports.home = function (req, res) {
  res.render("index");
};

exports.health = async function (req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
};
