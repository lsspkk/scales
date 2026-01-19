# Common.sh Usage Guide

## Overview

`common.sh` is a shared utility library that provides reusable functions for Azure deployment scripts. It eliminates code duplication and ensures consistent error handling, logging, and validation across all scripts.

## Quick Start

### Basic Template

```bash
#!/bin/bash

# Script description (1-3 sentences)

# Load shared utilities
source "$(dirname "$0")/common.sh"

# Initialize
init_script
setup_logging "script-name"

log "Starting script..."

# Validate environment
check_azure_cli
check_azure_login
load_resource_config
validate_config "STORAGE_ACCOUNT_NAME" "RESOURCE_GROUP"

# Your script logic here
log "Doing something..."

log "Script completed successfully"
```

## Available Functions

### Initialization Functions

#### `init_script()`
Initializes the script environment with error handling and sets up directory paths.

```bash
init_script
```

**What it does:**
- Sets `set -e` (exit on error)
- Sets `SCRIPT_DIR` to the deploy directory
- Changes to parent directory

#### `setup_logging(script_name)`
Sets up timestamped logging to both console and file.

```bash
setup_logging "backup-static-site"
```

**What it does:**
- Creates `logs/` directory if needed
- Creates timestamped log file: `logs/script-name-YYYYMMDD-HHMMSS.log`
- Exports `LOG_FILE` variable for use in script

#### `log(message)`
Logs a message with timestamp to both console and log file.

```bash
log "Starting backup process..."
log "Files downloaded: $FILE_COUNT"
```

**Output format:**
```
[2026-01-16 13:45:23] Starting backup process...
```

### Validation Functions

#### `check_azure_cli()`
Verifies Azure CLI is installed. Exits with error if not found.

```bash
check_azure_cli
```

#### `check_azure_login()`
Verifies user is logged into Azure. Exits with error if not logged in.

```bash
check_azure_login
```

**Note:** User must run `az login` before running scripts.

#### `load_resource_config()`
Loads configuration from `resource-names.env` file.

```bash
load_resource_config
```

**What it does:**
- Checks if `deploy/resource-names.env` exists
- Sources the file to load variables
- Logs success message
- Exits with error if file not found

**Variables loaded:**
- `RESOURCE_GROUP`
- `STORAGE_ACCOUNT_NAME`
- `FUNCTION_APP_NAME`
- `STATIC_WEB_APP_NAME`
- `STORAGE_CONTAINER`
- `LOCATION`

#### `validate_config(var1, var2, ...)`
Validates that required configuration variables are set.

```bash
validate_config "STORAGE_ACCOUNT_NAME" "RESOURCE_GROUP"
```

**What it does:**
- Checks each variable is not empty
- Lists all missing variables if any
- Exits with error if any variables are missing

**Example output:**
```
[2026-01-16 13:45:23] Error: Required variables not set in resource-names.env:
[2026-01-16 13:45:23]   - STORAGE_ACCOUNT_NAME
[2026-01-16 13:45:23]   - RESOURCE_GROUP
```

### Azure Resource Functions

#### `check_storage_account(storage_name, resource_group)`
Verifies that a storage account exists. Exits with error if not found.

```bash
check_storage_account "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP"
```

#### `check_resource_group(resource_group)`
Verifies that a resource group exists. Exits with error if not found.

```bash
check_resource_group "$RESOURCE_GROUP"
```

#### `get_storage_key(storage_name, resource_group)`
Retrieves the storage account key. Returns the key or exits with error.

```bash
STORAGE_KEY=$(get_storage_key "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP")
log "Storage key retrieved successfully"
```

#### `get_storage_tls_version(storage_name, resource_group)`
Gets the current minimum TLS version for a storage account.

```bash
TLS_VERSION=$(get_storage_tls_version "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP")
log "Current TLS version: $TLS_VERSION"
```

**Returns:** `TLS1_2`, `TLS1_1`, `TLS1_0`, or empty string if not set

### Utility Functions

#### `log_section(title)`
Prints a section header with underline in logs.

```bash
log_section "Backup Configuration"
```

**Output:**
```
[2026-01-16 13:45:23] 
[2026-01-16 13:45:23] Backup Configuration
[2026-01-16 13:45:23] ====================
```

#### `log_config(key1, value1, key2, value2, ...)`
Prints configuration key-value pairs.

```bash
log_config \
    "Storage Account" "$STORAGE_ACCOUNT_NAME" \
    "Resource Group" "$RESOURCE_GROUP" \
    "Location" "$LOCATION"
```

**Output:**
```
[2026-01-16 13:45:23] Storage Account: musicmodes
[2026-01-16 13:45:23] Resource Group: static-site-two-rg
[2026-01-16 13:45:23] Location: westeurope
[2026-01-16 13:45:23] 
```

## Complete Example

Here's a complete example showing common patterns:

