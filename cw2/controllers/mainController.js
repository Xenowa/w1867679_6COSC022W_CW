"use strict";

const pool = require("../config/db");
const apiClient = require("../services/apiClient");

exports.home = async function (req, res, next) {
  if (!req.session.admin) {
    return res.render("index");
  }

  try {
    const [{ alumni }, { jobTitles }, { certGrowth }] = await Promise.all([
      apiClient.getAlumni({}),
      apiClient.getJobTitles({ limit: 5 }),
      apiClient.getCertGrowth({ period: "6" }),
    ]);

    const featuredAlumnus = alumni.find((a) => a.isAlumniOfDay) || null;

    res.render("dashboard", {
      totalAlumni: alumni.length,
      featuredAlumnus,
      jobTitles,
      certGrowth,
    });
  } catch (err) {
    next(err);
  }
};

exports.health = async function (req, res) {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: "unreachable" });
  }
};
