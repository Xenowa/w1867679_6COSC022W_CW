"use strict";

const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

router.get("/alumni.csv", exportController.exportAlumniCsv);
router.get("/chart-data.csv", exportController.exportChartDataCsv);

module.exports = router;
