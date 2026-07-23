"use strict";

const express = require("express");
const router = express.Router();
const alumniController = require("../controllers/alumniController");
const requireAdmin = require("../middleware/requireAdmin");

router.use(requireAdmin);

router.get("/", alumniController.listAlumni);
router.get("/:id", alumniController.showAlumnus);

module.exports = router;
