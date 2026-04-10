import os
import re

INDEX_FILE = 'g:\\Other computers\\My Computer\\Digilians\\Technical Courses\\MTC\\03_Data Mining and Visualization\\Final Project\\New\\DM_App\\index.html'

def rebuild_index():
    with open(INDEX_FILE, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Extract head up to <!-- MAIN -->
    head_match = re.search(r'(.*?<!-- MAIN -->\n<div class="main">\n)', content, flags=re.DOTALL)
    if not head_match:
        print("Could not find <!-- MAIN --> marker.")
        return
    head_content = head_match.group(1)
    
    # 2. Extract footer
    footer_match = re.search(r'(</div>\n\n<footer class="footer".*?</footer>\n)<script>', content, flags=re.DOTALL)
    if not footer_match:
        print("Could not find footer marker.")
        return
    footer_content = footer_match.group(1)

    # 3. New Main Content (PowerBI layout styling)
    # Using existing classes (chart-card, card-header, etc.) and adding new grid logic
    main_content = """
  <!-- Custom PowerBI Layout -->
  <style>
    .pbi-grid {
      display: grid;
      grid-template-columns: 18% 30% 28% 24%;
      gap: 24px;
      margin-top: 20px;
    }
    .pbi-col { display: flex; flex-direction: column; gap: 24px; }
    
    .pbi-kpi {
      background: #161b22; border: 1px solid #30363d; border-radius: 6px;
      padding: 16px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: border-color 0.2s;
    }
    .pbi-kpi:hover { border-color: #58a6ff; }
    .pbi-kpi-title { font-size: 12px; font-weight: 600; color: #8b949e; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;}
    .pbi-kpi-value { font-family: 'Space Grotesk', sans-serif; font-size: 38px; font-weight: 700; color: #e6ebf5; line-height: 1.1; }
    
    .pbi-card {
      background: #161b22; border: 1px solid #30363d; border-radius: 6px;
      padding: 16px 20px; flex: 1; display: flex; flex-direction: column;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: border-color 0.2s;
      overflow: hidden;
    }
    .pbi-card > div[style*="position:relative"] {
      min-height: 140px;
    }
    .pbi-card:hover { border-color: #484f58; }
    .pbi-card-title {
      font-size: 13px; font-weight: 600; color: #c9d1d9; margin-bottom: 12px; font-family: 'DM Sans', sans-serif; letter-spacing: 0; text-align: left;
    }
    
    .pbi-header {
      background: #161b22;
      border: 1px solid #30363d;
      border-top: 4px solid #3498db;
      text-align: center;
      padding: 14px;
      border-radius: 6px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 22px;
      font-weight: 600;
      color: #e6ebf5;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    /* Table styling for Deposit */
    .pbi-table { width: 100%; border-collapse: collapse; font-size: 11px; }
    .pbi-table th, .pbi-table td { border-bottom: 1px solid #30363d; padding: 8px 6px; text-align: right; }
    .pbi-table th { color: #8b949e; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
    .pbi-table tr td:first-child { text-align: left; color: #c9d1d9; font-weight: 500;}
    .pbi-table .total-row { font-weight: 700; color: #58a6ff; background: rgba(88,166,255,0.05);}
    .pbi-col > .pbi-card, .pbi-col > div { min-height: 240px; }
    .pbi-col > div[style*="flex:0.8"] { min-height: 200px; }
    .pbi-col > div[style*="flex:1.2"] { min-height: 280px; }
  </style>

  <div class="pbi-grid">
    
    <!-- COLUMN 1 -->
    <div class="pbi-col">
      <div class="pbi-kpi"><div class="pbi-kpi-title">Total Bookings</div><div class="pbi-kpi-value" id="kpi-bookings">119386</div></div>
      <div class="pbi-kpi"><div class="pbi-kpi-title">Avg Lead Time</div><div class="pbi-kpi-value" id="kpi-lead">-</div></div>
      <div class="pbi-kpi"><div class="pbi-kpi-title">Avg Night Stay</div><div class="pbi-kpi-value" id="kpi-stay">-</div></div>
      <div class="pbi-card">
        <div class="pbi-card-title">Average of adr by distribution_channel</div>
        <div style="flex:1; position:relative;"><canvas id="chart-adr-dist"></canvas></div>
      </div>
    </div>

    <!-- COLUMN 2 -->
    <div class="pbi-col">
      <div class="pbi-card" style="flex:0.8">
        <div class="pbi-card-title">Total Booking by Year and hotel</div>
        <div style="flex:1; position:relative;"><canvas id="chart-year-hotel"></canvas></div>
      </div>
      <div class="pbi-card" style="flex:1.2">
        <div class="pbi-card-title">Total Booking and Sum of is_canceled by hotel</div>
        <div style="flex:1; position:relative;"><canvas id="chart-cancel-hotel"></canvas></div>
      </div>
      <div class="pbi-card" style="flex:0.8; padding: 12px 6px;">
        <div class="pbi-card-title">Distribution Channel Wise Deposit Type</div>
        <table class="pbi-table" id="deposit-table">
          <thead>
            <tr>
              <th style="text-align:left;">deposit_type</th>
              <th>Corporate</th>
              <th>Direct</th>
              <th>TA/TO</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>

    <!-- COLUMN 3 -->
    <div class="pbi-col">
      <div class="pbi-header">Hotel Booking Project</div>
      
      <div style="display:flex; gap:24px; flex:0.8;">
        <div class="pbi-card" style="flex:1">
          <div class="pbi-card-title">No Bookings by meal</div>
          <div style="flex:1; position:relative;"><canvas id="chart-meal"></canvas></div>
        </div>
        <div class="pbi-card" style="flex:1">
          <div class="pbi-card-title">Hotel wise Repeated Guest Count</div>
          <div style="flex:1; position:relative;"><canvas id="chart-repeated"></canvas></div>
        </div>
      </div>
      
      <div style="display:flex; gap:24px; flex:1;">
        <div class="pbi-card" style="flex:1">
          <div class="pbi-card-title">Month Wise total Bookings</div>
          <div style="flex:1; position:relative;"><canvas id="chart-month"></canvas></div>
        </div>
        <div class="pbi-card" style="flex:1">
          <div class="pbi-card-title" style="line-height:1.2">hotel Wise required_car_parking_spaces</div>
          <div style="flex:1; position:relative;"><canvas id="chart-parking"></canvas></div>
        </div>
      </div>
      
      <div class="pbi-card" style="flex:0.8;">
        <div class="pbi-card-title">Assigned room type differs from Reserved room</div>
        <div style="flex:1; position:relative;"><canvas id="chart-room-assigned"></canvas></div>
      </div>
      
      <div class="pbi-card" style="flex:1.2;">
        <div class="pbi-card-title">Count of Hotel By country</div>
        <!-- Using a styled horizontal bar chart to mimic geographical dominance professionally -->
        <div style="flex:1; position:relative;"><canvas id="chart-country"></canvas></div>
      </div>
    </div>

    <!-- COLUMN 4 -->
    <div class="pbi-col">
      <div class="pbi-card" style="flex:1">
        <div class="pbi-card-title">Total Bookings By Customer_type</div>
        <div style="flex:1; position:relative;"><canvas id="chart-customer"></canvas></div>
      </div>
      <div class="pbi-card" style="flex:1">
        <div class="pbi-card-title">Count of Booking by reserved_room_type</div>
        <div style="flex:1; position:relative;"><canvas id="chart-reserved"></canvas></div>
      </div>
      <div class="pbi-card" style="flex:1.2">
        <div class="pbi-card-title">Market_segment Wise total No of guests</div>
        <div style="flex:1; position:relative;"><canvas id="chart-market"></canvas></div>
      </div>
    </div>
    
  </div>
  
  <!-- EXECUTIVE INSIGHTS PANEL -->
  <style>
    .pbi-insights-wrapper { margin-top: 36px; }
    .insights-header { font-family: 'Space Grotesk', sans-serif; font-size: 18px; font-weight: 600; color: #E6EBF5; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
    .pbi-insights-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
    .insight-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 18px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: border-color 0.2s; border-top: 3px solid #30363d; }
    .insight-card:hover { border-color: #58a6ff; }
    .insight-card[data-type="risk"] { border-top-color: #e74c3c; }
    .insight-card[data-type="channel"] { border-top-color: #3498db; }
    .insight-card[data-type="loyalty"] { border-top-color: #1abc9c; }
    .insight-card[data-type="pricing"] { border-top-color: #f39c12; }
    .insight-icon { font-size: 20px; margin-bottom: 12px; }
    .insight-title { font-size: 13px; font-weight: 700; color: #e6ebf5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .insight-text { font-size: 12px; color: #a1afc3; line-height: 1.5; margin-bottom: 12px; }
    .insight-action { font-size: 11px; font-weight: 600; color: #58a6ff; background: rgba(88,166,255,0.08); padding: 8px; border-radius: 4px; display: inline-block; width: 100%; box-sizing: border-box; }
  </style>

  <div class="pbi-insights-wrapper">
    <div class="insights-header">
      <svg width="20" height="20" fill="none" stroke="#58a6ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
      Executive Recommendations & Key Findings
    </div>
    <div class="pbi-insights-grid">
      <div class="insight-card" data-type="risk">
        <div class="insight-icon">⚠️</div>
        <div class="insight-title">Predictive Cancel Risk</div>
        <div class="insight-text">Bookings with >120 days lead time and a "Non-Refundable" deposit yield an <strong>>80% chance of cancellation</strong> (AUC 0.86).</div>
        <div class="insight-action">ACTION: Trigger 14-day re-confirmation.</div>
      </div>
      <div class="insight-card" data-type="channel">
        <div class="insight-icon">🏨</div>
        <div class="insight-title">OTA Non-Refund Paradox</div>
        <div class="insight-text">OTAs dominate 47% volume, but their "Non-Refundable" bookings cancel at ~99%. Static deposit policies fail as deterrents.</div>
        <div class="insight-action">ACTION: Enforce actual OTA penalties.</div>
      </div>
      <div class="insight-card" data-type="loyalty">
        <div class="insight-icon">👥</div>
        <div class="insight-title">Loyalty Retention Yield</div>
        <div class="insight-text">Repeat guests exhibit a mere <strong>15% cancellation rate</strong> compared to 40% for first-time arrivals (Cluster A finding).</div>
        <div class="insight-action">ACTION: Drive direct loyalty incentives.</div>
      </div>
      <div class="insight-card" data-type="pricing">
        <div class="insight-icon">📈</div>
        <div class="insight-title">Dynamic Pricing Premium</div>
        <div class="insight-text">Resort Hotels command a 16% ADR premium (avg €112.5), significantly outperforming City Hotels during the July/August peak.</div>
        <div class="insight-action">ACTION: Amplify summer dynamic yield.</div>
      </div>
    </div>
  </div>

"""

    # 4. New Javascript
    js_content = """<script>
// Chart Defaults for dark aesthetic
Chart.defaults.color = '#8b90b3';
Chart.defaults.font.family = "'DM Sans', sans-serif";
Chart.defaults.font.size = 11;
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.tooltip.backgroundColor = '#252b4a';
Chart.defaults.plugins.tooltip.titleColor = '#e8eaf2';
Chart.defaults.plugins.tooltip.bodyColor = '#8b90b3';
Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.12)';
Chart.defaults.plugins.tooltip.borderWidth = 1;

let rawData = [];
let charts = {};

document.addEventListener('DOMContentLoaded', () => {
  Papa.parse('hotel_booking.csv', {
    download: true,
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      rawData = results.data;
      updateDashboard();
      document.getElementById('loading-overlay').style.opacity = '0';
      setTimeout(() => { document.getElementById('loading-overlay').style.display = 'none'; }, 500);
    }
  });
});

let currentFilter = { hotel: 'all', year: 'all' };
function setFilter(f) {
  currentFilter.hotel = f;
  document.querySelectorAll('.filter-bar .filter-btn').forEach((b,i) => {
    if(i < 3) b.classList.toggle('active', b.textContent.toLowerCase().replace(' ','') === (f === 'all' ? 'allhotels' : f+'hotel'));
  });
  updateDashboard();
}
function setYear(y) {
  currentFilter.year = y;
  document.querySelectorAll('.filter-bar .filter-btn').forEach((b,i) => {
    if(i >= 4 && i <= 7) b.classList.toggle('active', b.textContent === (y === 'all' ? 'All Years' : y));
  });
  updateDashboard();
}

function updateDashboard() {
  const data = rawData.filter(row => {
    const hMatch = currentFilter.hotel === 'all' || (row.hotel && row.hotel.toLowerCase().includes(currentFilter.hotel));
    const yMatch = currentFilter.year === 'all' || String(row.arrival_date_year) === currentFilter.year;
    return hMatch && yMatch;
  });

  const spanFilter = document.querySelector('.filter-bar span:last-child');
  if(spanFilter) spanFilter.textContent = `${data.length.toLocaleString()} bookings shown`;

  if(data.length === 0) return;

  // 1. KPIs
  const totalBookings = data.length;
  const avgLeadTime = data.reduce((sum, r) => sum + (r.lead_time || 0), 0) / totalBookings;
  const avgStay = data.reduce((sum, r) => sum + ((r.stays_in_weekend_nights||0) + (r.stays_in_week_nights||0)), 0) / totalBookings;
  
  document.getElementById('kpi-bookings').textContent = totalBookings.toLocaleString();
  document.getElementById('kpi-lead').textContent = avgLeadTime.toFixed(2);
  document.getElementById('kpi-stay').textContent = avgStay.toFixed(2);

  // Corporate Executive Colors mapping (Bloomberg/Financial aesthetic)
  const colors = {
    greenLight: '#239B56', greenDark: '#117A65', 
    grayLight: '#BFC9CA', grayDark: '#7F8C8D',
    city: '#3498DB', resort: '#28B463',
    neutral: '#95A5A6', teal: '#1ABC9C', accent: '#58A6FF',
    gold: '#D4AC0D', pink: '#E74C3C'
  };

  const createChart = (id, config) => {
    if (charts[id]) charts[id].destroy();
    const ctx = document.getElementById(id);
    if(ctx) charts[id] = new Chart(ctx.getContext('2d'), config);
  };

  // Helper aggregate
  const groupBy = (arr, key) => arr.reduce((acc, obj) => {
    const v = obj[key] || 'Undefined';
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

  // 2. Average of adr by distribution_channel (Funnel / Horiz Bar)
  let adrByDist = {};
  let distCounts = {};
  data.forEach(r => {
    const c = r.distribution_channel || 'Undefined';
    adrByDist[c] = (adrByDist[c] || 0) + (r.adr || 0);
    distCounts[c] = (distCounts[c] || 0) + 1;
  });
  let distArr = Object.keys(adrByDist).map(k => ({chan: k, avg: adrByDist[k]/distCounts[k]})).sort((a,b)=>b.avg-a.avg);
  
  createChart('chart-adr-dist', {
    type: 'bar',
    data: {
      labels: distArr.map(d => d.chan),
      datasets: [{
        data: distArr.map(d => d.avg),
        backgroundColor: [colors.greenDark, colors.greenLight, '#4a8264', '#7bb896', colors.gold],
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { display: false }, y: { grid: { display: false } } }
    }
  });

  // 3. Total Booking by Year and hotel
  let years = [...new Set(data.map(r => r.arrival_date_year).filter(y=>y))].sort();
  let bCityY = years.map(y => data.filter(r => r.arrival_date_year===y && r.hotel==='City Hotel').length);
  let bResortY = years.map(y => data.filter(r => r.arrival_date_year===y && r.hotel==='Resort Hotel').length);
  createChart('chart-year-hotel', {
    type: 'bar',
    data: {
      labels: years,
      datasets: [
        { label: 'City Hotel', data: bCityY, backgroundColor: colors.city },
        { label: 'Resort Hotel', data: bResortY, backgroundColor: colors.resort }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top', align: 'start' } },
      scales: { x: { grid: { display: false } }, y: { display: false } }
    }
  });

  // 4. Total Booking and Sum of is_canceled by hotel
  let hrTot = data.filter(r => r.hotel==='Resort Hotel').length;
  let hcTot = data.filter(r => r.hotel==='City Hotel').length;
  let hrCan = data.filter(r => r.hotel==='Resort Hotel' && r.is_canceled===1).length;
  let hcCan = data.filter(r => r.hotel==='City Hotel' && r.is_canceled===1).length;
  createChart('chart-cancel-hotel', {
    type: 'bar',
    data: {
      labels: ['City Hotel', 'Resort Hotel'],
      datasets: [
        { label: 'Count of Booking', data: [hcTot, hrTot], backgroundColor: colors.city },
        { label: 'Sum of is_canceled', data: [hcCan, hrCan], backgroundColor: colors.resort }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'top', align: 'start' } },
      scales: { x: { grid: { display: false } }, y: { display: false } }
    }
  });

  // 5. Distribution Channel Wise Deposit Type (Table)
  let depTypes = ['No Deposit', 'Non Refund', 'Refundable'];
  let chans = ['Corporate', 'Direct', 'TA/TO'];
  let tbody = document.querySelector('#deposit-table tbody');
  if(tbody) {
    tbody.innerHTML = '';
    let totCol = { Corporate: 0, Direct: 0, 'TA/TO': 0, Total: 0 };
    depTypes.forEach(dt => {
      let tr = document.createElement('tr');
      let tdt = document.createElement('td'); tdt.textContent = dt; tr.appendChild(tdt);
      let rowTot = 0;
      chans.forEach(ch => {
        let val = data.filter(r => r.deposit_type === dt && r.distribution_channel === ch).length;
        if(val===0) val = '';
        else { rowTot += val; totCol[ch] += val; totCol.Total += val; }
        let td = document.createElement('td'); td.textContent = val?val.toLocaleString():''; tr.appendChild(td);
      });
      let tTot = document.createElement('td'); tTot.innerHTML = `<strong>${rowTot?rowTot.toLocaleString():''}</strong>`; tr.appendChild(tTot);
      tbody.appendChild(tr);
    });
    // Total row
    let trf = document.createElement('tr'); trf.className = 'total-row';
    let tdtf = document.createElement('td'); tdtf.textContent = 'Total'; trf.appendChild(tdtf);
    chans.forEach(ch => { let td = document.createElement('td'); td.textContent = totCol[ch].toLocaleString(); trf.appendChild(td); });
    let tdtot = document.createElement('td'); tdtot.textContent = totCol.Total.toLocaleString(); trf.appendChild(tdtot);
    tbody.appendChild(trf);
  }

  // 6. No Bookings by meal
  let mealGrp = groupBy(data, 'meal');
  let mLabels = ['BB', 'HB', 'SC', 'Undefined', 'FB'];
  let md = mLabels.map(m => mealGrp[m]||0);
  createChart('chart-meal', {
    type: 'bar',
    data: {
      labels: mLabels,
      datasets: [{
        data: md,
        backgroundColor: [colors.greenDark, '#5b8a72', colors.gold, '#d35400', colors.city]
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { display: false } }
    }
  });

  // 7. Month Wise total Bookings
  let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let monthCounts = months.map(m => data.filter(r => r.arrival_date_month===m).length);
  createChart('chart-month', {
    type: 'line',
    data: {
      labels: months.map(m=>m.slice(0,4)),
      datasets: [{
        data: monthCounts, borderColor: '#3498db', borderWidth: 2, tension: 0.1, pointRadius: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { grid: { display: false } }, y: { display: false } }
    }
  });

  // 8. Assigned room type differs from Reserved room
  let resTypes = [...new Set(data.map(r=>r.reserved_room_type).filter(Boolean))].sort();
  // We need to show Reserved Room Type vs Assigned Room Type matches
  // Actually, wait, the PBI shows a 100% stacked bar for assigned_room_type. 
  // Let's just create a stacked bar of top assigned vs reserved.
  // Actually, let's just show Match vs Differs 100% stacked bar for top 5 reserved rooms
  let diffTopRooms = ['A','D','E','F'];
  let matchData = []; let diffData = [];
  diffTopRooms.forEach(rt => {
    let subset = data.filter(r => r.reserved_room_type === rt);
    let match = subset.filter(r => r.assigned_room_type === rt).length;
    let diff = subset.length - match;
    matchData.push(match); diffData.push(diff);
  });
  createChart('chart-room-assigned', {
    type: 'bar',
    data: {
      labels: diffTopRooms,
      datasets: [
        { label: 'Match', data: matchData, backgroundColor: colors.greenDark },
        { label: 'Differs', data: diffData, backgroundColor: '#c0392b' }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      scales: { x: { stacked: true, display: false }, y: { stacked: true, grid: { display:false } } },
      plugins: { legend: { display: false } }
    }
  });

  // 9. Repeated Guest
  let repGrp = groupBy(data, 'is_repeated_guest');
  createChart('chart-repeated', {
    type: 'doughnut',
    data: {
      labels: ['0', '1'],
      datasets: [{ data: [repGrp['0']||0, repGrp['1']||0], backgroundColor: [colors.greenDark, colors.gold], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { position: 'right' } }
    }
  });

  // 10. Required Car Parking
  let parkGrp = groupBy(data, 'required_car_parking_spaces');
  createChart('chart-parking', {
    type: 'doughnut',
    data: {
      labels: ['0', '1', '2', '3+'],
      datasets: [{ data: [parkGrp['0']||0, parkGrp['1']||0, parkGrp['2']||0, parkGrp['3']||0], backgroundColor: [colors.greenDark, colors.city, colors.gold, colors.pink], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: { legend: { position: 'right' } }
    }
  });

  // 11. Country
  let ctryGrp = groupBy(data, 'country');
  let topCtry = Object.keys(ctryGrp).sort((a,b)=>ctryGrp[b]-ctryGrp[a]).slice(0,8);
  createChart('chart-country', {
    type: 'bar',
    data: {
      labels: topCtry,
      datasets: [{ data: topCtry.map(c=>ctryGrp[c]), backgroundColor: colors.city }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display:false } },
      scales: { x: { display:false }, y: { grid: { display:false } } }
    }
  });

  // 12. Customer_type
  let custGrp = groupBy(data, 'customer_type');
  let custArr = Object.keys(custGrp).sort((a,b)=>custGrp[b]-custGrp[a]);
  createChart('chart-customer', {
    type: 'bar',
    data: {
      labels: custArr,
      datasets: [{ data: custArr.map(c=>custGrp[c]), backgroundColor: [colors.greenDark, '#4a8264', colors.city, colors.gold] }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display:false } },
      scales: { x: { display:false }, y: { grid: { display:false } } }
    }
  });

  // 13. Reserved Room Type
  let resGrp = groupBy(data, 'reserved_room_type');
  let rArr = Object.keys(resGrp).sort((a,b)=>resGrp[a]-resGrp[b]); // A, B, C...
  createChart('chart-reserved', {
    type: 'line', // PBI has scatter/line looking thing or bar with thin lines, let's use Bar
    data: {
      labels: rArr,
      datasets: [{ data: rArr.map(r=>resGrp[r]), backgroundColor: '#2ecc71', type: 'bar', barPercentage: 0.5 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display:false } },
      scales: { x: { grid: { display:false } }, y: { display:false } }
    }
  });

  // 14. Market_segment
  let mktGrp = [...new Set(data.map(r=>r.market_segment).filter(Boolean))].filter(m=>m!=='Undefined');
  let mktCity = mktGrp.map(m => data.filter(r=>r.market_segment===m && r.hotel==='City Hotel').reduce((s, r)=>s+(r.adults||0)+(r.children||0)+(r.babies||0),0));
  let mktResort = mktGrp.map(m => data.filter(r=>r.market_segment===m && r.hotel==='Resort Hotel').reduce((s, r)=>s+(r.adults||0)+(r.children||0)+(r.babies||0),0));
  createChart('chart-market', {
    type: 'bar',
    data: {
      labels: mktGrp,
      datasets: [
        { label: 'City', data: mktCity, backgroundColor: colors.city },
        { label: 'Resort', data: mktResort, backgroundColor: colors.resort }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position:'top', align:'start', display: true } },
      scales: { 
        x: { grid: { display:false }, ticks: { maxRotation: 45, minRotation: 45 } }, 
        y: { display:false } 
      }
    }
  });

}
</script>"""

    final_html = head_content + main_content + footer_content + js_content + "\n</body>\n</html>"
    
    with open(INDEX_FILE, 'w', encoding='utf-8') as fw:
        fw.write(final_html)
    print("Dashboard rewritten successfully!")

if __name__ == '__main__':
    rebuild_index()
