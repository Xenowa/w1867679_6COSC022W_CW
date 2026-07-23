"use strict";

const apiClient = require("../services/apiClient");
const { toCsv } = require("../services/csvService");

const ALUMNI_COLUMNS = [
  { key: "fullName", header: "Full name" },
  { key: "programme", header: "Programme" },
  { key: "graduationYear", header: "Graduation year" },
  { key: "company", header: "Company" },
  { key: "role", header: "Role" },
  { key: "industrySector", header: "Industry sector" },
  { key: "location", header: "Location" },
];

exports.exportAlumniCsv = async function (req, res, next) {
  try {
    const filters = {
      programme: req.query.programme || "",
      graduationYear: req.query.graduationYear || "",
      industrySector: req.query.industrySector || "",
    };
    const { alumni } = await apiClient.getAlumni(filters);
    const csv = toCsv(ALUMNI_COLUMNS, alumni);

    res.set("Content-Type", "text/csv");
    res.set("Content-Disposition", 'attachment; filename="alumni.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// one normalised long-format export covering every chart on the analytics
// page (report ss7.1: "streams the current analytics dataset") - different
// charts have different fields, so rows are (chart, label, value, detail)
exports.exportChartDataCsv = async function (req, res, next) {
  try {
    const filters = {
      programme: req.query.programme || "",
      graduationYear: req.query.graduationYear || "",
    };

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
      apiClient.getJobTitles({ ...filters, limit: req.query.jobTitlesLimit }),
      apiClient.getEmployers({ ...filters, limit: req.query.employersLimit }),
      apiClient.getLocations(filters),
      apiClient.getCertGrowth({
        ...filters,
        period:
          req.query.certGrowthPeriod === "all"
            ? ""
            : req.query.certGrowthPeriod,
      }),
      apiClient.getCourses(filters),
      apiClient.getCompletion(filters),
    ]);

    const rows = [
      ...skillsGap.skillsGap.map((d) => ({
        chart: "Curriculum skills gap",
        label: d.skill,
        value: d.count,
        detail: d.severity,
      })),
      ...employmentSectors.employmentSectors.map((d) => ({
        chart: "Employment by industry sector",
        label: d.sector,
        value: d.count,
        detail: "",
      })),
      ...jobTitles.jobTitles.map((d) => ({
        chart: "Most common job titles",
        label: d.jobTitle,
        value: d.count,
        detail: "",
      })),
      ...employers.employers.map((d) => ({
        chart: "Top employers",
        label: d.employer,
        value: d.count,
        detail: "",
      })),
      ...locations.locations.map((d) => ({
        chart: "Geographic distribution",
        label: d.location,
        value: d.count,
        detail: "",
      })),
      ...certGrowth.certGrowth.map((d) => ({
        chart: "Certification growth over time",
        label: d.month,
        value: d.count,
        detail: "",
      })),
      ...courses.courses.map((d) => ({
        chart: "Post-graduation course completions",
        label: d.course,
        value: d.count,
        detail: "",
      })),
      ...completion.completion.map((d) => ({
        chart: "Profile completion by cohort",
        label: d.graduationYear,
        value: d.averageCompletion,
        detail: `${d.alumniCount} alumni`,
      })),
    ];

    const csv = toCsv(
      [
        { key: "chart", header: "Chart" },
        { key: "label", header: "Label" },
        { key: "value", header: "Value" },
        { key: "detail", header: "Detail" },
      ],
      rows,
    );

    res.set("Content-Type", "text/csv");
    res.set("Content-Disposition", 'attachment; filename="chart-data.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
