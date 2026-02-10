#!/bin/bash
# Database Backup Script (Unix/Linux/Mac)
# Run this before any migration to ensure data safety

# Configuration
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-logitrack}"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/logitrack_backup_$TIMESTAMP.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
if [ ! -d "$BACKUP_DIR" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${GREEN}✅ Created backup directory: $BACKUP_DIR${NC}"
fi

echo -e "${CYAN}📦 Starting database backup...${NC}"
echo -e "${GRAY}Database: $POSTGRES_DB${NC}"
echo -e "${GRAY}Output: $BACKUP_FILE${NC}"

# Create backup using pg_dump
if command -v pg_dump &> /dev/null; then
    pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F p -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Backup completed successfully!${NC}"
        echo -e "${GREEN}   File: $BACKUP_FILE${NC}"
        echo -e "${GREEN}   Size: $FILE_SIZE${NC}"
        
        # Keep only last 5 backups
        ls -t "$BACKUP_DIR"/*.sql | tail -n +6 | xargs -r rm
        if [ $? -eq 0 ]; then
            echo -e "${YELLOW}🗑️  Cleaned up old backups${NC}"
        fi
    else
        echo -e "${RED}❌ Backup failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  pg_dump not found in PATH${NC}"
    echo -e "${YELLOW}Please install PostgreSQL client tools or manually backup your database${NC}"
    echo ""
    echo -e "${CYAN}Alternative: Use Docker exec if running in container:${NC}"
    echo -e "${GRAY}docker exec -t logitrack-postgres pg_dump -U postgres logitrack > $BACKUP_FILE${NC}"
fi

echo ""
echo -e "${CYAN}💡 To restore this backup:${NC}"
echo -e "${GRAY}   psql -U $POSTGRES_USER -d $POSTGRES_DB -f $BACKUP_FILE${NC}"
