import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale
);

// Colors for charts
const chartColors = [
    'rgba(255, 99, 132, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 159, 64, 0.7)',
    'rgba(210, 99, 132, 0.7)',
];

const GraphDisplay = ({ content }) => {
    // Function to parse markdown tables
    const parseMarkdownTable = (md) => {
        if (!md) {
            console.log('[GraphDisplay] No content provided');
            return null;
        }

        const lines = md.split('\n');
        let tableStart = -1;
        let tableEnd = -1;

        // Simple detection of table: looks for | ... | ... | structure
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
                if (tableStart === -1) tableStart = i;
                tableEnd = i;
            } else if (tableStart !== -1) {
                // Table broken
                break;
            }
        }

        if (tableStart === -1) {
            console.log('[GraphDisplay] No table found in content');
            return null;
        }

        const tableLines = lines.slice(tableStart, tableEnd + 1);
        console.log('[GraphDisplay] Found table with', tableLines.length, 'lines');

        // At least header and divider
        if (tableLines.length < 3) {
            console.log('[GraphDisplay] Table too short');
            return null;
        }

        // Find the divider line (contains --- or :--: or --:)
        let dividerIndex = -1;
        for (let i = 0; i < Math.min(3, tableLines.length); i++) {
            if (tableLines[i].includes('---') || tableLines[i].includes(':--')) {
                dividerIndex = i;
                break;
            }
        }

        if (dividerIndex === -1) {
            console.log('[GraphDisplay] No divider found');
            return null;
        }

        // Extract headers (all lines before divider)
        const headerLines = tableLines.slice(0, dividerIndex);
        const headers = headerLines[headerLines.length - 1]
            .split('|')
            .filter(c => c.trim())
            .map(c => c.trim());

        console.log('[GraphDisplay] Headers:', headers);

        // Extract data (all lines after divider)
        const data = [];
        for (let i = dividerIndex + 1; i < tableLines.length; i++) {
            const row = tableLines[i].split('|').filter(c => c.trim()).map(c => c.trim());
            if (row.length === headers.length) {
                data.push(row);
            }
        }

        console.log('[GraphDisplay] Parsed', data.length, 'data rows');
        return { headers, data };
    };

    // Check if a value is a range (e.g., "0-10", "10-20")
    const isRange = (value) => {
        return /^\d+\s*-\s*\d+$/.test(value);
    };

    const tableData = useMemo(() => parseMarkdownTable(content), [content]);

    if (!tableData || tableData.data.length === 0) {
        console.log('[GraphDisplay] No valid table data to display');
        return null;
    }

    console.log('[GraphDisplay] Rendering graphs for table data');

    // Process data for charts
    const labels = tableData.data.map(row => row[0]);
    const datasets = [];

    // Check if first column contains ranges
    const hasRangeLabels = labels.some(label => isRange(label));

    // Check which columns are numeric
    for (let i = 1; i < tableData.headers.length; i++) {
        const isNumeric = tableData.data.every(row => !isNaN(parseFloat(row[i].replace(/,/g, ''))));
        if (isNumeric) {
            datasets.push({
                label: tableData.headers[i],
                data: tableData.data.map(row => parseFloat(row[i].replace(/,/g, ''))),
                columnIndex: i
            });
        }
    }

    if (datasets.length === 0) return null;

    console.log('[GraphDisplay] Data type:', hasRangeLabels ? 'Range-based' : 'Continuous');

    // Generate chart data configs
    const charts = [];

    if (hasRangeLabels) {
        // RANGE-BASED DATA: Show Histogram and Scatter

        // 1. Histogram (using bar chart for range distribution)
        charts.push({
            type: 'bar',
            title: 'Distribution (Histogram)',
            data: {
                labels,
                datasets: datasets.map((ds, i) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: chartColors[i % chartColors.length],
                    borderColor: chartColors[i % chartColors.length].replace('0.7', '1'),
                    borderWidth: 1
                }))
            }
        });

        // 2. Scatter Plot (if we have at least 2 numeric columns)
        if (datasets.length >= 2) {
            const scatterData = tableData.data.map((row, idx) => ({
                x: datasets[0].data[idx],
                y: datasets[1].data[idx]
            }));

            charts.push({
                type: 'scatter',
                title: `Correlation: ${datasets[0].label} vs ${datasets[1].label}`,
                data: {
                    datasets: [{
                        label: 'Data Points',
                        data: scatterData,
                        backgroundColor: chartColors[0],
                        borderColor: chartColors[0].replace('0.7', '1'),
                        pointRadius: 6,
                        pointHoverRadius: 8
                    }]
                }
            });
        }

    } else {
        // CONTINUOUS DATA: Show Bar, Line, Pie, Doughnut

        // 1. Bar Chart (Comparison)
        charts.push({
            type: 'bar',
            title: 'Comparison (Bar)',
            data: {
                labels,
                datasets: datasets.map((ds, i) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: chartColors[i % chartColors.length],
                    borderColor: chartColors[i % chartColors.length].replace('0.7', '1'),
                    borderWidth: 1
                }))
            }
        });

        // 2. Line Chart (Trend)
        charts.push({
            type: 'line',
            title: 'Trend (Line)',
            data: {
                labels,
                datasets: datasets.map((ds, i) => ({
                    label: ds.label,
                    data: ds.data,
                    backgroundColor: chartColors[i % chartColors.length],
                    borderColor: chartColors[i % chartColors.length].replace('0.7', '1'),
                    borderWidth: 2,
                    tension: 0.1
                }))
            }
        });

        // 3. Pie Chart (Distribution of first column)
        if (datasets.length > 0) {
            charts.push({
                type: 'pie',
                title: `Distribution - ${datasets[0].label}`,
                data: {
                    labels,
                    datasets: [{
                        data: datasets[0].data,
                        backgroundColor: chartColors,
                        borderWidth: 1
                    }]
                }
            });
        }

        // 4. Doughnut Chart (Proportion of first column)
        if (datasets.length > 0) {
            charts.push({
                type: 'doughnut',
                title: `Proportion - ${datasets[0].label}`,
                data: {
                    labels,
                    datasets: [{
                        data: datasets[0].data,
                        backgroundColor: chartColors,
                        borderWidth: 1
                    }]
                }
            });
        }
    }

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#B0B5C2' // var(--text-secondary)
                }
            },
            title: {
                display: false,
            }
        },
        scales: {
            y: {
                ticks: { color: '#B0B5C2' },
                grid: { color: '#34394F' }
            },
            x: {
                ticks: { color: '#B0B5C2' },
                grid: { color: '#34394F' }
            }
        }
    };

    const scatterOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'top',
                labels: { color: '#B0B5C2' }
            }
        },
        scales: {
            y: {
                ticks: { color: '#B0B5C2' },
                grid: { color: '#34394F' }
            },
            x: {
                ticks: { color: '#B0B5C2' },
                grid: { color: '#34394F' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'right',
                labels: { color: '#B0B5C2' }
            }
        }
    };

    return (
        <div className="graphs-container">
            {charts.slice(0, 4).map((chart, index) => (
                <div key={index} className="graph-card">
                    <h4>{chart.title}</h4>
                    <div className="chart-wrapper">
                        {chart.type === 'bar' && <Bar data={chart.data} options={options} />}
                        {chart.type === 'line' && <Line data={chart.data} options={options} />}
                        {chart.type === 'scatter' && <Scatter data={chart.data} options={scatterOptions} />}
                        {chart.type === 'pie' && <Pie data={chart.data} options={pieOptions} />}
                        {chart.type === 'doughnut' && <Doughnut data={chart.data} options={pieOptions} />}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default GraphDisplay;
