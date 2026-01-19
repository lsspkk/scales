#!/bin/bash

# This script permanently deletes an Azure resource group and 
# all resources within it. It requires explicit confirmation 
# by typing the resource group name before proceeding with 
# the destructive operation.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Setup logging
LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/destroy-resource-group-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Resource Group Destruction Initiated"
log "Log file: $LOG_FILE"

# Resource group to destroy (hardcoded as requested)
RESOURCE_GROUP_NAME="static-site-two-rg"

log ""
log "Resource Group Destruction Configuration"
log "=========================================="
log "Resource Group: $RESOURCE_GROUP_NAME"
log ""
log "WARNING: This operation will DELETE:"
log "  - All resources in the resource group"
log "  - Storage accounts and blobs"
log "  - All associated data"
log "  - This action CANNOT be undone!"
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

# Check if resource group exists
log "Checking if resource group exists..."
if ! az group show --name "$RESOURCE_GROUP_NAME" &>/dev/null; then
    log "Error: Resource group '$RESOURCE_GROUP_NAME' not found"
    exit 1
fi

log "Resource group found: $RESOURCE_GROUP_NAME"
log ""

# List resources that will be deleted
log "Resources that will be deleted:"
log "==============================="
az resource list --resource-group "$RESOURCE_GROUP_NAME" \
    --query "[].{name:name, type:type}" \
    -o table >> "$LOG_FILE" 2>&1

az resource list --resource-group "$RESOURCE_GROUP_NAME" \
    --query "[].{name:name, type:type}" \
    -o table

log ""

# Require explicit confirmation
read -p "Type the resource group name to confirm deletion: " CONFIRMATION

if [ "$CONFIRMATION" != "$RESOURCE_GROUP_NAME" ]; then
    log "Confirmation failed. Destruction cancelled."
    echo "Destruction cancelled."
    exit 1
fi

log ""
log "Confirmation received. Proceeding with destruction..."
log ""

# Delete the resource group
log "Deleting resource group: $RESOURCE_GROUP_NAME"
log "This may take several minutes..."

if az group delete \
    --name "$RESOURCE_GROUP_NAME" \
    --yes >> "$LOG_FILE" 2>&1; then
    log ""
    log "SUCCESS: Resource group '$RESOURCE_GROUP_NAME' deleted"
    log ""
    log "IMPORTANT:"
    log "  - All resources in the resource group have been deleted"
    log "  - Data associated with these resources is no longer accessible"
    log "  - This action cannot be reversed"
else
    log "Error: Failed to delete resource group. Check log file: $LOG_FILE"
    exit 1
fi

log ""
log "Destruction complete!"
log "Log saved to: $LOG_FILE"
