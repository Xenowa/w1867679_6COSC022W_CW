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

if (chartData.jobTitles.length) {
  new Chart(document.getElementById("jobTitlesChart"), {
    type: "bar",
    data: {
      labels: chartData.jobTitles.map(function (d) {
        return d.jobTitle;
      }),
      datasets: [
        {
          label: "Alumni",
          data: chartData.jobTitles.map(function (d) {
            return d.count;
          }),
          backgroundColor: "#107aff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Job title" } },
        y: {
          title: { display: true, text: "Alumni" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

if (chartData.employers.length) {
  new Chart(document.getElementById("employersChart"), {
    type: "bar",
    data: {
      labels: chartData.employers.map(function (d) {
        return d.employer;
      }),
      datasets: [
        {
          label: "Alumni",
          data: chartData.employers.map(function (d) {
            return d.count;
          }),
          backgroundColor: "#4a90d9",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Employer" } },
        y: {
          title: { display: true, text: "Alumni" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

if (chartData.locations.length) {
  new Chart(document.getElementById("locationsChart"), {
    type: "bar",
    data: {
      labels: chartData.locations.map(function (d) {
        return d.location;
      }),
      datasets: [
        {
          label: "Alumni",
          data: chartData.locations.map(function (d) {
            return d.count;
          }),
          backgroundColor: "#5aa876",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Location" } },
        y: {
          title: { display: true, text: "Alumni" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

if (chartData.certGrowth.length) {
  new Chart(document.getElementById("certGrowthChart"), {
    type: "line",
    data: {
      labels: chartData.certGrowth.map(function (d) {
        return d.month;
      }),
      datasets: [
        {
          label: "Certifications completed",
          data: chartData.certGrowth.map(function (d) {
            return d.count;
          }),
          borderColor: "#107aff",
          backgroundColor: "#107aff",
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { title: { display: true, text: "Month" } },
        y: {
          title: { display: true, text: "Certifications" },
          ticks: { precision: 0 },
        },
      },
    },
  });
}

if (chartData.courses.length) {
  new Chart(document.getElementById("coursesChart"), {
    type: "pie",
    data: {
      labels: chartData.courses.map(function (d) {
        return d.course;
      }),
      datasets: [
        {
          data: chartData.courses.map(function (d) {
            return d.count;
          }),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, position: "right" } },
    },
  });
}

if (chartData.completion.length) {
  new Chart(document.getElementById("completionChart"), {
    type: "bar",
    data: {
      labels: chartData.completion.map(function (d) {
        return d.graduationYear;
      }),
      datasets: [
        {
          label: "Completed",
          data: chartData.completion.map(function (d) {
            return d.averageCompletion;
          }),
          backgroundColor: "#107aff",
        },
        {
          label: "Remaining",
          data: chartData.completion.map(function (d) {
            return 100 - d.averageCompletion;
          }),
          backgroundColor: "#e2e2e2",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "right" },
        tooltip: {
          callbacks: {
            afterBody: function (items) {
              var d = chartData.completion[items[0].dataIndex];
              return d.alumniCount + " alumni in this cohort";
            },
          },
        },
      },
      scales: {
        x: { title: { display: true, text: "Graduation year" }, stacked: true },
        y: {
          title: { display: true, text: "Completion %" },
          stacked: true,
          min: 0,
          max: 100,
        },
      },
    },
  });
}
