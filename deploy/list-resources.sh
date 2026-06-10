#!/bin/bash

# This script lists all Azure resources in the 
# static-site-two-rg resource group with detailed information. 
# It displays storage accounts, containers, TLS configuration, 
#and static website URLs.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Resource group to list
RESOURCE_GROUP_NAME="static-site-two-rg"

echo ""
echo "Azure Resources in Resource Group"
echo "=================================="
echo "Resource Group: $RESOURCE_GROUP_NAME"
echo ""

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

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP_NAME" &>/dev/null; then
    echo "Error: Resource group '$RESOURCE_GROUP_NAME' not found"
    exit 1
fi

# Get resource group location and creation time
echo "Resource Group Details:"
echo "======================="
az group show \
    --name "$RESOURCE_GROUP_NAME" \
    --query "{Name:name, Location:location, ProvisioningState:properties.provisioningState}" \
    -o table

echo ""

# List all resources with detailed information
echo "All Resources:"
echo "=============="
RESOURCE_COUNT=$(az resource list --resource-group "$RESOURCE_GROUP_NAME" --query "length([*])" -o tsv)
echo "Total Resources: $RESOURCE_COUNT"
echo ""

if [ "$RESOURCE_COUNT" -eq 0 ]; then
    echo "No resources found in this resource group."
else
    # Detailed table view
    az resource list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].{Name:name, Type:type, Location:location, ResourceGroup:resourceGroup}" \
        -o table

    echo ""
    echo "Resource Details (JSON):"
    echo "======================="
    echo ""

    # Show as formatted JSON for detailed info
    az resource list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].[name, type, kind, location, sku.name, properties.state]" \
        -o json | jq '.' 2>/dev/null || \
    az resource list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        -o json | jq '.[] | {name, type, location, sku}' 2>/dev/null
fi

echo ""

# List storage accounts specifically
echo "Storage Accounts:"
echo "================="
STORAGE_COUNT=$(az storage account list --resource-group "$RESOURCE_GROUP_NAME" --query "length([*])" -o tsv 2>/dev/null || echo 0)
echo "Total Storage Accounts: $STORAGE_COUNT"
echo ""

if [ "$STORAGE_COUNT" -gt 0 ]; then
    az storage account list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].{Name:name, Kind:kind, SKU:sku.name, Status:provisioningState, TLS_Minimum:minimumTlsVersion}" \
        -o table

    echo ""
    echo "Storage Account Details:"
    echo "======================="

    # List each storage account's details
    az storage account list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].name" -o tsv | while read -r storage_account; do
        echo ""
        echo "Storage Account: $storage_account"
        echo "---"

        # Get containers
        ACCOUNT_KEY=$(az storage account keys list \
            --account-name "$storage_account" \
            --resource-group "$RESOURCE_GROUP_NAME" \
            --query "[0].value" -o tsv 2>/dev/null)

        if [ -n "$ACCOUNT_KEY" ]; then
            CONTAINER_COUNT=$(az storage container list \
                --account-name "$storage_account" \
                --account-key "$ACCOUNT_KEY" \
                --query "length([*])" -o tsv 2>/dev/null || echo 0)

            echo "Containers: $CONTAINER_COUNT"

            if [ "$CONTAINER_COUNT" -gt 0 ]; then
                az storage container list \
                    --account-name "$storage_account" \
                    --account-key "$ACCOUNT_KEY" \
                    --query "[].[name, properties.lastModified]" \
                    -o tsv 2>/dev/null | awk '{printf "  - %s (Modified: %s)\n", $1, $2}'
            fi

            # Show tier and replication
            TLS_VERSION=$(az storage account show \
                --name "$storage_account" \
                --resource-group "$RESOURCE_GROUP_NAME" \
                --query "minimumTlsVersion" -o tsv 2>/dev/null || echo "Not set")

            echo "Minimum TLS Version: $TLS_VERSION"
        fi
    done
else
    echo "No storage accounts found in this resource group."
fi

echo ""

# List static website URLs
echo "Static Website URLs:"
echo "==================="

if [ "$STORAGE_COUNT" -gt 0 ]; then
    az storage account list \
        --resource-group "$RESOURCE_GROUP_NAME" \
        --query "[].name" -o tsv | while read -r storage_account; do

        # Check if static website hosting is enabled
        PRIMARY_WEB_ENDPOINT=$(az storage account show \
            --name "$storage_account" \
            --resource-group "$RESOURCE_GROUP_NAME" \
            --query "primaryEndpoints.web" -o tsv 2>/dev/null || echo "")

        if [ -n "$PRIMARY_WEB_ENDPOINT" ] && [ "$PRIMARY_WEB_ENDPOINT" != "null" ]; then
            echo ""
            echo "Storage Account: $storage_account"
            echo "URL: $PRIMARY_WEB_ENDPOINT"
        else
            echo ""
            echo "Storage Account: $storage_account"
            echo "URL: Static website hosting not enabled"
        fi
    done
    echo ""
else
    echo "No storage accounts found."
    echo ""
fi

echo "List complete!"
echo ""
