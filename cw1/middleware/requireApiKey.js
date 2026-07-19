"use strict";

const pool = require("../config/db");
const tokenService = require("../services/tokenService");

// Same pattern used for email password reset is re-used here
module.exports = function requireApiKey(requiredScope) {
  return async function (req, res, next) {
    const authHeader = req.get("Authorization") || "";
    const match = /^Bearer (.+)$/.exec(authHeader);

    if (!match) {
      return res
        .status(401)
        .json({ error: "Missing or malformed Authorization header." });
    }

    try {
      const keyHash = tokenService.hashToken(match[1]);
      const [[apiKey]] = await pool.query(
        "SELECT keyId, userId, scopes FROM api_keys WHERE keyHash = ? AND revokedAt IS NULL",
        [keyHash],
      );

      if (!apiKey) {
        return res.status(401).json({ error: "Invalid or revoked API key." });
      }

      if (!apiKey.scopes.includes(requiredScope)) {
        return res
          .status(403)
          .json({ error: "This API key does not have the required scope." });
      }

      await pool.query(
        "INSERT INTO api_key_usage (keyId, endpoint, ipAddress) VALUES (?, ?, ?)",
        [apiKey.keyId, `${req.method} ${req.baseUrl}${req.path}`, req.ip],
      );

      req.apiKey = apiKey;
      next();
    } catch (err) {
      next(err);
    }
  };
};
