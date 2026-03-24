# Database Backup Script
# Run this before any migration to ensure data safety

# Configuration
$POSTGRES_USER = $env:POSTGRES_USER ?? "postgres"
$POSTGRES_DB = $env:POSTGRES_DB ?? "logitrack"
$BACKUP_DIR = ".\backups"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BACKUP_FILE = "$BACKUP_DIR\logitrack_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "✅ Created backup directory: $BACKUP_DIR" -ForegroundColor Green
}

Write-Host "📦 Starting database backup..." -ForegroundColor Cyan
Write-Host "Database: $POSTGRES_DB" -ForegroundColor Gray
Write-Host "Output: $BACKUP_FILE" -ForegroundColor Gray

# Create backup using pg_dump
try {
    # Try to use pg_dump from PATH
    $pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
    
    if ($pgDumpPath) {
        pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F p -f $BACKUP_FILE
        
        if ($LASTEXITCODE -eq 0) {
            $fileSize = (Get-Item $BACKUP_FILE).Length / 1MB
            Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
            Write-Host "   File: $BACKUP_FILE" -ForegroundColor Green
            Write-Host "   Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
            
            # Keep only last 5 backups
            $backups = Get-ChildItem $BACKUP_DIR -Filter "*.sql" | Sort-Object LastWriteTime -Descending
            if ($backups.Count -gt 5) {
                $backups | Select-Object -Skip 5 | ForEach-Object {
                    Remove-Item $_.FullName
                    Write-Host "🗑️  Removed old backup: $($_.Name)" -ForegroundColor Yellow
                }
            }
        } else {
            Write-Host "❌ Backup failed with exit code: $LASTEXITCODE" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "⚠️  pg_dump not found in PATH" -ForegroundColor Yellow
        Write-Host "Please install PostgreSQL client tools or manually backup your database" -ForegroundColor Yellow
        Write-Host "" -ForegroundColor Yellow
        Write-Host "Alternative: Use Docker exec if running in container:" -ForegroundColor Cyan
        Write-Host "docker exec -t logitrack-postgres pg_dump -U postgres logitrack > $BACKUP_FILE" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error during backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "💡 To restore this backup:" -ForegroundColor Cyan
Write-Host "   psql -U $POSTGRES_USER -d $POSTGRES_DB -f $BACKUP_FILE" -ForegroundColor Gray
