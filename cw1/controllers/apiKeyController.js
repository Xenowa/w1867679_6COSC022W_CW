"use strict";

const pool = require("../config/db");
const tokenService = require("../services/tokenService");

// every scope a client application can be issued - kept as an allowlist
const ALLOWED_SCOPES = ["read:alumni_of_day", "read:alumni", "read:analytics"];

exports.listKeys = async function (req, res, next) {
  try {
    const [keys] = await pool.query(
      "SELECT keyId, label, scopes, revokedAt, createdAt FROM api_keys WHERE userId = ? ORDER BY createdAt DESC",
      [req.session.user.userId],
    );
    res.render("keys/index", { keys, allowedScopes: ALLOWED_SCOPES });
  } catch (err) {
    next(err);
  }
};

exports.generateKey = async function (req, res, next) {
  const label = (req.body.label || "").trim();
  const requestedScopes = [].concat(req.body.scopes || []);
  const scopes = ALLOWED_SCOPES.filter((scope) =>
    requestedScopes.includes(scope),
  );

  if (!scopes.length) {
    res.message("Select at least one scope for the key.");
    return res.redirect("/keys");
  }

  try {
    const rawKey = tokenService.generateRawToken();
    const keyHash = tokenService.hashToken(rawKey);

    await pool.query(
      "INSERT INTO api_keys (userId, keyHash, label, scopes) VALUES (?, ?, ?, ?)",
      [req.session.user.userId, keyHash, label || null, JSON.stringify(scopes)],
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

exports.showStats = async function (req, res, next) {
  try {
    // scoped to userId so a developer can see only their own key's stats
    const [[key]] = await pool.query(
      "SELECT keyId, label FROM api_keys WHERE keyId = ? AND userId = ?",
      [req.params.id, req.session.user.userId],
    );
    if (!key) {
      res.message("API key not found.");
      return res.redirect("/keys");
    }

    const [byEndpoint] = await pool.query(
      "SELECT endpoint, COUNT(*) AS count FROM api_key_usage WHERE keyId = ? GROUP BY endpoint ORDER BY count DESC",
      [key.keyId],
    );
    const [recent] = await pool.query(
      "SELECT endpoint, ipAddress, accessedAt FROM api_key_usage WHERE keyId = ? ORDER BY accessedAt DESC LIMIT 50",
      [key.keyId],
    );

    res.render("keys/stats", { key, byEndpoint, recent });
  } catch (err) {
    next(err);
  }
};
