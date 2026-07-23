"use strict";

const apiClient = require("../services/apiClient");
const { listPresets } = require("./presetController");

exports.showCharts = async function (req, res, next) {
  const filters = {
    programme: req.query.programme || "",
    graduationYear: req.query.graduationYear || "",
  };
  const jobTitlesLimit = req.query.jobTitlesLimit || "10";
  const employersLimit = req.query.employersLimit || "10";
  const certGrowthPeriod =
    req.query.certGrowthPeriod === "6" || req.query.certGrowthPeriod === "12"
      ? req.query.certGrowthPeriod
      : "all";

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
      presets,
    ] = await Promise.all([
      apiClient.getSkillsGap(filters),
      apiClient.getEmploymentSectors(filters),
      apiClient.getJobTitles({ ...filters, limit: jobTitlesLimit }),
      apiClient.getEmployers({ ...filters, limit: employersLimit }),
      apiClient.getLocations(filters),
      apiClient.getCertGrowth({
        ...filters,
        period: certGrowthPeriod === "all" ? "" : certGrowthPeriod,
      }),
      apiClient.getCourses(filters),
      apiClient.getCompletion(filters),
      listPresets(req.session.admin.id),
    ]);

    res.render("charts/index", {
      filters: {
        ...filters,
        jobTitlesLimit,
        employersLimit,
        certGrowthPeriod,
      },
      presets,
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
