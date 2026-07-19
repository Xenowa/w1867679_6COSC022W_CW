# Alumni Influencers Platform

A server-side rendered Express/MySQL application for the University of Eastminster's Alumni Influencers Platform: alumni build professional profiles, bid blindly for a daily "Alumni of the Day" feature slot, and developers can consume a public Bearer-token-protected API for the currently featured alumnus.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later (built and tested on v22)
- [MySQL](https://dev.mysql.com/downloads/mysql/) 8.0 or later (built and tested on 9.3)
- A [Mailtrap](https://mailtrap.io/) account (free tier is enough) - used as the SMTP transport for verification/reset/bid-result emails in development. Use the **Email Testing** sandbox inbox, not Live/Sending.

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Xenowa/w1867679_6COSC022W_CW.git
cd cw1
npm install
```

### 2. Configure environment

Copy the example env file and fill in your own values:

```bash
cp .env.example .env
```

Open `.env` and set:

| Variable                                                  | Description                                                                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `PORT`                                                    | Port the app listens on (default `3000`)                                                                        |
| `SESSION_SECRET`                                          | Long random string used to sign the session cookie                                                              |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Your local MySQL connection details                                                                             |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`        | Your Mailtrap **Email Testing** sandbox SMTP credentials (Email Testing → Inboxes → your inbox → SMTP Settings) |
| `SMTP_FROM`                                               | The "from" address shown on outgoing emails, e.g. `"Alumni Influencers Platform <no-reply@eastminster.ac.uk>"`  |

### 3. Create the database

- Create a database from the mysql client
- match the `DB_NAME` in the `.env` to
  the created database name

### 4. Run migrations

```bash
npm run migrate
```

### 5. Seed sample data

```bash
npm run seed
```

Creates 5 verified alumni (with profiles, credentials, and employment history) and 1 developer account, all sharing the password `Passw0rd!`.

| Email                            | Role      | Password    |
| -------------------------------- | --------- | ----------- |
| `alice.kaur@eastminster.ac.uk`   | alumnus   | `Passw0rd!` |
| `ben.osei@eastminster.ac.uk`     | alumnus   | `Passw0rd!` |
| `chloe.tan@eastminster.ac.uk`    | alumnus   | `Passw0rd!` |
| `dinesh.patel@eastminster.ac.uk` | alumnus   | `Passw0rd!` |
| `ella.novak@eastminster.ac.uk`   | alumnus   | `Passw0rd!` |
| `dev@platform.local`             | developer | `Passw0rd!` |

### 6. Run the app

```bash
npm run dev   # nodemon, restarts on file changes
# or
npm start     # plain node
```

Visit `http://localhost:3000`.

## What each account can do

- **Alumnus accounts** (`role: alumnus`): manage their profile, degrees/certifications/licences/professional courses, employment history, event attendance, and place blind bids at `/bids` for the next day's Alumni of the Day slot.
- **Developer accounts** (`role: developer`): generate/revoke API keys and view usage stats at `/keys`, and consume the public API documented at `/api-docs`.

New account registration (`/auth/register`) is restricted to `@eastminster.ac.uk` email addresses and always creates an `alumnus` account -the developer role is seed-only in this build.

## Automated jobs

Two cron jobs start automatically with the app:

- **Winner selection** - daily at 18:00, closes bidding on the next day's slot and picks a winner
- **Monthly reset** - 00:00 on the 1st of each month, resets each alumnus's win count and bonus-slot flag

## API documentation

Interactive Swagger UI is served at `/api-docs`.
