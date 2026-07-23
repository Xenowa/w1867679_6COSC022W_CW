# University Analytics Dashboard

A server-side rendered Express/MySQL application for university staff: consumes the Alumni Influencers Platform's API through a scoped Bearer key to surface skills-gap, employment, and engagement analytics.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (built and tested on v22)
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0 or later (built and tested on 9.3)
- A [Mailtrap](https://mailtrap.io/) account (free tier is enough) - used as the SMTP transport for verification/reset emails in development.

## Setup

### 1. Install

```bash
cd cw2
npm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable                                                  | Description                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------ |
| `PORT`                                                    | Port the app listens on (default `3001`)                     |
| `SESSION_SECRET`                                          | Long random string used to sign the session cookie           |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Your local MySQL connection details, e.g. `alumni_dashboard` |
| `CW1_API_URL`                                             | Base URL of CW1's API, e.g. `http://localhost:3000/api`      |
| `DASHBOARD_API_KEY`                                       | A CW1 API key scoped to `read:alumni` and `read:analytics`   |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`        | Mailtrap **Email Testing** sandbox SMTP credentials          |
| `SMTP_FROM`                                               | The "from" address shown on outgoing emails                  |

### 3. Get a dashboard API key from Student/Alumni Platform

Once the student platform is running, log in as a developer and generate a new API key with the relevant scopes selected. Copy the raw key and use it in this applications `.env` file into the `DASHBOARD_API_KEY`.

### 4. Create the database

- Create a database from the mysql client
- match the `DB_NAME` in the `.env` to the created database name

### 5. Run migrations

```bash
npm run migrate
```

### 6. Run the app

```bash
npm run dev   # nodemon, restarts on file changes
# or
npm start     # plain node
```

Visit `http://localhost:3001`, register an admin account (`@eastminster.ac.uk` email required), verify it via the email Mailtrap receives, then log in.

## What an admin account can do

- View the dashboard overview: total alumni count, today's featured alumnus, top job titles, recent certification trends.
- Browse the filterable alumni directory and individual alumni profiles.
- View all 8 analytics charts, filterable by programme and graduation year, with per-chart controls.
- Export the filtered alumni list or the full analytics dataset as CSV, download any chart as a PNG, or generate a printable PDF report.
- Save/apply/delete named filter presets, scoped to their own account.
