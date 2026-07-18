"use strict";

const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");
const upload = require("../middleware/upload");
const { csrfSynchronisedProtection } = require("../middleware/csrf");

router.use(requireAuth, requireRole("alumnus"));

router.get("/", profileController.showProfile);
router.get("/edit", profileController.showEditForm);
router.post("/edit", profileController.updateProfile);

router.post(
  "/image",
  function (req, res, next) {
    upload.single("profileImage")(req, res, function (err) {
      if (err) {
        res.message(err.message || "Upload failed.");
        return res.redirect("/profile/edit");
      }
      next();
    });
  },
  csrfSynchronisedProtection,
  profileController.uploadImage,
);

module.exports = router;
