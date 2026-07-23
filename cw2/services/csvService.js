"use strict";

function escapeField(value) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// columns: [{ key, header }]; rows: array of plain objects
function toCsv(columns, rows) {
  const headerLine = columns.map((c) => escapeField(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeField(row[c.key])).join(","),
  );
  return [headerLine, ...lines].join("\r\n") + "\r\n";
}

module.exports = { toCsv };
