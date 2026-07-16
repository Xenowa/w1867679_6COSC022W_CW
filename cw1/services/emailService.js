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
    `Welcome to the Alumni Influencers Platform! Verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    `<p>Welcome to the Alumni Influencers Platform!</p><p><a href="${verifyUrl}">Verify your email address</a></p><p>This link expires in 24 hours.</p>`,
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

exports.sendBidWonEmail = function (to, dateLabel) {
  return send(
    to,
    "You won Alumni of the Day!",
    `Congratulations! You won the Alumni of the Day slot for ${dateLabel}. Your profile will be featured to students for 24 hours.`,
    `<p>Congratulations! You won the <strong>Alumni of the Day</strong> slot for ${dateLabel}.</p><p>Your profile will be featured to students for 24 hours.</p>`,
  );
};

exports.sendBidLostEmail = function (to, dateLabel) {
  return send(
    to,
    "Alumni of the Day results",
    `Your bid for ${dateLabel} was not the highest this time. Better luck next time!`,
    `<p>Your bid for ${dateLabel} was not the highest this time.</p><p>Better luck next time!</p>`,
  );
};
