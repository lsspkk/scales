#!/bin/bash

# This script checks and reports the minimum TLS version configured 
# for Azure Storage accounts. It can check a specific account 
# or all accounts in the subscription, highlighting insecure configurations.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Check if Azure CLI is available
if ! command -v az &> /dev/null; then
    echo "Error: Azure CLI not found"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Error: Not logged in to Azure. Run 'az login' first."
    exit 1
fi

echo ""
echo "TLS Status Check for Azure Storage Accounts"
echo "============================================"
echo ""

# Check if specific storage account is requested
if [ -n "$1" ]; then
    STORAGE_ACCOUNT="$1"
    RESOURCE_GROUP="$2"

    if [ -z "$RESOURCE_GROUP" ]; then
        echo "Usage: $0 <storage-account-name> <resource-group>"
        echo "Or run without arguments to check all storage accounts"
        exit 1
    fi

    echo "Checking storage account: $STORAGE_ACCOUNT"
    echo ""

    TLS_VERSION=$(az storage account show \
        --name "$STORAGE_ACCOUNT" \
        --resource-group "$RESOURCE_GROUP" \
        --query "minimumTlsVersion" -o tsv 2>/dev/null)

    if [ -z "$TLS_VERSION" ] || [ "$TLS_VERSION" == "null" ] || [ "$TLS_VERSION" == "None" ]; then
        TLS_VERSION="Not set (defaults to TLS 1.0)"
        STATUS="INSECURE"
    elif [ "$TLS_VERSION" == "TLS1_2" ]; then
        STATUS="OK"
    else
        STATUS="INSECURE"
    fi

    printf "%-30s %-20s %-10s\n" "Storage Account" "Min TLS Version" "Status"
    printf "%-30s %-20s %-10s\n" "---------------" "---------------" "------"
    printf "%-30s %-20s %-10s\n" "$STORAGE_ACCOUNT" "$TLS_VERSION" "$STATUS"

else
    # Check all storage accounts using resource-names.env if available
    if [ -f "$SCRIPT_DIR/resource-names.env" ]; then
        source "$SCRIPT_DIR/resource-names.env"
        echo "Project storage accounts (from resource-names.env):"
        echo ""

        printf "%-30s %-15s %-20s %-10s\n" "Storage Account" "Resource Group" "Min TLS Version" "Status"
        printf "%-30s %-15s %-20s %-10s\n" "---------------" "--------------" "---------------" "------"

        if [ -n "$STORAGE_ACCOUNT_NAME" ] && [ -n "$RESOURCE_GROUP" ]; then
            TLS_VERSION=$(az storage account show \
                --name "$STORAGE_ACCOUNT_NAME" \
                --resource-group "$RESOURCE_GROUP" \
                --query "minimumTlsVersion" -o tsv 2>/dev/null || echo "Not found")

            if [ -z "$TLS_VERSION" ] || [ "$TLS_VERSION" == "null" ] || [ "$TLS_VERSION" == "None" ]; then
                TLS_VERSION="Not set"
                STATUS="INSECURE"
            elif [ "$TLS_VERSION" == "TLS1_2" ]; then
                STATUS="OK"
            else
                STATUS="INSECURE"
            fi

            printf "%-30s %-15s %-20s %-10s\n" "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP" "$TLS_VERSION" "$STATUS"
        fi
        echo ""
    fi

    echo "All storage accounts in subscription:"
    echo ""

    # Use Azure Resource Graph to query all storage accounts
    printf "%-30s %-25s %-20s %-10s\n" "Storage Account" "Resource Group" "Min TLS Version" "Status"
    printf "%-30s %-25s %-20s %-10s\n" "---------------" "--------------" "---------------" "------"

    az storage account list --query "[].{name:name, resourceGroup:resourceGroup, minimumTlsVersion:minimumTlsVersion}" -o tsv 2>/dev/null | while IFS=$'\t' read -r name rg tls; do
        if [ -z "$tls" ] || [ "$tls" == "null" ] || [ "$tls" == "None" ]; then
            tls="Not set"
            status="INSECURE"
        elif [ "$tls" == "TLS1_2" ]; then
            status="OK"
        else
            status="INSECURE"
        fi
        printf "%-30s %-25s %-20s %-10s\n" "$name" "$rg" "$tls" "$status"
    done
fi

echo ""
echo "Legend:"
echo "  OK       = TLS 1.2 minimum configured (secure)"
echo "  INSECURE = TLS 1.0/1.1 allowed (should be upgraded)"
echo ""
echo "To configure TLS 1.2 minimum, run:"
echo "  ./security/configure-tls.sh"
echo ""
