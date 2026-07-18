"use strict";

const pool = require("../config/db");

function validate(body) {
  const errors = [];
  const company = (body.company || "").trim();
  const role = (body.role || "").trim();
  const industrySector = (body.industrySector || "").trim();
  const location = (body.location || "").trim();
  const startedAt = (body.startedAt || "").trim();
  const endedAt = (body.endedAt || "").trim();

  if (!company) errors.push("Company is required.");
  if (!role) errors.push("Role is required.");

  if (!startedAt) {
    errors.push("Start date is required.");
  } else if (new Date(startedAt) > new Date()) {
    errors.push("Start date must be in the past.");
  }

  if (endedAt && startedAt && new Date(endedAt) <= new Date(startedAt)) {
    errors.push("End date must be after the start date.");
  }

  return {
    errors,
    company,
    role,
    industrySector,
    location,
    startedAt,
    endedAt,
  };
}

exports.create = async function (req, res, next) {
  const {
    errors,
    company,
    role,
    industrySector,
    location,
    startedAt,
    endedAt,
  } = validate(req.body);
  if (errors.length) {
    res.message(errors.join(" "));
    return res.redirect("/profile");
  }

  try {
    await pool.query(
      "INSERT INTO employment_history (userId, company, role, industrySector, location, startedAt, endedAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        req.session.user.userId,
        company,
        role,
        industrySector || null,
        location || null,
        startedAt,
        endedAt || null,
      ],
    );
    res.message("Employment record added.");
    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
};

exports.update = async function (req, res, next) {
  const {
    errors,
    company,
    role,
    industrySector,
    location,
    startedAt,
    endedAt,
  } = validate(req.body);
  if (errors.length) {
    res.message(errors.join(" "));
    return res.redirect("/profile");
  }

  try {
    const [result] = await pool.query(
      "UPDATE employment_history SET company = ?, role = ?, industrySector = ?, location = ?, startedAt = ?, endedAt = ? WHERE employmentId = ? AND userId = ?",
      [
        company,
        role,
        industrySector || null,
        location || null,
        startedAt,
        endedAt || null,
        req.params.id,
        req.session.user.userId,
      ],
    );
    res.message(result.affectedRows ? "Updated." : "Record not found.");
    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
};

exports.remove = async function (req, res, next) {
  try {
    const [result] = await pool.query(
      "DELETE FROM employment_history WHERE employmentId = ? AND userId = ?",
      [req.params.id, req.session.user.userId],
    );
    res.message(result.affectedRows ? "Deleted." : "Record not found.");
    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
};
