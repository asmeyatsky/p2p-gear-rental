#!/bin/bash

# Database backup and restore script for P2P Gear Rental Platform

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
COMPOSE_FILE="docker-compose.yml"
DB_SERVICE="db"
BACKUP_SERVICE="db_backup"
BACKUP_DIR="/backups"

show_usage() {
    echo "Usage: $0 {backup|restore|list|cleanup} [options]"
    echo ""
    echo "Commands:"
    echo "  backup                    Create a new backup"
    echo "  restore <backup_file>     Restore from a backup file"
    echo "  list                      List available backups"
    echo "  cleanup                   Remove old backups"
    echo ""
    echo "Options:"
    echo "  -f, --file <file>         Specify backup file for restore"
    echo "  -d, --days <days>         Retention days for cleanup (default: 7)"
    echo "  --dev                     Use development compose file"
    echo ""
    echo "Examples:"
    echo "  $0 backup"
    echo "  $0 restore backup_gearshare_20231201_120000.sql.gz"
    echo "  $0 list"
    echo "  $0 cleanup --days 14"
}

# Parse command line arguments
COMMAND=""
BACKUP_FILE=""
RETENTION_DAYS="7"
USE_DEV="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        backup|restore|list|cleanup)
            COMMAND="$1"
            shift
            ;;
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -d|--days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --dev)
            USE_DEV="true"
            COMPOSE_FILE="docker-compose.dev.yml"
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            if [[ -z "$BACKUP_FILE" && "$COMMAND" == "restore" ]]; then
                BACKUP_FILE="$1"
            else
                echo "Unknown option: $1"
                show_usage
                exit 1
            fi
            shift
            ;;
    esac
done

if [[ -z "$COMMAND" ]]; then
    echo "Error: No command specified"
    show_usage
    exit 1
fi

cd "$PROJECT_DIR"

# Check if docker-compose is available
if ! command -v docker-compose >/dev/null 2>&1; then
    echo "Error: docker-compose not found"
    exit 1
fi

# Check if compose file exists
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "Error: Compose file $COMPOSE_FILE not found"
    exit 1
fi

case "$COMMAND" in
    backup)
        echo "📦 Creating database backup..."
        
        # Start backup service if not running
        if ! docker-compose -f "$COMPOSE_FILE" ps "$BACKUP_SERVICE" | grep -q "Up"; then
            echo "Starting backup service..."
            docker-compose -f "$COMPOSE_FILE" --profile backup up -d "$BACKUP_SERVICE"
            sleep 5
        fi
        
        # Run backup
        docker-compose -f "$COMPOSE_FILE" exec "$BACKUP_SERVICE" /usr/local/bin/backup.sh
        
        # List the new backup
        echo ""
        echo "📋 Recent backups:"
        docker-compose -f "$COMPOSE_FILE" exec "$BACKUP_SERVICE" ls -la "$BACKUP_DIR" | tail -5
        
        echo "✅ Backup completed successfully!"
        ;;
        
    restore)
        if [[ -z "$BACKUP_FILE" ]]; then
            echo "Error: Backup file not specified"
            echo "Use: $0 restore <backup_file>"
            exit 1
        fi
        
        echo "🔄 Restoring database from backup: $BACKUP_FILE"
        
        # Confirm restore
        read -p "⚠️  This will overwrite the current database. Are you sure? (y/N): " confirm
        if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
            echo "Restore cancelled"
            exit 0
        fi
        
        # Stop application to prevent new connections
        echo "Stopping application..."
        docker-compose -f "$COMPOSE_FILE" stop app
        
        # Check if backup file exists in container
        if ! docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" test -f "$BACKUP_DIR/$BACKUP_FILE"; then
            echo "Error: Backup file $BACKUP_FILE not found in container"
            echo "Available backups:"
            docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" ls -la "$BACKUP_DIR"
            exit 1
        fi
        
        # Drop and recreate database
        echo "Recreating database..."
        DB_NAME="${POSTGRES_DB:-gearshare}"
        DB_USER="${POSTGRES_USER:-postgres}"
        
        docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" psql -U "$DB_USER" -c "DROP DATABASE IF EXISTS $DB_NAME;"
        docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"
        
        # Restore from backup
        echo "Restoring backup..."
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" sh -c "gunzip -c $BACKUP_DIR/$BACKUP_FILE | pg_restore -U $DB_USER -d $DB_NAME --verbose"
        else
            docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" pg_restore -U "$DB_USER" -d "$DB_NAME" --verbose "$BACKUP_DIR/$BACKUP_FILE"
        fi
        
        # Start application
        echo "Starting application..."
        docker-compose -f "$COMPOSE_FILE" start app
        
        echo "✅ Database restore completed successfully!"
        ;;
        
    list)
        echo "📋 Available backups:"
        if docker-compose -f "$COMPOSE_FILE" ps "$DB_SERVICE" | grep -q "Up"; then
            docker-compose -f "$COMPOSE_FILE" exec "$DB_SERVICE" ls -la "$BACKUP_DIR" | grep -E "\\.sql(\\.gz)?$" || echo "No backups found"
        else
            echo "Database service is not running. Start it first with: docker-compose -f $COMPOSE_FILE up -d"
        fi
        ;;
        
    cleanup)
        echo "🧹 Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
        
        # Start backup service to run cleanup
        if ! docker-compose -f "$COMPOSE_FILE" ps "$BACKUP_SERVICE" | grep -q "Up"; then
            echo "Starting backup service for cleanup..."
            docker-compose -f "$COMPOSE_FILE" --profile backup up -d "$BACKUP_SERVICE"
            sleep 5
        fi
        
        # Run cleanup
        docker-compose -f "$COMPOSE_FILE" exec "$BACKUP_SERVICE" find "$BACKUP_DIR" -name "backup_*.sql.gz" -type f -mtime +"$RETENTION_DAYS" -delete
        
        # Show remaining backups
        echo "📋 Remaining backups:"
        docker-compose -f "$COMPOSE_FILE" exec "$BACKUP_SERVICE" ls -la "$BACKUP_DIR" | grep -E "\\.sql(\\.gz)?$" | wc -l | xargs echo "Total backups:"
        
        echo "✅ Cleanup completed!"
        ;;
        
    *)
        echo "Error: Unknown command '$COMMAND'"
        show_usage
        exit 1
        ;;
esac