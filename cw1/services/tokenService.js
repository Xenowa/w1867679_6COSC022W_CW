"use strict";

const crypto = require("node:crypto");

const TOKEN_BYTES = 32; // 64 hex chars

function generateRawToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function createToken(connection, table, userId, expiresInMs) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + expiresInMs);

  await connection.query(
    "INSERT INTO ?? (userId, tokenHash, expiresAt) VALUES (?, ?, ?)",
    [table, userId, tokenHash, expiresAt],
  );

  return rawToken;
}

// Verifies a raw token against the given table
async function verifyAndConsumeToken(connection, table, idColumn, rawToken) {
  const tokenHash = hashToken(rawToken);

  const [rows] = await connection.query(
    "SELECT * FROM ?? WHERE tokenHash = ? AND usedAt IS NULL AND expiresAt > NOW()",
    [table, tokenHash],
  );
  const row = rows[0];
  if (!row) return null;

  // marking used at time instead of deleting so re-use attempts could be failed through checks
  await connection.query("UPDATE ?? SET usedAt = NOW() WHERE ?? = ?", [
    table,
    idColumn,
    row[idColumn],
  ]);

  return row.userId;
}

module.exports = {
  generateRawToken,
  hashToken,
  createToken,
  verifyAndConsumeToken,
};
