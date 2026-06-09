#!/bin/bash

# This script updates the TLS configuration for the musicmodes 
# blob service to require TLS 1.2 minimum. It verifies storage 
# account access and blob service connectivity after applying 
# the configuration.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Setup logging
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/update-musicmodes-tls-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting musicmodes blob service TLS update"
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

BLOB_SERVICE_NAME="musicmodes"

log ""
log "Blob Service TLS Update Configuration"
log "======================================"
log "Storage Account: $STORAGE_ACCOUNT_NAME"
log "Blob Service: $BLOB_SERVICE_NAME"
log "Resource Group: $RESOURCE_GROUP"
log "Target TLS Version: 1.2 minimum"
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

log "Storage account verified: $STORAGE_ACCOUNT_NAME"

# Get storage account key for blob service operations
log ""
log "Retrieving storage account credentials..."
STORAGE_KEY=$(az storage account keys list \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "[0].value" -o tsv 2>/dev/null)

if [ -z "$STORAGE_KEY" ]; then
    log "Error: Failed to retrieve storage account key"
    exit 1
fi

log "Storage account credentials retrieved"

# Get current minimum TLS version for the storage account
log ""
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
    log "Blob service is already configured with TLS 1.2 minimum."
    log "No changes needed."
    log ""
    log "Current configuration verified successfully"
    exit 0
fi

# Configure TLS 1.2 minimum
log ""
log "Configuring minimum TLS version to TLS 1.2 for blob service..."
log "Blob Service: $BLOB_SERVICE_NAME"

if az storage account update \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --min-tls-version TLS1_2 >> "$LOG_FILE" 2>&1; then
    log "TLS 1.2 minimum version configured successfully for $BLOB_SERVICE_NAME!"
else
    log "Error: Failed to configure TLS version. Check log file: $LOG_FILE"
    exit 1
fi

# Verify the change
log ""
log "Verifying configuration for blob service: $BLOB_SERVICE_NAME..."
NEW_TLS=$(az storage account show \
    --name "$STORAGE_ACCOUNT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "minimumTlsVersion" -o tsv)

log "New minimum TLS version: $NEW_TLS"

# Verify blob service connectivity with TLS 1.2
log ""
log "Verifying blob service connectivity..."
if az storage container exists \
    --name "$BLOB_SERVICE_NAME" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_KEY" >> "$LOG_FILE" 2>&1; then
    log "Blob service '$BLOB_SERVICE_NAME' is accessible"
else
    log "Warning: Could not verify blob service access. Container may not exist or other issues."
fi

log ""

if [ "$NEW_TLS" == "TLS1_2" ]; then
    log ""
    log "SUCCESS: Blob service now requires TLS 1.2 or higher"
    log "Service: $BLOB_SERVICE_NAME"
    log ""
    log "IMPORTANT:"
    log "  - Change propagation may take up to 30 seconds"
    log "  - Clients using TLS 1.0 or 1.1 will receive error 400 (Bad Request)"
    log "  - Ensure all clients are configured to use TLS 1.2+"
else
    log "WARNING: TLS version may not be set correctly. Please verify manually."
fi

log ""
log "Blob service TLS update complete!"
log "Log saved to: $LOG_FILE"
