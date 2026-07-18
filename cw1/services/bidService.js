"use strict";

const pool = require("../config/db");

const BASE_MONTHLY_LIMIT = 3;

function tomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Create the bid slot on demand from page load, cron, or every bid placement.
async function ensureSlotForDate(connection, dateString) {
  await connection.query("INSERT IGNORE INTO bid_slots (date) VALUES (?)", [
    dateString,
  ]);
  const [[slot]] = await connection.query(
    "SELECT * FROM bid_slots WHERE date = ?",
    [dateString],
  );
  return slot;
}

async function ensureTomorrowSlot(connection) {
  return ensureSlotForDate(connection, tomorrowDateString());
}

function getMonthlyLimit(profile) {
  return BASE_MONTHLY_LIMIT + (profile.monthlyExtraSlot ? 1 : 0);
}

async function getOwnActiveBid(connection, bidSlotId, userId) {
  const [[bid]] = await connection.query(
    "SELECT * FROM bids WHERE bidSlotId = ? AND userId = ? AND status = 'active'",
    [bidSlotId, userId],
  );
  return bid || null;
}

// Blind bidding function
async function isWinningBid(connection, bidSlotId, amount, ownBidId) {
  const [[row]] = await connection.query(
    "SELECT MAX(amount) AS maxAmount FROM bids WHERE bidSlotId = ? AND status = 'active' AND bidId != ?",
    [bidSlotId, ownBidId || 0],
  );
  if (row.maxAmount === null) return true;
  return Number(amount) > Number(row.maxAmount);
}

exports.ensureTomorrowSlot = ensureTomorrowSlot;
exports.ensureSlotForDate = ensureSlotForDate;

exports.placeBid = async function (userId, amount) {
  if (!(amount > 0)) {
    return { error: "Bid amount must be greater than zero." };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[profile]] = await connection.query(
      "SELECT * FROM profiles WHERE userId = ? FOR UPDATE",
      [userId],
    );

    const limit = getMonthlyLimit(profile);
    if (profile.appearanceCount >= limit) {
      await connection.rollback();
      return {
        error: `You've already won ${profile.appearanceCount}/${limit} times this month.`,
      };
    }

    const slot = await ensureTomorrowSlot(connection);

    const existing = await getOwnActiveBid(connection, slot.bidSlotId, userId);
    if (existing) {
      await connection.rollback();
      return {
        error:
          "You already have an active bid on tomorrow's slot - use update instead.",
      };
    }

    await connection.query(
      "INSERT INTO bids (bidSlotId, userId, amount, status) VALUES (?, ?, ?, 'active')",
      [slot.bidSlotId, userId, amount],
    );

    await connection.commit();
    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.updateBid = async function (userId, bidId, newAmount) {
  if (!(newAmount > 0)) {
    return { error: "Bid amount must be greater than zero." };
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [[bid]] = await connection.query(
      "SELECT * FROM bids WHERE bidId = ? AND userId = ? AND status = 'active' FOR UPDATE",
      [bidId, userId],
    );
    if (!bid) {
      await connection.rollback();
      return { error: "Active bid not found." };
    }

    const [[profile]] = await connection.query(
      "SELECT appearanceCount, monthlyExtraSlot FROM profiles WHERE userId = ? FOR UPDATE",
      [userId],
    );
    const limit = getMonthlyLimit(profile);
    if (profile.appearanceCount >= limit) {
      await connection.rollback();
      return {
        error: `You've already won ${profile.appearanceCount}/${limit} times this month.`,
      };
    }

    if (Number(newAmount) <= Number(bid.amount)) {
      await connection.rollback();
      return {
        error: "New bid must be strictly greater than your current bid.",
      };
    }

    await connection.query("UPDATE bids SET amount = ? WHERE bidId = ?", [
      newAmount,
      bidId,
    ]);
    await connection.commit();
    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.cancelBid = async function (userId, bidId) {
  const [result] = await pool.query(
    "UPDATE bids SET status = 'cancelled' WHERE bidId = ? AND userId = ? AND status = 'active'",
    [bidId, userId],
  );
  return result.affectedRows
    ? { success: true }
    : { error: "Active bid not found." };
};

exports.getStatus = async function (userId) {
  const slot = await ensureTomorrowSlot(pool);
  const [[profile]] = await pool.query(
    "SELECT appearanceCount, monthlyExtraSlot FROM profiles WHERE userId = ?",
    [userId],
  );
  const limit = getMonthlyLimit(profile);

  const ownBid = await getOwnActiveBid(pool, slot.bidSlotId, userId);
  let winning = null;
  if (ownBid) {
    winning = await isWinningBid(
      pool,
      slot.bidSlotId,
      ownBid.amount,
      ownBid.bidId,
    );
  }

  return {
    slotDate: slot.date,
    ownBid: ownBid ? { bidId: ownBid.bidId, amount: ownBid.amount } : null,
    winning,
    monthlyUsage: { used: profile.appearanceCount, limit },
  };
};

exports.getHistory = async function (userId) {
  const [rows] = await pool.query(
    `SELECT b.*, s.date AS slotDate FROM bids b
     JOIN bid_slots s ON s.bidSlotId = b.bidSlotId
     WHERE b.userId = ?
     ORDER BY s.date DESC, b.createdAt DESC`,
    [userId],
  );
  return rows;
};
