'use strict';

const pool = require('../config/db');

const LINKEDIN_URL_PATTERN = /^https:\/\/(www\.)?linkedin\.com\/in\/[A-Za-z0-9\-_%]+\/?$/;

async function fetchFullProfile(userId) {
  const [[profile]] = await pool.query('SELECT * FROM profiles WHERE userId = ?', [userId]);
  if (!profile) return null;

  const [degrees] = await pool.query('SELECT * FROM degrees WHERE userId = ? ORDER BY completedAt DESC', [userId]);
  const [certifications] = await pool.query(
    'SELECT * FROM certifications WHERE userId = ? ORDER BY completedAt DESC',
    [userId],
  );
  const [licences] = await pool.query('SELECT * FROM licences WHERE userId = ? ORDER BY completedAt DESC', [userId]);
  const [courses] = await pool.query(
    'SELECT * FROM professional_courses WHERE userId = ? ORDER BY completedAt DESC',
    [userId],
  );
  const [employment] = await pool.query(
    'SELECT * FROM employment_history WHERE userId = ? ORDER BY startedAt DESC',
    [userId],
  );

  return { profile, degrees, certifications, licences, courses, employment };
}

function calculateCompletion(data) {
  const checks = [
    !!data.profile.bio,
    !!data.profile.linkedinUrl,
    !!data.profile.profileImage,
    data.degrees.length + data.certifications.length + data.licences.length + data.courses.length > 0,
    data.employment.length > 0,
  ];
  const completed = checks.filter(Boolean).length;
  return Math.round((completed / checks.length) * 100);
}

exports.showProfile = async function (req, res, next) {
  try {
    const data = await fetchFullProfile(req.session.user.userId);
    res.render('profile/show', {
      ...data,
      completionPercent: calculateCompletion(data),
    });
  } catch (err) {
    next(err);
  }
};

exports.showEditForm = async function (req, res, next) {
  try {
    const [[profile]] = await pool.query('SELECT * FROM profiles WHERE userId = ?', [req.session.user.userId]);
    res.render('profile/edit', { profile });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async function (req, res, next) {
  const fullName = (req.body.fullName || '').trim();
  const bio = (req.body.bio || '').trim();
  const linkedinUrl = (req.body.linkedinUrl || '').trim();

  const errors = [];
  if (!fullName) errors.push('Full name is required.');
  if (linkedinUrl && !LINKEDIN_URL_PATTERN.test(linkedinUrl)) {
    errors.push('LinkedIn URL must look like https://linkedin.com/in/your-name.');
  }

  try {
    if (errors.length) {
      const [[existing]] = await pool.query('SELECT profileImage FROM profiles WHERE userId = ?', [
        req.session.user.userId,
      ]);
      return res.status(400).render('profile/edit', {
        profile: {
          userId: req.session.user.userId,
          fullName,
          bio,
          linkedinUrl,
          profileImage: existing && existing.profileImage,
        },
        errors,
      });
    }

    await pool.query('UPDATE profiles SET fullName = ?, bio = ?, linkedinUrl = ? WHERE userId = ?', [
      fullName,
      bio || null,
      linkedinUrl || null,
      req.session.user.userId,
    ]);
    res.message('Profile updated.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async function (req, res, next) {
  if (!req.file) {
    res.message('Please choose an image to upload.');
    return res.redirect('/profile/edit');
  }

  try {
    const relativePath = `/uploads/${req.file.filename}`;
    await pool.query('UPDATE profiles SET profileImage = ? WHERE userId = ?', [
      relativePath,
      req.session.user.userId,
    ]);
    res.message('Profile image updated.');
    res.redirect('/profile');
  } catch (err) {
    next(err);
  }
};
