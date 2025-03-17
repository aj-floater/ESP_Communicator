const ctx = document.getElementById('potChart').getContext('2d');

window.potChart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: [
      {
        label: 'Left Wheel Speed',
        borderColor: 'rgba(97, 175, 239, 1)',
        backgroundColor: 'rgba(97, 175, 239, 0.2)',
        pointRadius: 0,         // Default dot size
        pointHoverRadius: 3,    // Dot size when hovered
        data: []
      },
      {
        label: 'Left Wheel Desired Speed',
        borderColor: 'rgba(152, 195, 121, 1)',
        backgroundColor: 'rgba(152, 195, 121, 0.2)',
        pointRadius: 0,
        pointHoverRadius: 3,
        data: []
      },
      {
        label: 'Right Wheel Speed',
        borderColor: '#e06c75',
        backgroundColor: 'rgba(97, 175, 239, 0.2)',
        pointRadius: 0,         // Default dot size
        pointHoverRadius: 3,    // Dot size when hovered
        data: []
      },
      {
        label: 'Right Wheel Desired Speed',
        borderColor: '#e5c07b',
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
          duration: 20000, // Display 20 seconds of data
          refresh: 50,   // Refresh chart
          delay: 500,     // Delay of 2 seconds (to allow data to arrive)
          onRefresh: function(chart) {
            if (Array.isArray(floatArrayMain) && floatArrayMain.length >= 4) {
              const timestamp = Date.now();
          
              if (floatArrayMain[0] !== null) {
                chart.data.datasets[0].data.push({
                  x: timestamp,
                  y: floatArrayMain[0] // Left Wheel Speed
                });
              }
          
              if (floatArrayMain[1] !== null) {
                chart.data.datasets[1].data.push({
                  x: timestamp,
                  y: floatArrayMain[1] // Left Wheel Desired Speed
                });
              }
          
              if (floatArrayMain[2] !== null) {
                chart.data.datasets[2].data.push({
                  x: timestamp,
                  y: floatArrayMain[2] // Right Wheel Speed
                });
              }
          
              if (floatArrayMain[3] !== null) {
                chart.data.datasets[3].data.push({
                  x: timestamp,
                  y: floatArrayMain[3] // Right Wheel Desired Speed
                });
              }
            }
          }          
        }
      },
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  }
});