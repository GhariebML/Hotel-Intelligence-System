// Configuration for Chart.js Defaults
Chart.defaults.color = '#8892b0';
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(10, 25, 47, 0.9)';
Chart.defaults.plugins.tooltip.titleColor = '#64ffda';
Chart.defaults.plugins.tooltip.bodyColor = '#e6f1ff';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(100, 255, 218, 0.3)';
Chart.defaults.plugins.tooltip.borderWidth = 1;
Chart.defaults.plugins.tooltip.padding = 12;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.displayColors = true;
Chart.defaults.plugins.tooltip.boxPadding = 6;
// Smooth interactions
Chart.defaults.interaction.mode = 'index';
Chart.defaults.interaction.intersect = false;

// Initialize Dashboard Data
const initDashboard = () => {
    Papa.parse('hotel_booking.csv', {
        download: true,
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
            const data = results.data;
            if (data && data.length > 0) {
                processAndRenderData(data);
            } else {
                showError("No data found in hotel_booking.csv");
            }
        },
        error: function(err) {
            console.error("Error loading CSV:", err);
            showError("Failed to load hotel_booking.csv. Note: You must run this via a local server (e.g., python -m http.server) to load local files, or CORS will block it.");
            renderMockData(); // Fallback for pure frontend viewing
        }
    });
};

// UI Error handler
const showError = (msg) => {
    console.warn(msg);
    document.getElementById('kpi-total').innerText = "Error";
    document.getElementById('kpi-cancel').innerText = "Error";
    document.getElementById('kpi-adr').innerText = "Error";
    document.getElementById('kpi-city').innerText = "Error";
};

// Data Processing & Rendering
const processAndRenderData = (data) => {
    let totalBookings = data.length;
    let cancellations = 0;
    let totalAdr = 0;
    let validAdrCount = 0;
    
    let distribution = { city: 0, resort: 0 };
    let channels = { 'TA/TO': 0, 'Direct': 0, 'Corporate': 0 }; // predefined main channels
    let marketSegs = {};
    
    // Monthly Booking vs ADR Tracking
    let monthlyData = {
        'January': {sum:0, count:0, volume:0}, 'February': {sum:0, count:0, volume:0}, 'March': {sum:0, count:0, volume:0},
        'April': {sum:0, count:0, volume:0}, 'May': {sum:0, count:0, volume:0}, 'June': {sum:0, count:0, volume:0},
        'July': {sum:0, count:0, volume:0}, 'August': {sum:0, count:0, volume:0}, 'September': {sum:0, count:0, volume:0},
        'October': {sum:0, count:0, volume:0}, 'November': {sum:0, count:0, volume:0}, 'December': {sum:0, count:0, volume:0}
    };

    data.forEach(row => {
        // KPIs
        if (row.is_canceled === 1 || String(row.is_canceled).toLowerCase() === 'true') {
            cancellations++;
        }
        
        // Monthly Metrics
        let month = row.arrival_date_month;
        if (monthlyData[month] !== undefined) {
            monthlyData[month].volume++;
            
            if (row.adr !== null && !isNaN(row.adr) && row.adr > 0 && row.adr < 5000) {
                totalAdr += row.adr;
                validAdrCount++;
                monthlyData[month].sum += row.adr;
                monthlyData[month].count++;
            }
        }
        
        // Distribution
        if (row.hotel) {
            let h = String(row.hotel).toLowerCase();
            if (h.includes('city')) distribution.city++;
            else if (h.includes('resort')) distribution.resort++;
        }

        // Channels (group small ones into Other to keep Doughnut chart clean)
        let channel = row.distribution_channel;
        if (channel && channel !== 'Undefined') {
            if (['TA/TO', 'Direct', 'Corporate'].includes(channel)) {
                channels[channel]++;
            } else {
                channels['Other'] = (channels['Other'] || 0) + 1;
            }
        }

        // Market Segments
        let market = row.market_segment;
        if (market && market !== 'Undefined') {
            marketSegs[market] = (marketSegs[market] || 0) + 1;
        }
    });

    // Compute KPIs
    const cancelRate = ((cancellations / totalBookings) * 100).toFixed(1);
    const avgAdr = validAdrCount > 0 ? (totalAdr / validAdrCount).toFixed(2) : 0;
    const cityShare = distribution.city > 0 ? ((distribution.city / totalBookings) * 100).toFixed(0) : 0;

    // Update the DOM KPIs
    animateValue("kpi-total", 0, totalBookings, 1500, "");
    animateValue("kpi-cancel", 0, cancelRate, 1500, "%");
    animateValue("kpi-adr", 0, avgAdr, 1500, "$");
    document.getElementById('kpi-city').innerText = `${cityShare}% City / ${100 - cityShare}% Resort`;

    // Process Chart Data Arrays
    const channelLabels = Object.keys(channels);
    const channelCounts = channelLabels.map(k => channels[k]);

    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const adrArray = months.map(m => monthlyData[m].count > 0 ? (monthlyData[m].sum / monthlyData[m].count).toFixed(2) : 0);
    const volArray = months.map(m => monthlyData[m].volume);

    // Keep top 6 Market Segments and group rest into Other
    let mktSortedKeys = Object.keys(marketSegs).sort((a,b) => marketSegs[b] - marketSegs[a]);
    let topMktKeys = mktSortedKeys.slice(0, 5);
    let topMktData = topMktKeys.map(k => marketSegs[k]);
    let otherMktSum = mktSortedKeys.slice(5).reduce((acc, k) => acc + marketSegs[k], 0);
    if(otherMktSum > 0) { topMktKeys.push('Other'); topMktData.push(otherMktSum); }

    // Render Charts
    renderCharts(channelLabels, channelCounts, months, adrArray, volArray, topMktKeys, topMktData);
};

