#!/bin/bash

# This script backs up the static website content from Azure Storage 
# to a local timestamped directory. It downloads all files from 
# the $web container and creates a manifest file with backup details.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Setup logging
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/backup-static-site-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting static site backup"
log "Log file: $LOG_FILE"

# Check for required config file
if [ ! -f "$SCRIPT_DIR/resource-names.env" ]; then
    log "Error: resource-names.env not found"
    log "Create it by copying: cp resource-names.env.template resource-names.env"
    exit 1
fi

# Load resource names from env file
source "$SCRIPT_DIR/resource-names.env"
log "Loaded resource names from resource-names.env"

# Validate required variables
if [ -z "$STORAGE_ACCOUNT_NAME" ] || [ -z "$RESOURCE_GROUP" ]; then
    log "Error: Required variables not set in resource-names.env"
    log "Required: STORAGE_ACCOUNT_NAME, RESOURCE_GROUP"
    exit 1
fi

log ""
log "Static Site Backup Configuration"
log "=================================="
log "Storage Account: $STORAGE_ACCOUNT_NAME"
log "Resource Group: $RESOURCE_GROUP"
log ""

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    log "Error: Azure CLI not found"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    log "Error: Not logged in to Azure. Run 'az login' first."
    exit 1
fi

# Check if storage account exists
if ! az storage account show --name "$STORAGE_ACCOUNT_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
    log "Error: Storage account '$STORAGE_ACCOUNT_NAME' not found in resource group '$RESOURCE_GROUP'"
    exit 1
fi

# Create backup directory
BACKUP_DIR="$SCRIPT_DIR/../backups"
BACKUP_TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_PATH="$BACKUP_DIR/static-site-$BACKUP_TIMESTAMP"
mkdir -p "$BACKUP_PATH"

log "Backup directory: $BACKUP_PATH"

# Get storage account key
log "Retrieving storage account key..."
STORAGE_KEY=$(az storage account keys list \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[0].value" -o tsv 2>/dev/null)

if [ -z "$STORAGE_KEY" ]; then
    log "Error: Failed to retrieve storage account key"
    exit 1
fi

log "Storage account key retrieved successfully"

# Download all blobs from the \$web container
log ""
log "Downloading static site files from \$web container..."

az storage blob download-batch \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_KEY" \
    --source '$web' \
    --destination "$BACKUP_PATH" >> "$LOG_FILE" 2>&1

if [ $? -eq 0 ]; then
    log "Files downloaded successfully"
else
    log "Error: Failed to download files. Check log file: $LOG_FILE"
    exit 1
fi

# Count files backed up
FILE_COUNT=$(find "$BACKUP_PATH" -type f | wc -l)
log ""
log "Backup completed: $FILE_COUNT files backed up"
log "Backup location: $BACKUP_PATH"

# Create a manifest file
MANIFEST_FILE="$BACKUP_PATH/MANIFEST.txt"
cat > "$MANIFEST_FILE" << EOF
Static Site Backup Manifest
============================
Backup Date: $(date '+%Y-%m-%d %H:%M:%S')
Storage Account: $STORAGE_ACCOUNT_NAME
Resource Group: $RESOURCE_GROUP
Files Backed Up: $FILE_COUNT
Container: \$web

Backup Details:
- Location: $BACKUP_PATH
- Total Size: $(du -sh "$BACKUP_PATH" | cut -f1)
EOF

log "Manifest created: $MANIFEST_FILE"
log ""
log "SUCCESS: Static site backup completed"
log "Backup saved to: $BACKUP_PATH"
log "Log saved to: $LOG_FILE"
