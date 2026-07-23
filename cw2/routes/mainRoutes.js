"use strict";

const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");

router.get("/", mainController.home);
router.get("/dashboard", mainController.home);
router.get("/health", mainController.health);

module.exports = router;