// Fallback Mock Data if CSV Loading Fails via CORS restriction
const renderMockData = () => {
    animateValue("kpi-total", 0, 119390, 1500, "");
    animateValue("kpi-cancel", 0, 37.0, 1500, "%");
    animateValue("kpi-adr", 0, 101.83, 1500, "$");
    document.getElementById('kpi-city').innerText = `66% City / 34% Resort`;

    renderCharts(
        ['TA/TO', 'Direct', 'Corporate', 'Other'], [97870, 14645, 6677, 198],
        ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        [70.36, 73.58, 80.13, 100.38, 108.67, 116.67, 126.79, 140.11, 105.05, 87.91, 73.80, 81.07], // ADR
        [5929, 8068, 9794, 11089, 11791, 10939, 12661, 13877, 10508, 11160, 6794, 6780], // Volume
        ['Online TA', 'Offline TA/TO', 'Groups', 'Direct', 'Corporate', 'Other'], 
        [56477, 24219, 19811, 12606, 5295, 982]
    );
};

// Advanced Chart.js Rendering
const renderCharts = (cLabels, cData, months, adrData, volData, mLabels, mData) => {
    // Shared styling arrays & gradients can be created via canvas context dynamically
    Chart.register({
        id: 'glow',
        beforeDraw: (chart) => {
            const ctx = chart.ctx;
            ctx.save();
            ctx.shadowColor = 'rgba(100, 255, 218, 0.4)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 4;
            ctx.restore();
        }
    });

    const colorPalette = ['#64ffda', '#ffd700', '#00e5ff', '#ff6b6b', '#a8a8ff', '#8892b0'];
    
    // 1. Distribution Channels (Doughnut Chart with Custom Hover and Cutout)
    const ctxCancel = document.getElementById('cancellationChart').getContext('2d');
    new Chart(ctxCancel, {
        type: 'doughnut',
        data: {
            labels: cLabels,
            datasets: [{
                label: 'Bookings Volume',
                data: cData,
                backgroundColor: colorPalette.slice(0, cLabels.length),
                borderColor: 'rgba(5, 11, 20, 1)',
                borderWidth: 4,
                hoverOffset: 12 // Makes slice pop out!
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', // Sleek thin rings
            plugins: {
                legend: { position: 'right', labels: { usePointStyle: true, padding: 20 } },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.parsed;
                            let total = context.dataset.data.reduce((a,b)=>a+b,0);
                            return ` ${context.label}: ${val.toLocaleString()} (${((val/total)*100).toFixed(1)}%)`;
                        }
                    }
                }
            }
        }
    });

    // 2. ADR Trends & Volume (Mixed Advanced Chart - Bar + Line on Dual Y-Axis)
    const ctxAdr = document.getElementById('adrChart').getContext('2d');
    
    // Create gradient for the Line fill
    let adrGradient = ctxAdr.createLinearGradient(0, 0, 0, 400);
    adrGradient.addColorStop(0, 'rgba(255, 215, 0, 0.2)');
    adrGradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');

    new Chart(ctxAdr, {
        type: 'line', // base type
        data: {
            labels: months,
            datasets: [
                {
                    type: 'line',
                    label: 'Avg Daily Rate ($)',
                    data: adrData,
                    yAxisID: 'yAdr',
                    borderColor: '#ffd700',
                    backgroundColor: adrGradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ffd700',
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    fill: true,
                    tension: 0.4,
                    order: 1
                },
                {
                    type: 'bar',
                    label: 'Booking Volume',
                    data: volData,
                    yAxisID: 'yVol',
                    backgroundColor: 'rgba(100, 255, 218, 0.15)',
                    hoverBackgroundColor: 'rgba(100, 255, 218, 0.4)',
                    borderColor: '#64ffda',
                    borderWidth: 1,
                    borderRadius: 6,
                    order: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', align: 'end', labels: { usePointStyle: true } },
                tooltip: { mode: 'index', intersect: false }
            },
            scales: {
                x: { grid: { display: false } },
                yAdr: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: { display: true, text: 'ADR ($)', color: '#ffd700' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                yVol: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: { display: true, text: 'Volume', color: '#64ffda' },
                    grid: { drawOnChartArea: false } // Prevent overlaying grid lines
                }
            }
        }
    });

    // 3. Market Segment (Horizontal Bar with Data Formatting)
    const ctxMarket = document.getElementById('marketChart').getContext('2d');
    new Chart(ctxMarket, {
        type: 'bar',
        data: {
            labels: mLabels,
            datasets: [{
                label: 'Market Segment Breakdown',
                data: mData,
                backgroundColor: colorPalette,
                borderWidth: 0,
                borderRadius: 4,
                barPercentage: 0.7
            }]
        },
        options: {
            indexAxis: 'y', // Horizontal
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) { return ` Count: ${context.parsed.x.toLocaleString()}`; }
                    }
                }
            },
            scales: {
                x: { 
                    beginAtZero: true, 
                    grid: { color: 'rgba(255, 255, 255, 0.1)' },
                    ticks: { callback: function(value) { return value.toLocaleString(); } }
                },
                y: { grid: { display: false } }
            }
        }
    });
};

// Fancy Number Animation
function animateValue(id, start, end, duration, suffix) {
    if (start === end) return;
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4); // easeOutQuart
        let currentVal = progress * (end - start) + start;
        
        if (end > 1000) obj.innerHTML = Math.floor(currentVal).toLocaleString() + suffix;
        else obj.innerHTML = currentVal.toFixed(1) + suffix;

        if (progress < 1) window.requestAnimationFrame(step);
        else {
            if (end > 1000) obj.innerHTML = Math.floor(end).toLocaleString() + suffix;
            else obj.innerHTML = Number(end).toFixed(1) + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

document.addEventListener('DOMContentLoaded', initDashboard);
