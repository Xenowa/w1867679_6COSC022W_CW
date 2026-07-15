'use strict';

require('dotenv').config();

const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const BCRYPT_COST = 10;
const SEED_PASSWORD = 'Passw0rd!';

const alumni = [
  {
    email: 'alice.kaur@eastminster.ac.uk',
    fullName: 'Alice Kaur',
    bio: 'Software engineer building distributed systems at scale.',
    linkedinUrl: 'https://linkedin.com/in/alicekaur',
    degrees: [{ title: 'BSc (Hons) Computer Science', institution: 'University of Westminster', completedAt: '2019-07-01' }],
    certifications: [{ title: 'AWS Certified Solutions Architect', institution: 'Amazon Web Services', completedAt: '2022-03-15' }],
    licences: [],
    courses: [],
    employment: [{ company: 'Google', role: 'Software Engineer', industrySector: 'Software Engineering', location: 'London, UK', startedAt: '2019-09-01', endedAt: null }],
  },
  {
    email: 'ben.osei@eastminster.ac.uk',
    fullName: 'Ben Osei',
    bio: 'Data analyst turning messy data into decisions.',
    linkedinUrl: 'https://linkedin.com/in/benosei',
    degrees: [{ title: 'BSc (Hons) Data Science', institution: 'University of Westminster', completedAt: '2020-07-01' }],
    certifications: [],
    licences: [{ title: 'Chartered Data Analyst', institution: 'Chartered Data Analytics Institute', completedAt: '2023-01-10' }],
    courses: [{ title: 'Advanced SQL for Analytics', institution: 'DataCamp', completedAt: '2021-05-20' }],
    employment: [{ company: 'Deloitte', role: 'Data Analyst', industrySector: 'Data Analytics', location: 'Manchester, UK', startedAt: '2020-09-01', endedAt: null }],
  },
  {
    email: 'chloe.tan@eastminster.ac.uk',
    fullName: 'Chloe Tan',
    bio: 'Product manager obsessed with user-centred design.',
    linkedinUrl: 'https://linkedin.com/in/chloetan',
    degrees: [{ title: 'BSc (Hons) Business Information Systems', institution: 'University of Westminster', completedAt: '2018-07-01' }],
    certifications: [{ title: 'Certified Scrum Product Owner', institution: 'Scrum.org', completedAt: '2021-11-05' }],
    licences: [],
    courses: [],
    employment: [
      { company: 'Spotify', role: 'Product Manager', industrySector: 'Product Management', location: 'Stockholm, Sweden', startedAt: '2021-02-01', endedAt: null },
      { company: 'Klarna', role: 'Associate Product Manager', industrySector: 'Product Management', location: 'Stockholm, Sweden', startedAt: '2018-09-01', endedAt: '2021-01-15' },
    ],
  },
  {
    email: 'dinesh.patel@eastminster.ac.uk',
    fullName: 'Dinesh Patel',
    bio: 'Cybersecurity consultant helping enterprises stay breach-free.',
    linkedinUrl: 'https://linkedin.com/in/dineshpatel',
    degrees: [{ title: 'BSc (Hons) Computer Science', institution: 'University of Westminster', completedAt: '2017-07-01' }],
    certifications: [{ title: 'CISSP', institution: 'ISC2', completedAt: '2020-06-01' }],
    licences: [],
    courses: [],
    employment: [{ company: 'PwC', role: 'Cybersecurity Consultant', industrySector: 'Cybersecurity', location: 'Colombo, Sri Lanka', startedAt: '2017-10-01', endedAt: null }],
  },
  {
    email: 'ella.novak@eastminster.ac.uk',
    fullName: 'Ella Novak',
    bio: 'Machine learning engineer working on generative models.',
    linkedinUrl: 'https://linkedin.com/in/ellanovak',
    degrees: [{ title: 'MSc Artificial Intelligence', institution: 'University of Westminster', completedAt: '2021-07-01' }],
    certifications: [{ title: 'TensorFlow Developer Certificate', institution: 'Google', completedAt: '2022-09-12' }],
    licences: [],
    courses: [],
    employment: [{ company: 'NVIDIA', role: 'Machine Learning Engineer', industrySector: 'Machine Learning', location: 'Berlin, Germany', startedAt: '2021-09-01', endedAt: null }],
  },
];

const developer = {
  email: 'dev@platform.local',
  fullName: 'Sam Developer',
};

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const seedEmails = [...alumni.map((a) => a.email), developer.email];
    // wipe any previous seed run; cascades clean up profiles/credentials/employment
    await connection.query('DELETE FROM users WHERE email IN (?)', [seedEmails]);

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST);

    for (const person of alumni) {
      const [userResult] = await connection.query(
        'INSERT INTO users (email, passwordHash, role, emailVerified) VALUES (?, ?, ?, ?)',
        [person.email, passwordHash, 'alumnus', true],
      );
      const userId = userResult.insertId;

      await connection.query(
        'INSERT INTO profiles (userId, fullName, bio, linkedinUrl) VALUES (?, ?, ?, ?)',
        [userId, person.fullName, person.bio, person.linkedinUrl],
      );

      for (const d of person.degrees) {
        await connection.query(
          'INSERT INTO degrees (userId, title, institution, completedAt) VALUES (?, ?, ?, ?)',
          [userId, d.title, d.institution, d.completedAt],
        );
      }
      for (const c of person.certifications) {
        await connection.query(
          'INSERT INTO certifications (userId, title, institution, completedAt) VALUES (?, ?, ?, ?)',
          [userId, c.title, c.institution, c.completedAt],
        );
      }
      for (const l of person.licences) {
        await connection.query(
          'INSERT INTO licences (userId, title, institution, completedAt) VALUES (?, ?, ?, ?)',
          [userId, l.title, l.institution, l.completedAt],
        );
      }
      for (const course of person.courses) {
        await connection.query(
          'INSERT INTO professional_courses (userId, title, institution, completedAt) VALUES (?, ?, ?, ?)',
          [userId, course.title, course.institution, course.completedAt],
        );
      }
      for (const job of person.employment) {
        await connection.query(
          'INSERT INTO employment_history (userId, company, role, industrySector, location, startedAt, endedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, job.company, job.role, job.industrySector, job.location, job.startedAt, job.endedAt],
        );
      }

      console.log('Seeded alumnus: %s (userId %d)', person.email, userId);
    }

    const [devResult] = await connection.query(
      'INSERT INTO users (email, passwordHash, role, emailVerified) VALUES (?, ?, ?, ?)',
      [developer.email, passwordHash, 'developer', true],
    );
    console.log('Seeded developer: %s (userId %d)', developer.email, devResult.insertId);

    console.log('\nSeed complete. All seeded accounts share the password: %s', SEED_PASSWORD);
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exitCode = 1;
});
