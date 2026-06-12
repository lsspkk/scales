# Deployment

## Overview

CI builds the app from source before deploying. The `dist/` folder is **not committed to git** — CI generates it fresh on every deploy.

## Local build step

From the `app/` directory, run:

```sh
npm run build
```

This runs `tsc && vite build` and outputs the production bundle to `dist/` at the **repo root** (configured via `build.outDir: '../dist'` in `vite.config.ts`). Do **not** commit `dist/` — it is gitignored.

## `dist/` folder convention

- Location: repo root `dist/`
- Created by: `npm run build` inside `app/` (or by CI)
- Committed to git: **no** — gitignored; CI builds it fresh every deploy
- Contents: `index.html`, `assets/*.js`, `assets/*.css`, any other static assets

## Pre-push hook (one-time setup)

A pre-push hook runs `npm run build` locally before every `git push` so broken builds never reach CI. Set it up once after cloning:

```sh
bash scripts/install-hooks.sh
```

The hook script lives at `scripts/pre-push.sh` (committed to the repo). `install-hooks.sh` symlinks it into `.git/hooks/pre-push` and marks it executable.

## CI/CD workflow

File: `.github/workflows/deploy-to-azure.yml`

Triggers on push to `main` or manual dispatch. Steps:

1. Checkout repo
2. Set up Node.js 20, cache npm dependencies from `app/package-lock.json`
3. Run `npm ci && npm run build` inside `app/` to produce `dist/`
4. Upload `dist/` to Azure Storage `$web` container using `az storage blob upload-batch`, with separate passes per extension to set correct MIME types:
   - `*.html` → `text/html`
   - `*.css` → `text/css`
   - `*.js` → `application/javascript`

- `*.mp3` → `audio/mpeg`
- `*.svg` → `image/svg+xml`
- `assets/*` → default (covers fonts, images, etc.)

Static files that Vite copies from `app/public/` land in `dist/` at deploy time. If a new file type is added there (for example `samples/*.mp3`), the workflow must upload that extension too or Azure will never receive the files.

## Cleaning up old asset blobs

Each deploy adds new hashed `assets/*.js` / `*.css` bundles to Azure but never removes the old ones. Over time these accumulate. Run the cleanup script periodically to keep only the two most recent deployment batches:

```sh
# Dry run — shows what would be deleted
node scripts/cleanup-azure.mjs

# Actually delete
node scripts/cleanup-azure.mjs --apply

# Keep 3 batches instead of the default 2
node scripts/cleanup-azure.mjs --keep=3 --apply
```

The script reads credentials from `deploy/resource-names.env` (`STORAGE_ACCOUNT_NAME` + `RESOURCE_GROUP`). It fetches the storage key via `az storage account keys list` (requires `az login`). Alternatively, set `AZURE_STORAGE_ACCOUNT_KEY` in that file to skip the key-fetch step.

Only `assets/` blobs are considered — `index.html`, `samples/*.mp3`, and other static files are never touched.

## Secrets

| Secret                       | Purpose              |
| ---------------------------- | -------------------- |
| `AZURE_STORAGE_ACCOUNT_NAME` | Storage account name |
| `AZURE_STORAGE_ACCOUNT_KEY`  | Storage account key  |

No new secrets are needed beyond what was already configured.

## Finding the deployed URL

The app is hosted as an Azure Static Website. The URL follows this pattern:

```
https://<storage-account-name>.z16.web.core.windows.net/
```

### With Azure CLI

List all storage accounts that have static website enabled, including their URLs — no copy-pasting needed:

```sh
az storage account list \
  --query "[?primaryEndpoints.web].{name:name, rg:resourceGroup, url:primaryEndpoints.web}" \
  -o table
```

To get just the URLs:

```sh
az storage account list \
  --query "[?primaryEndpoints.web].primaryEndpoints.web" \
  -o tsv
```

### Via GitHub Actions logs

Go to your repo on GitHub → **Actions** → any successful deploy run → expand the **Deployment complete** step. It prints the full URL.
