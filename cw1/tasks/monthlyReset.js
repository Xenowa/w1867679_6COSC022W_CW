"use strict";

const pool = require("../config/db");

// Runs on the 1st of each month: resets win counts and bonus slots for all
async function runMonthlyReset() {
  const [result] = await pool.query(
    "UPDATE profiles SET appearanceCount = 0, monthlyExtraSlot = FALSE",
  );
  return { affectedRows: result.affectedRows };
}

module.exports = { runMonthlyReset };
