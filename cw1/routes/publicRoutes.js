"use strict";

const express = require("express");
const router = express.Router();
const alumniController = require("../controllers/alumniController");
const requireApiKey = require("../middleware/requireApiKey");

/**
 * @swagger
 * /api/alumni/today:
 *   get:
 *     summary: Get today's featured Alumni of the Day
 *     description: >
 *       Returns the full public profile of the alumnus currently featured as
 *       Alumni of the Day, including all degrees, certifications, licences,
 *       professional courses, and employment history. The featured alumnus
 *       is set daily by the automated winner-selection job.
 *     tags:
 *       - Public API
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: The featured alumnus's public profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumniOfTheDay'
 *       401:
 *         description: Missing, malformed, invalid, or revoked API key.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: The API key does not have the read:alumni_of_day scope.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: No alumnus is currently featured.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/alumni/today",
  requireApiKey("read:alumni_of_day"),
  alumniController.getTodaysAlumnus,
);

module.exports = router;
