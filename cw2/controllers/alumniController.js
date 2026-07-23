"use strict";

const apiClient = require("../services/apiClient");

exports.listAlumni = async function (req, res, next) {
  try {
    const filters = {
      programme: req.query.programme || "",
      graduationYear: req.query.graduationYear || "",
      industrySector: req.query.industrySector || "",
    };
    const { alumni } = await apiClient.getAlumni(filters);
    res.render("alumni/index", { alumni, filters });
  } catch (err) {
    next(err);
  }
};

exports.showAlumnus = async function (req, res, next) {
  try {
    const alumnus = await apiClient.getAlumnusById(req.params.id);
    res.render("alumni/show", { alumnus });
  } catch (err) {
    if (err instanceof apiClient.ApiClientError && err.status === 404) {
      res.message("That alumnus could not be found.");
      return res.redirect("/alumni");
    }
    next(err);
  }
};