```bash
#!/bin/bash

# This script demonstrates common.sh usage patterns

# Load shared utilities
source "$(dirname "$0")/common.sh"

# Initialize
init_script
setup_logging "example-script"

log "Starting example script"
log "Log file: $LOG_FILE"

# Validate environment
check_azure_cli
check_azure_login
load_resource_config
validate_config "STORAGE_ACCOUNT_NAME" "RESOURCE_GROUP" "LOCATION"

# Display configuration
log_section "Script Configuration"
log_config \
    "Storage Account" "$STORAGE_ACCOUNT_NAME" \
    "Resource Group" "$RESOURCE_GROUP" \
    "Location" "$LOCATION"

# Validate resources exist
check_resource_group "$RESOURCE_GROUP"
check_storage_account "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP"

# Get storage account details
log "Retrieving storage account details..."
STORAGE_KEY=$(get_storage_key "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP")
TLS_VERSION=$(get_storage_tls_version "$STORAGE_ACCOUNT_NAME" "$RESOURCE_GROUP")

log "Storage key retrieved"
log "Current TLS version: $TLS_VERSION"

# Do actual work
log_section "Performing Operations"
log "Doing something useful..."

# ... your script logic here ...

# Finish
log ""
log "SUCCESS: Script completed"
log "Log saved to: $LOG_FILE"
```

## Error Handling

All validation functions automatically exit with error code 1 if validation fails. You don't need to check return codes for these functions:

```bash
# These functions exit automatically on error
check_azure_cli           # Exits if Azure CLI not found
check_azure_login         # Exits if not logged in
load_resource_config      # Exits if config file not found
validate_config "VAR"     # Exits if VAR is empty
check_storage_account ... # Exits if account doesn't exist
```

For your own operations, you can use standard error handling:

```bash
if az storage blob upload ... >> "$LOG_FILE" 2>&1; then
    log "Upload successful"
else
    log "Error: Upload failed. Check log file: $LOG_FILE"
    exit 1
fi
```

## Best Practices

1. **Always source common.sh first**
   ```bash
   source "$(dirname "$0")/common.sh"
   ```

2. **Initialize in this order**
   ```bash
   init_script
   setup_logging "script-name"
   ```

3. **Validate before doing work**
   ```bash
   check_azure_cli
   check_azure_login
   load_resource_config
   validate_config "REQUIRED_VAR1" "REQUIRED_VAR2"
   ```

4. **Use log() for all output**
   ```bash
   log "Message"  # Good - goes to console and log file
   echo "Message" # Bad - only goes to console
   ```

5. **Use log_section() for major sections**
   ```bash
   log_section "Configuration"
   log_section "Validation"
   log_section "Operations"
   ```

6. **Display configuration with log_config()**
   ```bash
   log_config \
       "Key1" "$VALUE1" \
       "Key2" "$VALUE2"
   ```

## Migration Guide

### Before (without common.sh)

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

LOG_DIR="$SCRIPT_DIR/../logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/script-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

if ! command -v az &> /dev/null; then
    log "Error: Azure CLI not found"
    exit 1
fi

if ! az account show &> /dev/null; then
    log "Error: Not logged in to Azure"
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/resource-names.env" ]; then
    log "Error: resource-names.env not found"
    exit 1
fi

source "$SCRIPT_DIR/resource-names.env"

if [ -z "$STORAGE_ACCOUNT_NAME" ]; then
    log "Error: STORAGE_ACCOUNT_NAME not set"
    exit 1
fi

# ... actual script logic ...
```

### After (with common.sh)

```bash
#!/bin/bash

source "$(dirname "$0")/common.sh"

init_script
setup_logging "script"
check_azure_cli
check_azure_login
load_resource_config
validate_config "STORAGE_ACCOUNT_NAME"

# ... actual script logic ...
```

**Lines saved: ~35 lines of boilerplate!**

## Testing

To test that common.sh is working:

```bash
cd deploy

# Test basic initialization
bash -c 'source common.sh; init_script; echo "OK: init_script"'

# Test logging
bash -c 'source common.sh; init_script; setup_logging "test"; log "Test message"'

# Test Azure CLI check (should pass if Azure CLI installed)
bash -c 'source common.sh; check_azure_cli; echo "OK: Azure CLI found"'

# Test Azure login check (should pass if logged in)
bash -c 'source common.sh; check_azure_login; echo "OK: Logged in"'
```

## Troubleshooting

### "command not found: init_script"

Make sure you're sourcing common.sh correctly:

```bash
source "$(dirname "$0")/common.sh"  # Correct
./common.sh                          # Wrong - this executes, doesn't source
```

### "LOG_FILE: unbound variable"

Make sure you call `setup_logging()` before using `log()`:

```bash
init_script
setup_logging "script-name"  # Must call this first
log "Now logging works"       # Now this works
```

### "resource-names.env not found"

Make sure you've created the config file:

```bash
cd deploy
cp resource-names.env.template resource-names.env
# Edit resource-names.env with your values
```

## See Also

- `resource-names.env.template` - Configuration template
- `backup-static-site-refactored.sh.example` - Complete example
- `../reports/refactoring-summary.txt` - Before/after comparison
- `../reports/redundancy-analysis.txt` - Detailed analysis
