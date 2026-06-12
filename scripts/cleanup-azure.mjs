#!/usr/bin/env node
/**
 * scripts/cleanup-azure.mjs
 *
 * Removes obsolete Vite asset bundles from Azure $web blob storage.
 *
 * Each deploy uploads a new set of hashed files under assets/ but never
 * removes the old ones. This script groups assets/ blobs by upload time,
 * keeps the N most recent deployment batches, and deletes the rest.
 * Files outside assets/ (index.html, samples/, etc.) are never touched.
 *
 * Usage:
 *   node scripts/cleanup-azure.mjs             # dry run
 *   node scripts/cleanup-azure.mjs --apply     # actually delete
 *   node scripts/cleanup-azure.mjs --keep=3    # keep 3 batches (default: 2)
 *   node scripts/cleanup-azure.mjs --env=path/to/file.env
 *
 * Credentials are read from deploy/resource-names.env (default) or the path
 * given via --env. Required variables:
 *   STORAGE_ACCOUNT_NAME   storage account name
 *   RESOURCE_GROUP         resource group (used to fetch the key via az cli)
 *
 * Optionally set AZURE_STORAGE_ACCOUNT_KEY in the env file to skip the
 * key-fetch step (useful when you don't have RBAC to list keys).
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// --- Parse CLI args ---
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const keepArg = args.find(a => a.startsWith('--keep='));
const keep = keepArg ? parseInt(keepArg.slice(7), 10) : 2;
const envArg = args.find(a => a.startsWith('--env='));
const envFile = envArg ? resolve(envArg.slice(6)) : resolve(REPO_ROOT, 'deploy/resource-names.env');

// --- Load .env file ---
function loadEnv(path) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    out[k] = v;
  }
  return out;
}

const env = loadEnv(envFile);
const E = k => process.env[k] ?? env[k];

const account = E('STORAGE_ACCOUNT_NAME') ?? E('AZURE_STORAGE_ACCOUNT_NAME');
const resourceGroup = E('RESOURCE_GROUP');
let accountKey = E('AZURE_STORAGE_ACCOUNT_KEY');

if (!account) {
  console.error(`Missing STORAGE_ACCOUNT_NAME in ${envFile}`);
  console.error(`Copy deploy/resource-names.env.template to deploy/resource-names.env and fill it in.`);
  process.exit(1);
}

// --- Fetch account key if not provided ---
if (!accountKey) {
  if (!resourceGroup) {
    console.error('Missing AZURE_STORAGE_ACCOUNT_KEY and RESOURCE_GROUP — cannot retrieve key.');
    process.exit(1);
  }
  console.log(`Fetching storage key for "${account}" ...`);
  try {
    accountKey = execSync(
      `az storage account keys list --account-name "${account}" --resource-group "${resourceGroup}" --query "[0].value" -o tsv`,
      { encoding: 'utf8' }
    ).trim();
  } catch {
    console.error('Failed to retrieve storage key. Make sure you are logged in: az login');
    process.exit(1);
  }
}

// --- List assets/ blobs ---
console.log(`Listing assets/ blobs in storage account "${account}" ...\n`);
let raw;
try {
  raw = execSync(
    `az storage blob list` +
    ` --account-name "${account}"` +
    ` --account-key "${accountKey}"` +
    ` --container-name '$web'` +
    ` --prefix "assets/"` +
    ` --query "[].{name:name, lastModified:properties.lastModified}"` +
    ` -o json`,
    { encoding: 'utf8' }
  );
} catch {
  console.error('Failed to list blobs. Check credentials and container name.');
  process.exit(1);
}

const blobs = JSON.parse(raw);
if (blobs.length === 0) {
  console.log('No assets/ blobs found.');
  process.exit(0);
}

// --- Cluster into deployment batches by upload time ---
// Files uploaded within GAP_MS of each other belong to the same deploy.
const GAP_MS = 5 * 60 * 1000;

blobs.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified));

const batches = [];
let current = null;
for (const blob of blobs) {
  const t = new Date(blob.lastModified).getTime();
  if (!current || t - current.end > GAP_MS) {
    current = { start: t, end: t, blobs: [] };
    batches.push(current);
  }
  current.end = t;
  current.blobs.push(blob);
}

// Newest first
batches.sort((a, b) => b.end - a.end);

console.log(`Found ${blobs.length} asset blobs in ${batches.length} deployment batch(es):\n`);
for (let i = 0; i < batches.length; i++) {
  const b = batches[i];
  const date = new Date(b.end).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  const tag = i < keep ? '\x1b[32mKEEP\x1b[0m  ' : '\x1b[31mDELETE\x1b[0m';
  console.log(`  Batch ${i + 1}  [${tag}]  ${date}  — ${b.blobs.length} files`);
}

const toDelete = batches.slice(keep).flatMap(b => b.blobs.map(b => b.name));

if (toDelete.length === 0) {
  console.log('\nNothing to delete.');
  process.exit(0);
}

console.log(`\n${apply ? 'Deleting' : '[DRY RUN] Would delete'} ${toDelete.length} file(s) from ${Math.max(0, batches.length - keep)} old batch(es).`);

if (!apply) {
  const preview = toDelete.slice(0, 8);
  preview.forEach(n => console.log('  -', n));
  if (toDelete.length > preview.length) console.log(`  ... and ${toDelete.length - preview.length} more`);
  console.log('\nRun with --apply to actually delete.');
  process.exit(0);
}

// --- Delete ---
console.log();
let deleted = 0;
for (const name of toDelete) {
  process.stdout.write(`  Deleting ${name} ... `);
  execSync(
    `az storage blob delete` +
    ` --account-name "${account}"` +
    ` --account-key "${accountKey}"` +
    ` --container-name '$web'` +
    ` --name "${name}"`,
    { encoding: 'utf8' }
  );
  console.log('done');
  deleted++;
}
console.log(`\nDeleted ${deleted} file(s). Done.`);
