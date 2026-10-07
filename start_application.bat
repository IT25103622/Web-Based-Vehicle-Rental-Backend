@echo off
title SLIIT Vehicle Rental System - UC-02
echo =========================================================================
echo  SLIIT Web-Based Vehicle Rental System (UC-02)
echo  Student: Maduwearachchi T.G.O.N (IT25101871)
echo =========================================================================
echo.
echo Starting Spring Boot Application on port 8081...
echo (Make sure MySQL is running and database 'vehicle_rental_db' is created)
echo (Friend_Project runs on port 8080 without port conflict)
echo.

"C:\Program Files\Java\jdk-24\bin\java.exe" -jar "%~dp0target\vehicle-rental-uc02-1.0.0.jar"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [NOTE] If the application stopped, please check:
    echo 1. Did you run database\schema.sql in MySQL Workbench?
    echo 2. Is your MySQL password in src\main\resources\application.yml correct?
    echo.
    pause
)
