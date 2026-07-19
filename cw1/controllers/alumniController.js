"use strict";

const pool = require("../config/db");

// endpoint to expose alumnus of the day related details
exports.getTodaysAlumnus = async function (req, res, next) {
  try {
    const [[profile]] = await pool.query(
      "SELECT userId, fullName, bio, linkedinUrl, profileImage FROM profiles WHERE isAlumniOfDay = TRUE LIMIT 1",
    );

    if (!profile) {
      return res
        .status(404)
        .json({ error: "No alumnus is currently featured." });
    }

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

    res.json({
      fullName: profile.fullName,
      bio: profile.bio,
      linkedinUrl: profile.linkedinUrl,
      profileImage: profile.profileImage,
      degrees,
      certifications,
      licences,
      courses,
      employment,
    });
  } catch (err) {
    next(err);
  }
};
