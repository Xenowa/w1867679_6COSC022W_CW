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
const { ApiClientError } = require("./services/apiClient");

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

// log (Morgan is used to log every request, including those that were rejected)
if (!module.parent) app.use(logger("dev"));

// security headers
app.use(helmet());

// parse request bodies of every request (req.body)
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
      maxAge: 24 * 60 * 60 * 1000, // 24h
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

  // populated once admin auth exists, sidebar partial reads this
  res.locals.admin = req.session.admin || null;

  // flush the queue
  req.session.messages = [];
  next();
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
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
hbs.registerPartials(path.join(__dirname, "views", "partials"));

// Registering Handlebars helpers
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
hbs.registerHelper("formatDateDisplay", function (date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
// safe to embed inside a <script> tag - escapes "<" so a value containing "</script>" can't break out of it
hbs.registerHelper("json", function (context) {
  return new hbs.SafeString(JSON.stringify(context).replace(/</g, "\\u003c"));
});

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use(require("./routes/mainRoutes"));
app.use("/auth", require("./routes/authRoutes"));
app.use("/alumni", require("./routes/alumniRoutes"));
app.use(
  "/charts",

  // Relax content security policy for this route to allow inline scripts and the CDN
  helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
    },
  }),
  require("./routes/chartsRoutes"),
);
app.use("/export", require("./routes/exportRoutes"));

app.use(function (err, req, res, next) {
  if (err && err.code === "EBADCSRFTOKEN") {
    res.message(
      "Your session expired or the form was tampered with. Please try again.",
    );
    return res.redirect(req.get("Referrer") || "/");
  }

  if (err instanceof ApiClientError) {
    // log it
    if (!module.parent) console.error(err.stack);

    const friendlyMessage =
      err.status === 401 || err.status === 403
        ? "The dashboard's connection to the student platform isn't authorized. Contact the developer to check the API key."
        : "The student platform is temporarily unavailable. Please try again shortly.";
    return res
      .status(err.status >= 400 && err.status < 600 ? err.status : 502)
      .render("api-error", { message: friendlyMessage });
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
  // Initialize the application
  const port = process.env.PORT || 3001;
  app.listen(port);
  console.log("Express started on port " + port);
}
