document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById('potChart').getContext('2d');

  window.potChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Left Potentiometer',
          borderColor: 'rgba(97, 175, 239, 1)',
          backgroundColor: 'rgba(97, 175, 239, 0.2)',
          pointRadius: 0,
          pointHoverRadius: 3,
          data: []
        },
        {
          label: 'Right Potentiometer',
          borderColor: 'rgba(152, 195, 121, 1)',
          backgroundColor: 'rgba(152, 195, 121, 0.2)',
          pointRadius: 0,
          pointHoverRadius: 3,
          data: []
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'realtime',
          realtime: {
            duration: 20000,
            refresh: 50,
            delay: 500,
            onRefresh: function(chart) {
              if (window.latestLeft !== null && window.latestRight !== null) {
                chart.data.datasets[0].data.push({ x: Date.now(), y: window.latestLeft });
                chart.data.datasets[1].data.push({ x: Date.now(), y: window.latestRight });
              }
            }
          }
        },
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: true } }
    }
  });
});