#!/bin/bash

# This script configures Azure Storage accounts to require 
# TLS 1.2 as the minimum version for enhanced security. 
# It verifies the current configuration and updates it if needed.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Setup logging
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/configure-tls-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting TLS configuration"
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
log "TLS Configuration for Storage Account"
log "======================================"
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

# Get current TLS version
log "Checking current TLS configuration..."
CURRENT_TLS=$(az storage account show \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "minimumTlsVersion" -o tsv 2>/dev/null)

if [ -z "$CURRENT_TLS" ] || [ "$CURRENT_TLS" == "null" ] || [ "$CURRENT_TLS" == "None" ]; then
    log "Current minimum TLS version: Not set (defaults to TLS 1.0)"
    CURRENT_TLS="Not set"
else
    log "Current minimum TLS version: $CURRENT_TLS"
fi

# Check if already configured correctly
if [ "$CURRENT_TLS" == "TLS1_2" ]; then
    log ""
    log "Storage account is already configured with TLS 1.2 minimum."
    log "No changes needed."
    exit 0
fi

# Configure TLS 1.2
log ""
log "Configuring minimum TLS version to TLS 1.2..."

if az storage account update \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --min-tls-version TLS1_2 >> "$LOG_FILE" 2>&1; then
    log "TLS 1.2 minimum version configured successfully!"
else
    log "Error: Failed to configure TLS version. Check log file: $LOG_FILE"
    exit 1
fi

# Verify the change
log ""
log "Verifying configuration..."
NEW_TLS=$(az storage account show \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "minimumTlsVersion" -o tsv)

log "New minimum TLS version: $NEW_TLS"

if [ "$NEW_TLS" == "TLS1_2" ]; then
    log ""
    log "SUCCESS: Storage account now requires TLS 1.2 or higher"
    log ""
    log "IMPORTANT: Change propagation may take up to 30 seconds."
    log "Clients using TLS 1.0 or 1.1 will receive error 400 (Bad Request)."
else
    log "WARNING: TLS version may not be set correctly. Please verify manually."
fi

log ""
log "Configuration complete!"
log "Log saved to: $LOG_FILE"
