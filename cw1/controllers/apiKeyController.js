"use strict";

const pool = require("../config/db");
const tokenService = require("../services/tokenService");

// Scoping the API Key for the alumni-of-the-day endpoint
const DEFAULT_SCOPES = ["read:alumni_of_day"];

exports.listKeys = async function (req, res, next) {
  try {
    const [keys] = await pool.query(
      "SELECT keyId, label, scopes, revokedAt, createdAt FROM api_keys WHERE userId = ? ORDER BY createdAt DESC",
      [req.session.user.userId],
    );
    res.render("keys/index", { keys });
  } catch (err) {
    next(err);
  }
};

exports.generateKey = async function (req, res, next) {
  const label = (req.body.label || "").trim();

  try {
    const rawKey = tokenService.generateRawToken();
    const keyHash = tokenService.hashToken(rawKey);

    await pool.query(
      "INSERT INTO api_keys (userId, keyHash, label, scopes) VALUES (?, ?, ?, ?)",
      [
        req.session.user.userId,
        keyHash,
        label || null,
        JSON.stringify(DEFAULT_SCOPES),
      ],
    );

    // shown once - the raw key is never persisted anywhere, only its hash
    res.render("keys/created", { rawKey });
  } catch (err) {
    next(err);
  }
};

exports.revokeKey = async function (req, res, next) {
  try {
    const [result] = await pool.query(
      "UPDATE api_keys SET revokedAt = NOW() WHERE keyId = ? AND userId = ? AND revokedAt IS NULL",
      [req.params.id, req.session.user.userId],
    );
    res.message(
      result.affectedRows
        ? "API key revoked."
        : "Key not found or already revoked.",
    );
    res.redirect("/keys");
  } catch (err) {
    next(err);
  }
};
