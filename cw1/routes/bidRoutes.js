"use strict";

const express = require("express");
const router = express.Router();
const bidController = require("../controllers/bidController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth, requireRole("alumnus"));

router.get("/", bidController.showBidPage);
router.post("/", bidController.placeBid);
router.get("/history", bidController.showHistory);
router.put("/:id", bidController.updateBid);
router.delete("/:id", bidController.cancelBid);

module.exports = router;
