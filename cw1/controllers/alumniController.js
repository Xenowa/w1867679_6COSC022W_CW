"use strict";

const pool = require("../config/db");
const { calculateCompletion } = require("./profileController");
const {
  PRIMARY_DEGREE_SUBQUERY,
  PRIMARY_EMPLOYMENT_SUBQUERY,
} = require("../services/pathwayService");

function parsePositiveInt(value, fallback, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

// Shared query builder for the analytics endpoints
function buildPathwayFilter(query) {
  const conditions = [];
  const params = [];
  if (query.programme) {
    conditions.push("pathway.programme = ?");
    params.push(query.programme);
  }
  if (query.graduationYear) {
    const year = Number(query.graduationYear);
    if (!Number.isInteger(year)) {
      return { error: "graduationYear must be an integer." };
    }
    conditions.push("pathway.graduationYear = ?");
    params.push(year);
  }
  return { conditions, params };
}

// full-profile shape selected by the different where clause
async function fetchAlumnusDetail(whereClause, whereParam) {
  const [[profile]] = await pool.query(
    `SELECT userId, fullName, bio, linkedinUrl, profileImage FROM profiles WHERE ${whereClause} LIMIT 1`,
    [whereParam],
  );
  if (!profile) return null;

  const [degrees] = await pool.query(
    "SELECT title, institution, url, completedAt FROM degrees WHERE userId = ? ORDER BY completedAt DESC",
    [profile.userId],
  );
  const [certifications] = await pool.query(
    "SELECT title, institution, url, completedAt FROM certifications WHERE userId = ? ORDER BY completedAt DESC",
    [profile.userId],
  );
  const [licences] = await pool.query(
    "SELECT title, institution, url, completedAt FROM licences WHERE userId = ? ORDER BY completedAt DESC",
    [profile.userId],
  );
  const [courses] = await pool.query(
    "SELECT title, institution, url, completedAt FROM professional_courses WHERE userId = ? ORDER BY completedAt DESC",
    [profile.userId],
  );
  const [employment] = await pool.query(
    "SELECT company, role, industrySector, location, startedAt, endedAt FROM employment_history WHERE userId = ? ORDER BY startedAt DESC",
    [profile.userId],
  );

  return {
    fullName: profile.fullName,
    bio: profile.bio,
    linkedinUrl: profile.linkedinUrl,
    profileImage: profile.profileImage,
    degrees,
    certifications,
    licences,
    courses,
    employment,
  };
}

// endpoint to expose alumnus of the day related details
exports.getTodaysAlumnus = async function (req, res, next) {
  try {
    const alumnus = await fetchAlumnusDetail("isAlumniOfDay = TRUE", true);
    if (!alumnus) {
      return res
        .status(404)
        .json({ error: "No alumnus is currently featured." });
    }
    res.json(alumnus);
  } catch (err) {
    next(err);
  }
};

// full profile detail for a single alumnus, backs the dashboard's detail view
exports.getAlumnusById = async function (req, res, next) {
  const userId = Number(req.params.id);
  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: "Invalid alumnus id." });
  }

  try {
    const alumnus = await fetchAlumnusDetail("userId = ?", userId);
    if (!alumnus) {
      return res.status(404).json({ error: "Alumnus not found." });
    }
    res.json(alumnus);
  } catch (err) {
    next(err);
  }
};

// filterable alumni directory
exports.listAlumni = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });

    const conditions = [...filter.conditions];
    const params = [...filter.params];
    if (req.query.industrySector) {
      conditions.push("currentJob.industrySector = ?");
      params.push(req.query.industrySector);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [alumni] = await pool.query(
      `SELECT p.userId, p.fullName, pathway.programme, pathway.graduationYear,
              currentJob.company, currentJob.role, currentJob.industrySector, currentJob.location
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       LEFT JOIN ${PRIMARY_EMPLOYMENT_SUBQUERY} ON currentJob.userId = p.userId
       ${where}
       ORDER BY p.fullName ASC`,
      params,
    );

    res.json({ alumni });
  } catch (err) {
    next(err);
  }
};

