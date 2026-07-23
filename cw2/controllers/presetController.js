"use strict";

const pool = require("../config/db");

const PRESET_FIELDS = [
  "programme",
  "graduationYear",
  "jobTitlesLimit",
  "employersLimit",
  "certGrowthPeriod",
];

async function listPresets(adminUserId) {
  const [presets] = await pool.query(
    "SELECT id, name, filters FROM filter_presets WHERE adminUserId = ? ORDER BY createdAt DESC",
    [adminUserId],
  );
  return presets;
}

exports.listPresets = listPresets;

exports.createPreset = async function (req, res, next) {
  const name = (req.body.name || "").trim();
  if (!name) {
    res.message("Give the preset a name before saving.");
    return res.redirect("/charts");
  }

  const filters = {};
  for (const field of PRESET_FIELDS) {
    if (req.body[field]) filters[field] = req.body[field];
  }

  try {
    await pool.query(
      "INSERT INTO filter_presets (adminUserId, name, filters) VALUES (?, ?, ?)",
      [req.session.admin.id, name, JSON.stringify(filters)],
    );
    res.message(`Preset "${name}" saved.`);
    res.redirect("/charts");
  } catch (err) {
    next(err);
  }
};

exports.applyPreset = async function (req, res, next) {
  try {
    const [[preset]] = await pool.query(
      "SELECT filters FROM filter_presets WHERE id = ? AND adminUserId = ?",
      [req.params.id, req.session.admin.id],
    );
    if (!preset) {
      res.message("Preset not found.");
      return res.redirect("/charts");
    }
    const query = new URLSearchParams(preset.filters).toString();
    res.redirect(`/charts${query ? `?${query}` : ""}`);
  } catch (err) {
    next(err);
  }
};

exports.deletePreset = async function (req, res, next) {
  try {
    await pool.query(
      "DELETE FROM filter_presets WHERE id = ? AND adminUserId = ?",
      [req.params.id, req.session.admin.id],
    );
    res.message("Preset deleted.");
    res.redirect("/charts");
  } catch (err) {
    next(err);
  }
};
