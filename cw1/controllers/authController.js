"use strict";

const bcrypt = require("bcrypt");
const pool = require("../config/db");
const tokenService = require("../services/tokenService");
const emailService = require("../services/emailService");

// Define constants for password hashing and validation
const BCRYPT_COST = 10;
const ALLOWED_EMAIL_DOMAIN = "@eastminster.ac.uk";
const PASSWORD_MIN_LENGTH = 8;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function validateRegistration(body) {
  const errors = [];
  const fullName = (body.fullName || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";

  if (!fullName) errors.push("Full name is required.");

  if (!email) {
    errors.push("Email is required.");
  } else if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    errors.push(
      `Email must be a university address ending in ${ALLOWED_EMAIL_DOMAIN}.`,
    );
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  } else if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }

  return { errors, fullName, email, password };
}

exports.showRegisterForm = function (req, res) {
  res.render("auth/register", { fullName: "", email: "" });
};

exports.register = async function (req, res, next) {
  const { errors, fullName, email, password } = validateRegistration(req.body);

  if (errors.length) {
    return res.status(400).render("auth/register", { errors, fullName, email });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT userId FROM users WHERE email = ? FOR UPDATE",
      [email],
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(400).render("auth/register", {
        errors: ["An account with that email already exists."],
        fullName,
        email,
      });
    }

    const [userResult] = await connection.query(
      "INSERT INTO users (email, passwordHash, role, emailVerified) VALUES (?, ?, ?, ?)",
      [email, passwordHash, "alumnus", false],
    );
    const userId = userResult.insertId;

    await connection.query(
      "INSERT INTO profiles (userId, fullName) VALUES (?, ?)",
      [userId, fullName],
    );

    const rawToken = await tokenService.createToken(
      connection,
      "email_verifications",
      userId,
      VERIFICATION_TOKEN_TTL_MS,
    );

    await connection.commit();

    const verifyUrl = `${req.protocol}://${req.get("host")}/auth/verify-email?token=${rawToken}`;
    await emailService.sendVerificationEmail(email, verifyUrl);

    res.message(
      "Registration successful! Check your email to verify your account before logging in.",
    );
    res.redirect("/auth/login");
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

exports.verifyEmail = async function (req, res, next) {
  const rawToken = req.query.token;

  if (!rawToken) {
    res.message("Invalid verification link.");
    return res.redirect("/auth/login");
  }

  try {
    const userId = await tokenService.verifyAndConsumeToken(
      pool,
      "email_verifications",
      "emailId",
      rawToken,
    );

    if (!userId) {
      res.message("That verification link is invalid or has expired.");
      return res.redirect("/auth/login");
    }

    await pool.query("UPDATE users SET emailVerified = TRUE WHERE userId = ?", [userId]);

    res.message("Email verified! You can now log in.");
    res.redirect("/auth/login");
  } catch (err) {
    next(err);
  }
};
