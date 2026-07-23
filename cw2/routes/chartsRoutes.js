"use strict";

const express = require("express");
const router = express.Router();
const chartsController = require("../controllers/chartsController");
const presetController = require("../controllers/presetController");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

router.get("/", chartsController.showCharts);
router.post("/presets", presetController.createPreset);
router.get("/presets/:id/apply", presetController.applyPreset);
router.delete("/presets/:id", presetController.deletePreset);

module.exports = router;
