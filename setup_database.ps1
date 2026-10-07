Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " SLIIT Vehicle Rental System (UC-02) - Database Setup" -ForegroundColor Cyan
Write-Host " Student: Maduwearachchi T.G.O.N (IT25101871)" -ForegroundColor Cyan
Write-Host " Database: vehicle_rental_db" -ForegroundColor Cyan
Write-Host "=========================================================================" -ForegroundColor Cyan

$password = Read-Host "Enter your MySQL root password (press Enter if none)"

$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
if (-not (Test-Path $mysqlPath)) {
    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) { $mysqlPath = $mysqlCmd.Source }
}

$schemaPath = Join-Path $PSScriptRoot "database\schema.sql"

if ($password) {
    & $mysqlPath -u root "-p$password" -e "source $schemaPath"
} else {
    & $mysqlPath -u root -e "source $schemaPath"
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Database 'vehicle_rental_db' successfully updated with UC-02 tables!" -ForegroundColor Green
    Write-Host "Vehicles and integrated bookings schema ready in MySQL." -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Failed to run schema.sql. Please check your password or open schema.sql in MySQL Workbench." -ForegroundColor Red
}
