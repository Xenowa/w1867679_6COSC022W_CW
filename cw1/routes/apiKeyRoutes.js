"use strict";

const express = require("express");
const router = express.Router();
const apiKeyController = require("../controllers/apiKeyController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth, requireRole("developer"));

router.get("/", apiKeyController.listKeys);
router.post("/", apiKeyController.generateKey);
router.delete("/:id", apiKeyController.revokeKey);
router.get("/:id/stats", apiKeyController.showStats);

module.exports = router;
