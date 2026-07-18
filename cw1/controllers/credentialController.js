"use strict";

const pool = require("../config/db");

const URL_PATTERN = /^https?:\/\/[^\s]+$/;

function validate(body) {
  const errors = [];
  const title = (body.title || "").trim();
  const institution = (body.institution || "").trim();
  const url = (body.url || "").trim();
  const completedAt = (body.completedAt || "").trim();

  if (!title) errors.push("Title is required.");
  if (!institution) errors.push("Institution is required.");
  if (!completedAt) errors.push("Completion date is required.");
  if (url && !URL_PATTERN.test(url))
    errors.push("URL must be a valid http(s) link.");

  return { errors, title, institution, url, completedAt };
}

// As for all the credential modules the same steps repeat, a common wrapper was extracted out
function createCredentialController(table, idColumn) {
  return {
    create: async function (req, res, next) {
      const { errors, title, institution, url, completedAt } = validate(
        req.body,
      );
      if (errors.length) {
        res.message(errors.join(" "));
        return res.redirect("/profile");
      }

      try {
        await pool.query(
          "INSERT INTO ?? (userId, title, institution, url, completedAt) VALUES (?, ?, ?, ?, ?)",
          [
            table,
            req.session.user.userId,
            title,
            institution,
            url || null,
            completedAt,
          ],
        );
        res.message("Added.");
        res.redirect("/profile");
      } catch (err) {
        next(err);
      }
    },

    update: async function (req, res, next) {
      const { errors, title, institution, url, completedAt } = validate(
        req.body,
      );
      if (errors.length) {
        res.message(errors.join(" "));
        return res.redirect("/profile");
      }

      try {
        const [result] = await pool.query(
          "UPDATE ?? SET title = ?, institution = ?, url = ?, completedAt = ? WHERE ?? = ? AND userId = ?",
          [
            table,
            title,
            institution,
            url || null,
            completedAt,
            idColumn,
            req.params.id,
            req.session.user.userId,
          ],
        );
        res.message(result.affectedRows ? "Updated." : "Record not found.");
        res.redirect("/profile");
      } catch (err) {
        next(err);
      }
    },

    remove: async function (req, res, next) {
      try {
        const [result] = await pool.query(
          "DELETE FROM ?? WHERE ?? = ? AND userId = ?",
          [table, idColumn, req.params.id, req.session.user.userId],
        );
        res.message(result.affectedRows ? "Deleted." : "Record not found.");
        res.redirect("/profile");
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = {
  degrees: createCredentialController("degrees", "degreeId"),
  certifications: createCredentialController("certifications", "certificateId"),
  licences: createCredentialController("licences", "licenseId"),
  courses: createCredentialController("professional_courses", "courseId"),
};
