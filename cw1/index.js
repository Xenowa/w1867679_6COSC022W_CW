"use strict";

/**
 * Module dependencies.
 */

require("dotenv").config();

const express = require("express");
const logger = require("morgan");
const path = require("node:path");
const session = require("express-session");
const methodOverride = require("method-override");
const helmet = require("helmet");
const hbs = require("hbs");

const app = (module.exports = express());

// define a custom res.message() method
// which stores messages in the session
app.response.message = function (msg) {
  // reference `req.session` via the `this.req` reference
  const sess = this.req.session;
  // simply add the msg to an array for later
  sess.messages = sess.messages || [];
  sess.messages.push(msg);
  return this;
};

// log
if (!module.parent) app.use(logger("dev"));

// security headers
app.use(helmet());

// parse request bodies (req.body)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session support
app.use(
  session({
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false, // don't save session if unmodified
    saveUninitialized: false, // don't create session until something stored
    cookie: {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24h, matches report §5.4
    },
  }),
);

// expose the "messages" local variable when views are rendered
app.use(function (req, res, next) {
  const msgs = req.session.messages || [];

  // expose "messages" local variable
  res.locals.messages = msgs;

  // expose "hasMessages"
  res.locals.hasMessages = !!msgs.length;

  // populated once auth exists, nav partial reads this
  res.locals.user = req.session.user || null;

  next();
  // empty or "flush" the messages so they
  // don't build up
  req.session.messages = [];
});

// allow overriding methods in query (?_method=put)
app.use(methodOverride("_method"));

// CSRF protection
const {
  csrfSynchronisedProtection,
  generateToken,
} = require("./middleware/csrf");
app.use(csrfSynchronisedProtection);
app.use(function (req, res, next) {
  res.locals.csrfToken = generateToken(req);
  next();
});

// view engine + partials
// hbs automatically wraps every render() in views/layout.hbs (using {{{body}}});
// pass { layout: false } on individual renders to opt out.
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views", "partials"));

// Registering Handlebars helpers
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
hbs.registerHelper("formatDateInput", function (date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});
hbs.registerHelper("formatDateDisplay", function (date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use(require("./routes/mainRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/profile", require("./routes/profileRoutes"));
app.use("/bids", require("./routes/bidRoutes"));
app.use("/keys", require("./routes/apiKeyRoutes"));

app.use(function (err, req, res, next) {
  if (err && err.code === "EBADCSRFTOKEN") {
    res.message(
      "Your session expired or the form was tampered with. Please try again.",
    );
    return res.redirect(req.get("Referrer") || "/");
  }

  // log it
  if (!module.parent) console.error(err.stack);

  // error page
  res.status(500).render("5xx");
});

// assume 404 since no middleware responded
app.use(function (req, res, next) {
  res.status(404).render("404", { url: req.originalUrl });
});

/* istanbul ignore next */
if (!module.parent) {
  // Initiate the cron cycle
  require("./tasks/scheduler")();

  // Initialize the application
  const port = process.env.PORT || 3000;
  app.listen(port);
  console.log("Express started on port " + port);
}
