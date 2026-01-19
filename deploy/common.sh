#!/bin/bash

# This script provides shared utility functions for Azure deployment scripts. It includes initialization, logging, Azure CLI validation, configuration loading, and common Azure operations to reduce code duplication.

# Initialize script environment
# Sets error handling and establishes script directory
init_script() {
    set -e
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[1]}")" && pwd)"
    cd "$SCRIPT_DIR/.."
}

# Setup logging with timestamped log files
# Usage: setup_logging "script-name"
setup_logging() {
    local script_name="$1"
    LOG_DIR="$SCRIPT_DIR/../logs"
    mkdir -p "$LOG_DIR"
    LOG_FILE="$LOG_DIR/${script_name}-$(date +%Y%m%d-%H%M%S).log"
    export LOG_FILE
}

# Log message with timestamp to both console and log file
# Usage: log "message"
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# Check if Azure CLI is installed
# Exits with error if not found
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        if [ -n "$LOG_FILE" ]; then
            log "Error: Azure CLI not found"
        else
            echo "Error: Azure CLI not found"
        fi
        exit 1
    fi
}

# Check if user is logged into Azure
# Exits with error if not logged in
check_azure_login() {
    if ! az account show &> /dev/null; then
        if [ -n "$LOG_FILE" ]; then
            log "Error: Not logged in to Azure. Run 'az login' first."
        else
            echo "Error: Not logged in to Azure. Run 'az login' first."
        fi
        exit 1
    fi
}

# Load resource configuration from resource-names.env
# Exits with error if file not found
load_resource_config() {
    if [ ! -f "$SCRIPT_DIR/resource-names.env" ]; then
        log "Error: resource-names.env not found"
        log "Create it by copying: cp resource-names.env.template resource-names.env"
        exit 1
    fi
    source "$SCRIPT_DIR/resource-names.env"
    log "Loaded resource names from resource-names.env"
}

# Validate that required configuration variables are set
# Usage: validate_config "VAR1" "VAR2" "VAR3"
validate_config() {
    local required_vars=("$@")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log "Error: Required variables not set in resource-names.env:"
        for var in "${missing_vars[@]}"; do
            log "  - $var"
        done
        exit 1
    fi
}

# Check if storage account exists
# Usage: check_storage_account "storage-name" "resource-group"
check_storage_account() {
    local storage_name="$1"
    local resource_group="$2"
    
    if ! az storage account show \
        --name "$storage_name" \
        --resource-group "$resource_group" &>/dev/null; then
        log "Error: Storage account '$storage_name' not found in resource group '$resource_group'"
        exit 1
    fi
}

# Get storage account key
# Usage: STORAGE_KEY=$(get_storage_key "storage-name" "resource-group")
get_storage_key() {
    local storage_name="$1"
    local resource_group="$2"
    
    local key=$(az storage account keys list \
        --account-name "$storage_name" \
        --resource-group "$resource_group" \
        --query "[0].value" -o tsv 2>/dev/null)
    
    if [ -z "$key" ]; then
        log "Error: Failed to retrieve storage account key"
        exit 1
    fi
    
    echo "$key"
}

# Check if resource group exists
# Usage: check_resource_group "resource-group-name"
check_resource_group() {
    local resource_group="$1"
    
    if ! az group show --name "$resource_group" &>/dev/null; then
        log "Error: Resource group '$resource_group' not found"
        exit 1
    fi
}

# Get current TLS version for storage account
# Usage: TLS_VERSION=$(get_storage_tls_version "storage-name" "resource-group")
get_storage_tls_version() {
    local storage_name="$1"
    local resource_group="$2"
    
    az storage account show \
        --name "$storage_name" \
        --resource-group "$resource_group" \
        --query "minimumTlsVersion" -o tsv 2>/dev/null
}

# Print a section header in logs
# Usage: log_section "Section Title"
log_section() {
    local title="$1"
    local length=${#title}
    local separator=$(printf '=%.0s' $(seq 1 $length))
    
    log ""
    log "$title"
    log "$separator"
}

# Print script configuration summary
# Usage: log_config "Key1" "Value1" "Key2" "Value2" ...
log_config() {
    while [ $# -gt 0 ]; do
        log "$1: $2"
        shift 2
    done
    log ""
}
