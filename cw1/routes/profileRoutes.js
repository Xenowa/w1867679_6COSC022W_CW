"use strict";

const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const credentialControllers = require("../controllers/credentialController");
const employmentController = require("../controllers/employmentController");
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

  // First upload the image using multer
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

  // Next call the controller to provide uploaded path to save in db
  profileController.uploadImage,
);

// Define routes for creating, updating, and removing credentials of the alumnus user
router.post("/degrees", credentialControllers.degrees.create);
router.put("/degrees/:id", credentialControllers.degrees.update);
router.delete("/degrees/:id", credentialControllers.degrees.remove);

router.post("/certifications", credentialControllers.certifications.create);
router.put("/certifications/:id", credentialControllers.certifications.update);
router.delete(
  "/certifications/:id",
  credentialControllers.certifications.remove,
);

router.post("/licences", credentialControllers.licences.create);
router.put("/licences/:id", credentialControllers.licences.update);
router.delete("/licences/:id", credentialControllers.licences.remove);

router.post("/courses", credentialControllers.courses.create);
router.put("/courses/:id", credentialControllers.courses.update);
router.delete("/courses/:id", credentialControllers.courses.remove);

router.post("/employment", employmentController.create);
router.put("/employment/:id", employmentController.update);
router.delete("/employment/:id", employmentController.remove);

router.post("/event-attendance", profileController.recordEventAttendance);

module.exports = router;
