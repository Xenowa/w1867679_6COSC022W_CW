"use strict";

const nodemailer = require("nodemailer");

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function send(to, subject, text, html) {
  return transport.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html,
  });
}

exports.sendVerificationEmail = function (to, verifyUrl) {
  return send(
    to,
    "Verify your email address",
    `Welcome to the University Analytics Dashboard! Verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    `<p>Welcome to the University Analytics Dashboard!</p><p><a href="${verifyUrl}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
  );
};

exports.sendPasswordResetEmail = function (to, resetUrl) {
  return send(
    to,
    "Reset your password",
    `We received a request to reset your password. Visit: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  );
};
