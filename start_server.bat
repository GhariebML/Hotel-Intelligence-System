@echo off
title Hotel Booking Dashboard Server
echo ==================================================
echo Starting your Premium Hotel Booking Dashboard...
echo ==================================================
echo.
echo Please open your web browser and go to:
echo http://localhost:8000
echo.
echo (Do not close this window while viewing the dashboard)
echo.
python -m http.server 8000
pause
