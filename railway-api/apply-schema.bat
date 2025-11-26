@echo off
cd /d "%~dp0"
echo Applying database schema to Railway...
echo.

railway run --service Postgres node setup-db.js

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Error occurred! Press any key to exit...
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Done! Schema applied successfully.
echo.
pause
