"use strict";

const swaggerJsdoc = require("swagger-jsdoc");
const path = require("node:path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Alumni Influencers Platform API",
      version: "1.0.0",
      description:
        "Public API for retrieving the currently featured Alumni of the Day.",
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          description: "API key issued from /keys, sent as a Bearer token.",
        },
        SessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "sid",
          description:
            "Session cookie used by the browser-based web interface.",
        },
      },
      schemas: {
        Credential: {
          type: "object",
          properties: {
            title: { type: "string", example: "BSc (Hons) Computer Science" },
            institution: {
              type: "string",
              example: "University of Westminster",
            },
            url: {
              type: "string",
              nullable: true,
              example: "https://example.com/credential",
            },
            completedAt: { type: "string", format: "date-time" },
          },
        },
        EmploymentRecord: {
          type: "object",
          properties: {
            company: { type: "string", example: "Google" },
            role: { type: "string", example: "Software Engineer" },
            industrySector: {
              type: "string",
              nullable: true,
              example: "Software Engineering",
            },
            location: { type: "string", nullable: true, example: "London, UK" },
            startedAt: { type: "string", format: "date-time" },
            endedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        AlumniOfTheDay: {
          type: "object",
          properties: {
            fullName: { type: "string", example: "Alice Kaur" },
            bio: {
              type: "string",
              nullable: true,
              example: "Senior engineer, mentoring students.",
            },
            linkedinUrl: {
              type: "string",
              nullable: true,
              example: "https://linkedin.com/in/alicekaur",
            },
            profileImage: {
              type: "string",
              nullable: true,
              example: "/uploads/7-1234567890.png",
            },
            degrees: {
              type: "array",
              items: { $ref: "#/components/schemas/Credential" },
            },
            certifications: {
              type: "array",
              items: { $ref: "#/components/schemas/Credential" },
            },
            licences: {
              type: "array",
              items: { $ref: "#/components/schemas/Credential" },
            },
            courses: {
              type: "array",
              items: { $ref: "#/components/schemas/Credential" },
            },
            employment: {
              type: "array",
              items: { $ref: "#/components/schemas/EmploymentRecord" },
            },
          },
        },
        ApiError: {
          type: "object",
          properties: {
            error: { type: "string", example: "Invalid or revoked API key." },
          },
        },
      },
    },
  },
  apis: [path.join(__dirname, "..", "routes", "*.js")],
};

module.exports = swaggerJsdoc(options);
