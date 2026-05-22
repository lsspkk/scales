# Deployment

## Overview

Builds are done **locally** before committing. CI only deploys — it never runs `npm install` or `npm run build`.

## Local build step

From the `app/` directory, run:

```sh
npm run deploy:build
```

This runs `tsc && vite build` and outputs the production bundle to `dist/` at the **repo root** (configured via `build.outDir: '../dist'` in `vite.config.ts`). Commit the resulting `dist/` folder to git.

## `dist/` folder convention

- Location: repo root `dist/`
- Created by: `npm run deploy:build` inside `app/`
- Committed to git: yes — CI reads it directly, no build step in CI
- Contents: `index.html`, `assets/*.js`, `assets/*.css`, any other static assets

## CI/CD workflow

File: `.github/workflows/deploy-to-azure.yml`

Triggers on push to `main` or manual dispatch. Steps:

1. Checkout repo (includes committed `dist/`)
2. Upload `dist/` to Azure Storage `$web` container using `az storage blob upload-batch`, with separate passes per extension to set correct MIME types:
   - `*.html` → `text/html`
   - `*.css` → `text/css`
   - `*.js` → `application/javascript`

- `*.mp3` → `audio/mpeg`
- `*.svg` → `image/svg+xml`
- `assets/*` → default (covers fonts, images, etc.)

Static files that Vite copies from `app/public/` land in `dist/` at deploy time. If a new file type is added there (for example `samples/*.mp3`), the workflow must upload that extension too or Azure will never receive the files.

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
