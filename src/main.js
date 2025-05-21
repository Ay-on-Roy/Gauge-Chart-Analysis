import Chart from 'chart.js/auto';

let gaugeChart;
fetch('/Assignment Data 2025.xlsx - Task 1 (b).csv')
  .then(response => response.text())
  .then(csv => {
    const rows = csv.trim().split('\n').slice(1);
    const data = rows.map(row => {
      const [month, sales] = row.split(',');
      return { month, sales: parseInt(sales) };
    });
    setupSidebar(data);
    renderGaugeChart(null);
  })
  .catch(err => console.error('Error loading CSV:', err));

function setupSidebar(data) {
  const list = document.getElementById('monthList');
  list.innerHTML = "";
  data.forEach(({ month }) => {
    const li = document.createElement('li');
    li.textContent = month;
    li.dataset.month = month;
    li.addEventListener('click', () => {
      document.querySelectorAll('li').forEach(el => el.classList.remove('selected'));
      li.classList.add('selected');
      const selected = data.find(d => d.month === month);
      renderGaugeChart(selected.sales);
    });
    list.appendChild(li);
  });
}

function renderGaugeChart(value) {
  const ctx = document.getElementById('gaugeChart').getContext('2d');
  const statusBox = document.getElementById('statusText');

  if (gaugeChart) gaugeChart.destroy();

  let category = '';
  let color = 'gray';

  if (value === null) {
    statusBox.textContent = 'Select a month to view the status';
  } else {
    category = value <= 3000000 ? 'Low' : value < 7000000 ? 'Medium' : 'High';
    color = category === 'Low' ? 'red' : category === 'Medium' ? 'orange' : 'blue';
    statusBox.textContent = category;
    statusBox.style.color = color;
  }

  gaugeChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Low', 'Medium', 'High'],
      datasets: [{
        data: [3000000, 4000000, 3000000],
        backgroundColor: ['red', 'orange', 'blue'],
        borderWidth: 0,
        cutout: '80%',
        circumference: 180,
        rotation: 270
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: context => `Category: ${context.label}`
          }
        }
      }
    },
    plugins: [drawNeedle(value), drawValueText(value), drawLevelMarker()]
  });
}

function drawNeedle(value) {
  return {
    id: 'drawNeedle',
    afterDraw(chart) {
      const { width, height } = chart;
      const ctx = chart.ctx;
      const centerX = width / 2;
      const centerY = height / 1.5;
      const needleLength = height / 3;

      let angleDeg = 180;
      if (value !== null) {
        const clampedValue = Math.min(Math.max(value, 0), 10000000);
        const percent = clampedValue / 10000000;
        angleDeg = 180 + percent * 180;
      }
      const angleRad = (angleDeg * Math.PI) / 180;
      const endX = centerX + needleLength * Math.cos(angleRad);
      const endY = centerY + needleLength * Math.sin(angleRad);

      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'black';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      ctx.restore();
    }
  };
}

function drawValueText(value) {
  return {
    id: 'drawValueText',
    afterDraw(chart) {
      if (value === null) return;
      const { width, height } = chart;
      const ctx = chart.ctx;
      const text = formatValue(value);
      ctx.save();
      ctx.font = 'bold 36px Arial';
      ctx.fillStyle = 'black';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, width / 2, height / 1.8);
      ctx.restore();
    }
  };
}

function drawLevelMarker() {
  return {
    id: 'drawLevelMarker',
    afterDraw(chart) {
      const { width, height } = chart;
      const ctx = chart.ctx;

      ctx.save();
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("Low", width / 6, height / 1.2);
      ctx.fillText("Medium", width / 2, height / 6);
      ctx.fillText("High", width / 1.2, height / 1.2);
      ctx.restore();
    }
  };
}
function formatValue(value) {
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + "m";
  if (value >= 1_000) return (value / 1_000).toFixed(1) + "k";
  return value.toString();
}
