<div align="center">

# 🏨 Hotel Booking Intelligence Dashboard
**A Real-Time, Predictive Analytics Platform for Hospitality Management**

<img src="banner.png" width="100%" alt="Hotel Intelligence Dashboard Header">

[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://hotel-booking-dashboard-flax.vercel.app/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 🚀 Overview

This repository transforms a massive raw dataset of **119,390 hotel booking records** into a highly professional, interactive, and predictive analytics platform. Developed as the capstone for the *Data Mining & Visualization* course at MTC under the Digilians program, this dashboard serves as a production-grade business intelligence tool.

By bridging complex **Machine Learning** predictions (Cancellation Risk & Seasonality) with a high-performance **Glassmorphism UI**, this system allows hotel managers to monitor KPIs, predict cancellations, and strategize pricing dynamically in real time.

---

## 🔥 Key Features

| Category | Feature Description | Technology |
| :--- | :--- | :--- |
| **🏎️ Performance** | Custom **Dynamic Data Engine** parsing 119k rows of CSV data strictly on the client-side with zero latency. | `PapaParse` / `Vanilla JS` |
| **📈 Visual Analytics** | High-fidelity mixed-mode Line/Bar trends, seasonal heatmaps, and interactive segmented doughnut charts. | `Chart.js` |
| **🎨 Premium UI** | Sleek, dark-themed responsive interface featuring CSS Glassmorphism and active background animations. | `HTML5` / `CSS3` |
| **🤖 Machine Learning** | Integrated insights extracted from external **Random Forest** classifiers and **K-Means clustering** pipelines. | `Python` / `Scikit-learn` |
| **🗄️ Architecture** | Rigorously designed database schema backing the analytical metrics (Conceptual & Logical ERDs). | `Orange DB` |

---

## 🏗️ Architecture & Stack

### 💻 Frontend Client
The application is deliberately built without heavy frameworks to maximize raw parsing speed on large datasets:
- **Core:** HTML5, CSS3, ES6+ Javascript
- **Data Parsing:** PapaParse
- **Visualization:** Chart.js
- **Typography:** Google Web Fonts

### 🧪 Data Science Pipeline (Backend Logic)
- **Data Cleaning & EDA:** Python (Pandas, NumPy)
- **Modeling:** Random Forest (Cancellation Prediction), K-Means
- **Visualization Tooling:** Matplotlib, Seaborn, Power BI

---

## ⚙️ Local Installation & Development

To run the intelligence dashboard locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/GhariebML/Hotel-Booking-Dashboard.git
   cd Hotel-Booking-Dashboard
   ```

2. **Serve the Application:**
   Because of aggressive browser CORS policies regarding local CSV file parsing, you must serve the directory via a local web server (do not just double-click `index.html`).
   
   Using Python:
   ```bash
   python -m http.server 8000
   ```
   *Alternatively, use the VS Code "Live Server" extension.*

3. **Access the Dashboard:**
   Open your browser and navigate to `http://localhost:8000`

---

## 🤝 Team & Credits

This platform was developed and deployed by the **Snipers Team** as a graduation capstone.
- **Lead Developer & Data Scientist:** [Mohamed Gharieb](https://github.com/GhariebML)
- **Supervision:** Dr. Mohamed El Shafey
- **Institution:** Digilians / MTC

---

<div align="center">
  <sub>Built with 🧠 and ☕ by Mohamed Gharieb - 2026</sub>
</div>
