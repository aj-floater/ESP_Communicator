// Define default colors (you can adjust or extend these)
const defaultBorderColors = [
  'rgba(97, 175, 239, 1)',
  'rgba(152, 195, 121, 1)',
  'rgba(224, 108, 117, 1)',
  'rgba(229, 192, 123, 1)'
];
const defaultBackgroundColors = [
  'rgba(97, 175, 239, 0.2)',
  'rgba(152, 195, 121, 0.2)',
  'rgba(97, 175, 239, 0.2)',
  'rgba(152, 195, 121, 0.2)'
];

// Helper function to create the datasets array based on the values object.
function createDatasets(valueStruct) {
  return valueStruct.map((item, index) => ({
    label: item.name,
    borderColor: defaultBorderColors[index % defaultBorderColors.length],
    backgroundColor: defaultBackgroundColors[index % defaultBackgroundColors.length],
    pointRadius: 0,
    pointHoverRadius: 3,
    data: [] // Data points will be added dynamically.
  }));
}

// Function that creates a Chart instance based solely on an element id and values array.
function createChartFromId(chartElementId, values) {
  const canvas = document.getElementById(chartElementId);
  if (!canvas) {
    console.error('Canvas element with id', chartElementId, 'not found.');
    return;
  }
  const ctx = canvas.getContext('2d');
  const datasets = createDatasets(values);

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'realtime',
          realtime: {
            duration: 20000, // Display last 20 seconds of data.
            refresh: 50,     // Refresh every 50ms.
            delay: 500,      // Delay of 500ms to allow for incoming data.
            onRefresh: function(chart) {
              const timestamp = Date.now();
              values.forEach((item, index) => {
                if (chart.data.datasets[index]) {
                  chart.data.datasets[index].data.push({
                    x: timestamp,
                    y: item.value
                  });
                }
              });
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

  return chart;
}

// Assuming rightValues is defined and holds your desired values.
window.leftChart = createChartFromId('leftChart', leftValues);
window.rightChart = createChartFromId('rightChart', rightValues);