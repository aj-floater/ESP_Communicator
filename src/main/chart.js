const ctx = document.getElementById('potChart').getContext('2d');

// Define default colors (you can adjust or extend these)
const defaultBorderColors = [
  'rgba(97, 175, 239, 1)',
  'rgba(152, 195, 121, 1)',
  '#e06c75',
  '#e5c07b'
];
const defaultBackgroundColors = [
  'rgba(97, 175, 239, 0.2)',
  'rgba(152, 195, 121, 0.2)',
  'rgba(97, 175, 239, 0.2)',
  'rgba(152, 195, 121, 0.2)'
];

function createDatasets(valueStruct) {
  // Build the datasets array based on the passed valueStruct.
  const datasets = valueStruct.map((item, index) => ({
    label: item.name,
    borderColor: defaultBorderColors[index % defaultBorderColors.length],
    backgroundColor: defaultBackgroundColors[index % defaultBackgroundColors.length],
    pointRadius: 0,
    pointHoverRadius: 3,
    data: [] // starts empty, data points will be added dynamically
  }));

  return datasets;
}

window.potChart = new Chart(ctx, {
  type: 'line',
  data: {
    datasets: createDatasets(rightValues)
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'realtime',
        realtime: {
          duration: 20000, // display last 20 seconds of data
          refresh: 50,     // refresh every 50ms
          delay: 500,      // delay of 500ms to allow for incoming data
          onRefresh: function(chart) {
            // Called automatically by the realtime plugin.
            // For each dataset, push a new data point based on the latest value in valueStruct.
            const timestamp = Date.now();
            rightValues.forEach((item, index) => {
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