// certifications and courses ranked using completion count
exports.getSkillsGap = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const where = filter.conditions.length
      ? `WHERE ${filter.conditions.join(" AND ")}`
      : "";

    const [rows] = await pool.query(
      `SELECT skill, COUNT(*) AS count FROM (
         SELECT c.title AS skill, c.userId FROM certifications c
         UNION ALL
         SELECT pc.title AS skill, pc.userId FROM professional_courses pc
       ) skills
       INNER JOIN profiles p ON p.userId = skills.userId
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       ${where}
       GROUP BY skill
       ORDER BY count DESC`,
      filter.params,
    );

    const total = rows.length;
    const skillsGap = rows.map((row, index) => {
      const percentile = total > 1 ? index / (total - 1) : 0;
      const severity =
        percentile <= 1 / 3
          ? "critical"
          : percentile <= 2 / 3
            ? "significant"
            : "emerging";
      return { skill: row.skill, count: row.count, severity };
    });

    res.json({ skillsGap });
  } catch (err) {
    next(err);
  }
};

exports.getEmploymentSectors = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const conditions = [
      "currentJob.industrySector IS NOT NULL",
      ...filter.conditions,
    ];

    const [employmentSectors] = await pool.query(
      `SELECT currentJob.industrySector AS sector, COUNT(*) AS count
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       LEFT JOIN ${PRIMARY_EMPLOYMENT_SUBQUERY} ON currentJob.userId = p.userId
       WHERE ${conditions.join(" AND ")}
       GROUP BY currentJob.industrySector
       ORDER BY count DESC`,
      filter.params,
    );

    res.json({ employmentSectors });
  } catch (err) {
    next(err);
  }
};

exports.getJobTitles = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const conditions = ["currentJob.role IS NOT NULL", ...filter.conditions];
    const limit = parsePositiveInt(req.query.limit, 10, 50);

    const [jobTitles] = await pool.query(
      `SELECT currentJob.role AS jobTitle, COUNT(*) AS count
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       LEFT JOIN ${PRIMARY_EMPLOYMENT_SUBQUERY} ON currentJob.userId = p.userId
       WHERE ${conditions.join(" AND ")}
       GROUP BY currentJob.role
       ORDER BY count DESC
       LIMIT ?`,
      [...filter.params, limit],
    );

    res.json({ jobTitles });
  } catch (err) {
    next(err);
  }
};

exports.getEmployers = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const conditions = ["currentJob.company IS NOT NULL", ...filter.conditions];
    const limit = parsePositiveInt(req.query.limit, 10, 50);

    const [employers] = await pool.query(
      `SELECT currentJob.company AS employer, COUNT(*) AS count
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       LEFT JOIN ${PRIMARY_EMPLOYMENT_SUBQUERY} ON currentJob.userId = p.userId
       WHERE ${conditions.join(" AND ")}
       GROUP BY currentJob.company
       ORDER BY count DESC
       LIMIT ?`,
      [...filter.params, limit],
    );

    res.json({ employers });
  } catch (err) {
    next(err);
  }
};

exports.getLocations = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const conditions = [
      "currentJob.location IS NOT NULL",
      ...filter.conditions,
    ];

    const [locations] = await pool.query(
      `SELECT currentJob.location AS location, COUNT(*) AS count
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       LEFT JOIN ${PRIMARY_EMPLOYMENT_SUBQUERY} ON currentJob.userId = p.userId
       WHERE ${conditions.join(" AND ")}
       GROUP BY currentJob.location
       ORDER BY count DESC`,
      filter.params,
    );

    res.json({ locations });
  } catch (err) {
    next(err);
  }
};

