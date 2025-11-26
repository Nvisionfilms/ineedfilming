# Run Complete Supabase Schema on Railway PostgreSQL
# This script will execute the schema SQL file

$DATABASE_URL = "postgresql://postgres:gOImOKZMCdyDXdGEyJgrwOnyNdg6jDKm@shortline.proxy.rlwy.net:43172/railway"
$SQL_FILE = "COMPLETE_SUPABASE_SCHEMA.sql"

Write-Host "🚀 Connecting to Railway PostgreSQL..." -ForegroundColor Cyan
Write-Host "📋 Running schema from: $SQL_FILE" -ForegroundColor Yellow

# Check if psql is available
$psqlExists = Get-Command psql -ErrorAction SilentlyContinue

if ($psqlExists) {
    Write-Host "✅ psql found! Executing SQL..." -ForegroundColor Green
    
    # Run the SQL file
    psql $DATABASE_URL -f $SQL_FILE
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Schema created successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Error creating schema. Exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} else {
    Write-Host "❌ psql not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "  Option 1: Install PostgreSQL from https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  Option 2: Use Railway CLI: railway connect Postgres" -ForegroundColor White
    Write-Host "  Option 3: Copy SQL manually in Railway Dashboard" -ForegroundColor White
}
