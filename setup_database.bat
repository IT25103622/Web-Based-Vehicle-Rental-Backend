@echo off
echo =========================================================================
echo  SLIIT Vehicle Rental System (UC-02) - Database Setup
echo  Student: Maduwearachchi T.G.O.N (IT25101871)
echo  Database: vehicle_rental_db
echo =========================================================================
echo.
set /p MYSQL_PWD="Enter your MySQL root password (press Enter if no password): "

echo.
echo Executing schema.sql to initialize database and sample data...
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p%MYSQL_PWD% < "%~dp0database\schema.sql"

if %ERRORLEVEL% equ 0 (
    echo.
    echo =========================================================================
    echo  SUCCESS! Database 'vehicle_rental_db' updated with UC-02 tables.
    echo  Vehicles and integrated bookings are now ready in MySQL!
    echo =========================================================================
) else (
    echo.
    echo [ERROR] Failed to execute schema.sql.
    echo Please verify your password or open database\schema.sql in MySQL Workbench
    echo and click the lightning bolt icon to run it.
)
pause
