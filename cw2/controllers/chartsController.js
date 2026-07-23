"use strict";

const apiClient = require("../services/apiClient");

exports.showCharts = async function (req, res, next) {
  const filters = {
    programme: req.query.programme || "",
    graduationYear: req.query.graduationYear || "",
  };

  try {
    const [
      skillsGap,
      employmentSectors,
      jobTitles,
      employers,
      locations,
      certGrowth,
      courses,
      completion,
    ] = await Promise.all([
      apiClient.getSkillsGap(filters),
      apiClient.getEmploymentSectors(filters),
      apiClient.getJobTitles(filters),
      apiClient.getEmployers(filters),
      apiClient.getLocations(filters),
      apiClient.getCertGrowth(filters),
      apiClient.getCourses(filters),
      apiClient.getCompletion(filters),
    ]);

    res.render("charts/index", {
      filters,
      chartData: {
        skillsGap: skillsGap.skillsGap,
        employmentSectors: employmentSectors.employmentSectors,
        jobTitles: jobTitles.jobTitles,
        employers: employers.employers,
        locations: locations.locations,
        certGrowth: certGrowth.certGrowth,
        courses: courses.courses,
        completion: completion.completion,
      },
    });
  } catch (err) {
    next(err);
  }
};
