"use strict";

// Most recently completed degree per alumnus becomes their programme/graduationYear.
const PRIMARY_DEGREE_SUBQUERY = `
  (SELECT userId, title AS programme, YEAR(completedAt) AS graduationYear
   FROM (
     SELECT userId, title, completedAt,
            ROW_NUMBER() OVER (PARTITION BY userId ORDER BY completedAt DESC) AS rn
     FROM degrees
   ) ranked
   WHERE rn = 1) AS pathway
`;

// Current job (endedAt IS NULL) takes priority, else the most recently started job.
const PRIMARY_EMPLOYMENT_SUBQUERY = `
  (SELECT userId, company, role, industrySector, location
   FROM (
     SELECT userId, company, role, industrySector, location,
            ROW_NUMBER() OVER (
              PARTITION BY userId
              ORDER BY (endedAt IS NULL) DESC, startedAt DESC
            ) AS rn
     FROM employment_history
   ) ranked
   WHERE rn = 1) AS currentJob
`;

module.exports = { PRIMARY_DEGREE_SUBQUERY, PRIMARY_EMPLOYMENT_SUBQUERY };
