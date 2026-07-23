"use strict";

const bcrypt = require("bcrypt");
const pool = require("../config/db");
const tokenService = require("../services/tokenService");
const emailService = require("../services/emailService");

const BCRYPT_COST = 10;
const ALLOWED_EMAIL_DOMAIN = "@eastminster.ac.uk";
const PASSWORD_MIN_LENGTH = 8;
const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

// prevents timing-based email enumeration on login
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "no-such-admin-placeholder",
  BCRYPT_COST,
);

function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);
  } else if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  return errors;
}

function validateRegistration(body) {
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const errors = [];

  if (!email) {
    errors.push("Email is required.");
  } else if (!email.endsWith(ALLOWED_EMAIL_DOMAIN)) {
    errors.push(
      `Email must be a university address ending in ${ALLOWED_EMAIL_DOMAIN}.`,
    );
  }

  errors.push(...validatePasswordStrength(password));

  return { errors, email, password };
}

exports.showRegisterForm = function (req, res) {
  res.render("auth/register", { email: "" });
};

exports.register = async function (req, res, next) {
  const { errors, email, password } = validateRegistration(req.body);

  if (errors.length) {
    return res.status(400).render("auth/register", { errors, email });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      "SELECT id FROM admin_users WHERE email = ? FOR UPDATE",
      [email],
    );
    if (existing.length) {
      await connection.rollback();
      return res.status(400).render("auth/register", {
        errors: ["An account with that email already exists."],
        email,
      });
    }

    const [adminResult] = await connection.query(
      "INSERT INTO admin_users (email, passwordHash, emailVerified) VALUES (?, ?, ?)",
      [email, passwordHash, false],
    );
    const adminId = adminResult.insertId;

    const rawToken = await tokenService.createToken(
      connection,
      "admin_email_verifications",
      adminId,
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
    const adminId = await tokenService.verifyAndConsumeToken(
      pool,
      "admin_email_verifications",
      "id",
      rawToken,
    );

    if (!adminId) {
      res.message("That verification link is invalid or has expired.");
      return res.redirect("/auth/login");
    }

    await pool.query(
      "UPDATE admin_users SET emailVerified = TRUE WHERE id = ?",
      [adminId],
    );

    res.message("Email verified! You can now log in.");
    res.redirect("/auth/login");
  } catch (err) {
    next(err);
  }
};

exports.showLoginForm = function (req, res) {
  res.render("auth/login", { email: "" });
};

exports.login = async function (req, res, next) {
  const email = (req.body.email || "").trim().toLowerCase();
  const password = req.body.password || "";

  function invalidCredentials() {
    res
      .status(400)
      .render("auth/login", { email, errors: ["Invalid email or password."] });
  }

  if (!email || !password) return invalidCredentials();

  try {
    const [rows] = await pool.query(
      "SELECT id, email, passwordHash, emailVerified FROM admin_users WHERE email = ?",
      [email],
    );
    const admin = rows[0];

    // constant-time comparison against a dummy hash even when no admin is found
    const passwordMatches = await bcrypt.compare(
      password,
      admin ? admin.passwordHash : DUMMY_PASSWORD_HASH,
    );

    if (!admin || !passwordMatches) return invalidCredentials();

    if (!admin.emailVerified) {
      return res.status(400).render("auth/login", {
        email,
        errors: ["Please verify your email before logging in."],
      });
    }

    req.session.regenerate(function (err) {
      if (err) return next(err);
      req.session.admin = {
        id: admin.id,
        email: admin.email,
      };
      res.message("Logged in successfully.");
      res.redirect("/");
    });
  } catch (err) {
    next(err);
  }
};

exports.logout = function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.clearCookie("sid");
    res.redirect("/auth/login");
  });
};

exports.showForgotPasswordForm = function (req, res) {
  res.render("auth/forgot-password");
};

exports.forgotPassword = async function (req, res, next) {
  const email = (req.body.email || "").trim().toLowerCase();

  try {
    if (email) {
      const [rows] = await pool.query(
        "SELECT id FROM admin_users WHERE email = ?",
        [email],
      );
      const admin = rows[0];

      if (admin) {
        const rawToken = await tokenService.createToken(
          pool,
          "admin_password_resets",
          admin.id,
          PASSWORD_RESET_TOKEN_TTL_MS,
        );
        const resetUrl = `${req.protocol}://${req.get("host")}/auth/reset-password?token=${rawToken}`;
        await emailService.sendPasswordResetEmail(email, resetUrl);
      }
    }

    // same message whether or not the email exists - avoids enumeration
    res.message(
      "If that email is registered, a password reset link has been sent.",
    );
    res.redirect("/auth/login");
  } catch (err) {
    next(err);
  }
};

exports.showResetPasswordForm = function (req, res) {
  res.render("auth/reset-password", { token: req.query.token || "" });
};

exports.resetPassword = async function (req, res, next) {
  const token = req.body.token || "";
  const password = req.body.password || "";

  function invalid(message) {
    return res
      .status(400)
      .render("auth/reset-password", { token, errors: [message] });
  }

  if (!token) return invalid("Invalid or expired reset link.");

  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length) return invalid(passwordErrors[0]);

  try {
    const adminId = await tokenService.verifyAndConsumeToken(
      pool,
      "admin_password_resets",
      "id",
      token,
    );
    if (!adminId) return invalid("That reset link is invalid or has expired.");

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
    await pool.query("UPDATE admin_users SET passwordHash = ? WHERE id = ?", [
      passwordHash,
      adminId,
    ]);

    res.message("Password updated! You can now log in.");
    res.redirect("/auth/login");
  } catch (err) {
    next(err);
  }
};
