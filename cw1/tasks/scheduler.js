"use strict";

const cron = require("node-cron");
const { runWinnerSelection } = require("./winnerSelection");
const { runMonthlyReset } = require("./monthlyReset");

module.exports = function startScheduler() {
  // daily at 18:00 server time - closes bidding, selects winner for tomorrow's slot
  cron.schedule("0 18 * * *", function () {
    runWinnerSelection().catch((err) =>
      console.error("Winner selection failed:", err),
    );
  });

  // 00:00 on the 1st of each month - resets monthly win counts and bonus slots
  cron.schedule("0 0 1 * *", function () {
    runMonthlyReset().catch((err) =>
      console.error("Monthly reset failed:", err),
    );
  });
};
