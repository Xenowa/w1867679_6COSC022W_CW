"use strict";

document.getElementById("chartFilters").addEventListener("submit", function () {
  var btn = this.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = "Loading...";
});

var SEVERITY_COLORS = {
  critical: "#d64545",
  significant: "#e2a33d",
  emerging: "#4a90d9",
};

if (chartData.skillsGap.length) {
  // Loaded from the cdn script
  new Chart(document.getElementById("skillsGapChart"), {
    type: "bar",
    data: {
      labels: chartData.skillsGap.map(function (d) {
        return d.skill;
      }),
      datasets: [
        {
          label: "Completions",
          data: chartData.skillsGap.map(function (d) {
            return d.count;
          }),
          backgroundColor: chartData.skillsGap.map(function (d) {
            return SEVERITY_COLORS[d.severity];
          }),
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: function (ctx) {
              return "Severity: " + chartData.skillsGap[ctx.dataIndex].severity;
            },
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "Completions" } },
        y: { title: { display: true, text: "Skill" } },
      },
    },
  });
}

if (chartData.employmentSectors.length) {
  new Chart(document.getElementById("employmentSectorsChart"), {
    type: "doughnut",
    data: {
      labels: chartData.employmentSectors.map(function (d) {
        return d.sector;
      }),
      datasets: [
        {
          data: chartData.employmentSectors.map(function (d) {
            return d.count;
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "right" },
      },
    },
  });
}
