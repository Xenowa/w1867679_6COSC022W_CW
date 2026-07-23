"use strict";

const BASE_URL = process.env.CW1_API_URL;
const API_KEY = process.env.DASHBOARD_API_KEY;

class ApiClientError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

async function request(path, params = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  }

  let response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
  } catch (err) {
    throw new ApiClientError("Could not reach the student platform API.", 502);
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body && body.error) ||
      `Student platform API error (${response.status}).`;
    throw new ApiClientError(message, response.status);
  }

  return body;
}

module.exports = {
  ApiClientError,
  getAlumni: (filters) => request("/alumni", filters),
  getAlumnusById: (id) => request(`/alumni/${encodeURIComponent(id)}`),
  getSkillsGap: (filters) => request("/analytics/skills-gap", filters),
  getEmploymentSectors: (filters) =>
    request("/analytics/employment-sectors", filters),
  getJobTitles: (filters) => request("/analytics/job-titles", filters),
  getEmployers: (filters) => request("/analytics/employers", filters),
  getLocations: (filters) => request("/analytics/locations", filters),
  getCertGrowth: (filters) => request("/analytics/cert-growth", filters),
  getCourses: (filters) => request("/analytics/courses", filters),
  getCompletion: (filters) => request("/analytics/completion", filters),
};
