#!/bin/bash

# Database backup script for P2P Gear Rental Platform
# This script creates automated daily backups of the PostgreSQL database

set -e

# Configuration
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-gearshare}"
DB_USER="${POSTGRES_USER:-postgres}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
BACKUP_FILENAME="backup_${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILENAME"

echo "Starting database backup: $BACKUP_FILENAME"
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo "Backup path: $BACKUP_PATH"

# Create database backup
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --verbose \
    --file="$BACKUP_PATH"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILENAME"
    
    # Compress the backup
    gzip "$BACKUP_PATH"
    echo "Backup compressed: ${BACKUP_FILENAME}.gz"
    
    # Create a latest backup symlink
    ln -sf "${BACKUP_FILENAME}.gz" "$BACKUP_DIR/latest.sql.gz"
    echo "Latest backup symlink updated"
    
    # Log backup info
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup created: ${BACKUP_FILENAME}.gz" >> "$BACKUP_DIR/backup.log"
else
    echo "Backup failed!" >&2
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Backup failed: $BACKUP_FILENAME" >> "$BACKUP_DIR/backup.log"
    exit 1
fi

# Clean up old backups (keep only the last N days)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# Log cleanup
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f | wc -l)
echo "Cleanup completed. Remaining backups: $REMAINING_BACKUPS"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Cleanup completed. Remaining backups: $REMAINING_BACKUPS" >> "$BACKUP_DIR/backup.log"

# Verify backup integrity (basic check)
if [ -f "${BACKUP_PATH}.gz" ]; then
    BACKUP_SIZE=$(stat -f%z "${BACKUP_PATH}.gz" 2>/dev/null || stat -c%s "${BACKUP_PATH}.gz" 2>/dev/null || echo "0")
    if [ "$BACKUP_SIZE" -gt 1000 ]; then
        echo "Backup verification: OK (Size: $BACKUP_SIZE bytes)"
    else
        echo "Backup verification: FAILED (Size too small: $BACKUP_SIZE bytes)" >&2
        exit 1
    fi
fi

echo "Backup process completed successfully"