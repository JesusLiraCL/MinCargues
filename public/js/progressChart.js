// public/js/progressChart.js
document.addEventListener('DOMContentLoaded', function () {
    // Espera a que EasyPieChart esté cargado
    if (typeof EasyPieChart !== 'undefined') {
        initCharts();
    } else {
        // Si no está cargado, espera un poco y reintenta
        setTimeout(initCharts, 100);
    }
});

function initCharts() {
    var chartElements = document.querySelectorAll('.chart');

    chartElements.forEach(function (chartElement) {
        new EasyPieChart(chartElement, {
            barColor: '#f48634',
            trackColor: '#2c3e50',
            scaleColor: false,
            lineCap: 'round',
            lineWidth: 25,
            trackWidth: 15,
            size: 120,
            animate: {
                duration: 1000,
                enabled: true
            },
            onStep: function (from, to, value) {
                this.el.querySelector('.percent').textContent = Math.round(value) + '%';
            }
        });
    });
}