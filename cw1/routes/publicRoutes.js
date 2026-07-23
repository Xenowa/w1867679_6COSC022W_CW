"use strict";

const express = require("express");
const router = express.Router();
const alumniController = require("../controllers/alumniController");
const requireApiKey = require("../middleware/requireApiKey");
const apiRateLimiter = require("../middleware/apiRateLimiter");

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
 *       429:
 *         description: Too many requests - rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/alumni/today",
  apiRateLimiter(),
  requireApiKey("read:alumni_of_day"),
  alumniController.getTodaysAlumnus,
);

/**
 * @swagger
 * /api/alumni:
 *   get:
 *     summary: Browse the filterable alumni directory
 *     description: >
 *       Returns alumni profiles with their derived programme/graduationYear
 *       (from their most recently completed degree) and current employment.
 *       Consumed by the analytics dashboard's alumni directory view.
 *     tags:
 *       - Public API
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *       - in: query
 *         name: industrySector
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of matching alumni.
 *       400:
 *         description: Invalid graduationYear.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/alumni",
  apiRateLimiter(),
  requireApiKey("read:alumni"),
  alumniController.listAlumni,
);

/**
 * @swagger
 * /api/alumni/{id}:
 *   get:
 *     summary: Full profile detail for a single alumnus
 *     description: >
 *       Returns the same full-profile shape as /api/alumni/today (degrees,
 *       certifications, licences, courses, employment) for an arbitrary
 *       alumnus. Consumed by the analytics dashboard's alumni detail view.
 *     tags:
 *       - Public API
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The alumnus's full public profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AlumniOfTheDay'
 *       400:
 *         description: Invalid alumnus id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404:
 *         description: No alumnus with that id.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/alumni/:id",
  apiRateLimiter(),
  requireApiKey("read:alumni"),
  alumniController.getAlumnusById,
);

/**
 * @swagger
 * /api/analytics/skills-gap:
 *   get:
 *     summary: Curriculum skills gap (frequency proxy)
 *     description: >
 *       No curriculum reference data exists to diff against, so alumni
 *       certifications and professional courses are ranked by completion
 *       count and banded into critical/significant/emerging severity.
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Ranked, severity-banded skills. }
 *       400: { description: Invalid graduationYear, content: { application/json: { schema: { $ref: '#/components/schemas/ApiError' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/skills-gap",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getSkillsGap,
);

/**
 * @swagger
 * /api/analytics/employment-sectors:
 *   get:
 *     summary: Distribution of alumni across industry sectors
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Alumni count per industry sector. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/employment-sectors",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getEmploymentSectors,
);

/**
 * @swagger
 * /api/analytics/job-titles:
 *   get:
 *     summary: Most common current job titles
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200: { description: Top job titles by count. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/job-titles",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getJobTitles,
);

/**
 * @swagger
 * /api/analytics/employers:
 *   get:
 *     summary: Top employers of alumni
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200: { description: Top employers by count. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/employers",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getEmployers,
);

/**
 * @swagger
 * /api/analytics/locations:
 *   get:
 *     summary: Geographic distribution of alumni's current employment
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Alumni count per location. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/locations",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getLocations,
);

/**
 * @swagger
 * /api/analytics/cert-growth:
 *   get:
 *     summary: Certification growth over time
 *     description: Monthly count of certifications completed, optionally windowed.
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *       - in: query
 *         name: period
 *         description: "6, 12, or omitted for all-time"
 *         schema: { type: string, enum: ["6", "12"] }
 *     responses:
 *       200: { description: Monthly certification counts. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/cert-growth",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getCertGrowth,
);

/**
 * @swagger
 * /api/analytics/courses:
 *   get:
 *     summary: Most frequently completed post-graduation courses
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, maximum: 50 }
 *     responses:
 *       200: { description: Top courses by completion count. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/courses",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getCourses,
);

/**
 * @swagger
 * /api/analytics/completion:
 *   get:
 *     summary: Average profile completion percentage by graduation-year cohort
 *     tags:
 *       - Analytics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: programme
 *         schema: { type: string }
 *       - in: query
 *         name: graduationYear
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Average completion percentage per cohort. }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       429: { $ref: '#/components/responses/TooManyRequests' }
 */
router.get(
  "/analytics/completion",
  apiRateLimiter(),
  requireApiKey("read:analytics"),
  alumniController.getCompletion,
);

module.exports = router;