exports.getCertGrowth = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const conditions = [...filter.conditions];
    const params = [...filter.params];

    if (req.query.period === "6" || req.query.period === "12") {
      conditions.push("c.completedAt >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)");
      params.push(Number(req.query.period));
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const [certGrowth] = await pool.query(
      `SELECT DATE_FORMAT(c.completedAt, '%Y-%m') AS month, COUNT(*) AS count
       FROM certifications c
       INNER JOIN profiles p ON p.userId = c.userId
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       ${where}
       GROUP BY month
       ORDER BY month ASC`,
      params,
    );

    res.json({ certGrowth });
  } catch (err) {
    next(err);
  }
};

exports.getCourses = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const where = filter.conditions.length
      ? `WHERE ${filter.conditions.join(" AND ")}`
      : "";
    const limit = parsePositiveInt(req.query.limit, 10, 50);

    const [courses] = await pool.query(
      `SELECT pc.title AS course, COUNT(*) AS count
       FROM professional_courses pc
       INNER JOIN profiles p ON p.userId = pc.userId
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       ${where}
       GROUP BY course
       ORDER BY count DESC
       LIMIT ?`,
      [...filter.params, limit],
    );

    res.json({ courses });
  } catch (err) {
    next(err);
  }
};

// profile completion % averaged per graduation-year cohort
exports.getCompletion = async function (req, res, next) {
  try {
    const filter = buildPathwayFilter(req.query);
    if (filter.error) return res.status(400).json({ error: filter.error });
    const where = filter.conditions.length
      ? `WHERE ${filter.conditions.join(" AND ")}`
      : "";

    const [profiles] = await pool.query(
      `SELECT p.userId, p.bio, p.linkedinUrl, p.profileImage, pathway.graduationYear
       FROM profiles p
       LEFT JOIN ${PRIMARY_DEGREE_SUBQUERY} ON pathway.userId = p.userId
       ${where}`,
      filter.params,
    );

    if (!profiles.length) return res.json({ completion: [] });

    const userIds = profiles.map((row) => row.userId);
    const [credentialCounts] = await pool.query(
      `SELECT userId, COUNT(*) AS count FROM (
         SELECT userId FROM degrees WHERE userId IN (?)
         UNION ALL SELECT userId FROM certifications WHERE userId IN (?)
         UNION ALL SELECT userId FROM licences WHERE userId IN (?)
         UNION ALL SELECT userId FROM professional_courses WHERE userId IN (?)
       ) creds GROUP BY userId`,
      [userIds, userIds, userIds, userIds],
    );
    const [employmentCounts] = await pool.query(
      "SELECT userId, COUNT(*) AS count FROM employment_history WHERE userId IN (?) GROUP BY userId",
      [userIds],
    );

    const credentialMap = new Map(
      credentialCounts.map((row) => [row.userId, row.count]),
    );
    const employmentMap = new Map(
      employmentCounts.map((row) => [row.userId, row.count]),
    );

    const cohorts = new Map();
    for (const profile of profiles) {
      const percent = calculateCompletion({
        profile: {
          bio: profile.bio,
          linkedinUrl: profile.linkedinUrl,
          profileImage: profile.profileImage,
        },
        degrees: new Array(credentialMap.get(profile.userId) || 0),
        certifications: [],
        licences: [],
        courses: [],
        employment: new Array(employmentMap.get(profile.userId) || 0),
      });

      const cohortKey = profile.graduationYear || "Unknown";
      if (!cohorts.has(cohortKey)) cohorts.set(cohortKey, []);
      cohorts.get(cohortKey).push(percent);
    }

    const completion = Array.from(cohorts.entries())
      .map(([graduationYear, percents]) => ({
        graduationYear,
        averageCompletion: Math.round(
          percents.reduce((sum, value) => sum + value, 0) / percents.length,
        ),
        alumniCount: percents.length,
      }))
      .sort((a, b) =>
        String(a.graduationYear).localeCompare(String(b.graduationYear)),
      );

    res.json({ completion });
  } catch (err) {
    next(err);
  }
};
