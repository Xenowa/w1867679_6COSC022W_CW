"use strict";

const pool = require("../config/db");
const bidService = require("../services/bidService");
const emailService = require("../services/emailService");

// Runs daily through the cron at 18:00: closes bidding on tomorrow's slot and picks a winner.
async function runWinnerSelection() {
  const connection = await pool.getConnection();
  let outcome;
  try {
    await connection.beginTransaction();

    const created = await bidService.ensureTomorrowSlot(connection);
    const [[slot]] = await connection.query(
      "SELECT * FROM bid_slots WHERE bidSlotId = ? FOR UPDATE",
      [created.bidSlotId],
    );

    if (slot.closedAt) {
      await connection.commit();
      return { alreadyProcessed: true };
    }

    const [[topBid]] = await connection.query(
      "SELECT * FROM bids WHERE bidSlotId = ? AND status = 'active' ORDER BY amount DESC, createdAt ASC LIMIT 1",
      [slot.bidSlotId],
    );

    if (!topBid) {
      await connection.query(
        "UPDATE bid_slots SET closedAt = NOW() WHERE bidSlotId = ?",
        [slot.bidSlotId],
      );
      await connection.commit();
      return { winner: null };
    }

    // Make sure only one profile has the alumni of the day
    await connection.query(
      "UPDATE profiles SET isAlumniOfDay = FALSE WHERE isAlumniOfDay = TRUE",
    );
    await connection.query(
      "UPDATE profiles SET isAlumniOfDay = TRUE, appearanceCount = appearanceCount + 1 WHERE userId = ?",
      [topBid.userId],
    );

    await connection.query(
      "UPDATE bid_slots SET winnerProfileId = ?, closedAt = NOW() WHERE bidSlotId = ?",
      [topBid.userId, slot.bidSlotId],
    );

    await connection.query("UPDATE bids SET status = 'won' WHERE bidId = ?", [
      topBid.bidId,
    ]);

    const [losers] = await connection.query(
      "SELECT * FROM bids WHERE bidSlotId = ? AND status = 'active' AND bidId != ?",
      [slot.bidSlotId, topBid.bidId],
    );
    await connection.query(
      "UPDATE bids SET status = 'lost' WHERE bidSlotId = ? AND status = 'active' AND bidId != ?",
      [slot.bidSlotId, topBid.bidId],
    );

    const [[winnerUser]] = await connection.query(
      "SELECT email FROM users WHERE userId = ?",
      [topBid.userId],
    );
    const loserEmails = [];
    for (const loser of losers) {
      const [[loserUser]] = await connection.query(
        "SELECT email FROM users WHERE userId = ?",
        [loser.userId],
      );
      loserEmails.push(loserUser.email);
    }

    await connection.commit();
    outcome = {
      winner: topBid.userId,
      winnerEmail: winnerUser.email,
      loserEmails,
      slotDate: slot.date,
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }

  // Sending the emails after the db update is done
  const dateLabel = new Date(outcome.slotDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  await emailService
    .sendBidWonEmail(outcome.winnerEmail, dateLabel)
    .catch((err) => console.error("Failed to send win email:", err));
  for (const email of outcome.loserEmails) {
    await emailService
      .sendBidLostEmail(email, dateLabel)
      .catch((err) => console.error("Failed to send loss email:", err));
  }

  return { winner: outcome.winner, losers: outcome.loserEmails.length };
}

module.exports = { runWinnerSelection };
