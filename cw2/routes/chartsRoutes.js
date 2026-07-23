"use strict";

const express = require("express");
const router = express.Router();
const chartsController = require("../controllers/chartsController");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

router.get("/", chartsController.showCharts);

module.exports = router;
