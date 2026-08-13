#!/usr/bin/env node

import { readdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const DEFAULT_DIR = 'public/arch/x86_64';
const DEFAULT_KEEP = 3;
const PACKAGE_EXTENSION = '.pkg.tar.zst';

const args = process.argv.slice(2);
let apply = false;
let keep = DEFAULT_KEEP;
let repoDir = DEFAULT_DIR;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === '--apply') {
    apply = true;
  } else if (arg === '--keep') {
    keep = Number.parseInt(args[++index] ?? '', 10);
  } else if (arg.startsWith('--keep=')) {
    keep = Number.parseInt(arg.slice('--keep='.length), 10);
  } else if (arg === '--dir') {
    repoDir = args[++index] ?? '';
  } else if (arg.startsWith('--dir=')) {
    repoDir = arg.slice('--dir='.length);
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  } else {
    fail(`Unknown argument: ${arg}`);
  }
}

if (!Number.isInteger(keep) || keep < 1) {
  fail('--keep must be a positive integer.');
}

if (!repoDir) {
  fail('--dir must not be empty.');
}

const entries = await readdir(repoDir, { withFileTypes: true });
const packages = [];

for (const entry of entries) {
  if (!entry.isFile()) {
    continue;
  }

  const pkg = readPackageInfo(repoDir, entry.name) ?? parsePackageFilename(entry.name);

  if (pkg) {
    packages.push(pkg);
  }
}

const groupedPackages = Map.groupBy(packages, (pkg) => pkg.name);
const removals = [];

for (const [name, versions] of groupedPackages) {
  versions.sort(comparePackages).reverse();

  for (const pkg of versions.slice(keep)) {
    removals.push(pkg.filename);

    if (entries.some((entry) => entry.isFile() && entry.name === `${pkg.filename}.sig`)) {
      removals.push(`${pkg.filename}.sig`);
    }
  }
}

removals.sort();

if (removals.length === 0) {
  console.log(`Nothing to prune. Every package has ${keep} or fewer versions.`);
  process.exit(0);
}

const action = apply ? 'Removing' : 'Would remove';
console.log(`${action} ${removals.length} file(s) from ${repoDir}:`);

for (const filename of removals) {
  console.log(`- ${filename}`);
}

if (!apply) {
  console.log('\nDry run only. Re-run with --apply to delete these files.');
  process.exit(0);
}

for (const filename of removals) {
  await rm(path.join(repoDir, filename), { force: true });
}

console.log('\nDone.');

function parsePackageFilename(filename) {
  if (!filename.endsWith(PACKAGE_EXTENSION)) {
    return null;
  }

  const basename = filename.slice(0, -PACKAGE_EXTENSION.length);
  const archSep = basename.lastIndexOf('-');
  const pkgrelSep = archSep > -1 ? basename.lastIndexOf('-', archSep - 1) : -1;
  const pkgverSep = pkgrelSep > -1 ? basename.lastIndexOf('-', pkgrelSep - 1) : -1;

  if (pkgverSep < 1 || pkgrelSep < 0 || archSep < 0) {
    return null;
  }

  return {
    filename,
    name: basename.slice(0, pkgverSep),
    version: `${basename.slice(pkgverSep + 1, pkgrelSep)}-${basename.slice(pkgrelSep + 1, archSep)}`,
    arch: basename.slice(archSep + 1),
  };
}

function readPackageInfo(repoDir, filename) {
  if (!filename.endsWith(PACKAGE_EXTENSION)) {
    return null;
  }

  const result = spawnSync(
    'bsdtar',
    ['-xOf', path.join(repoDir, filename), '.PKGINFO'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  );

  if (result.status !== 0 || !result.stdout) {
    return null;
  }

  const fields = Object.fromEntries(
    result.stdout
      .split('\n')
      .map((line) => line.match(/^([a-z0-9_]+) = (.+)$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );

  if (!fields.pkgname || !fields.pkgver || !fields.arch) {
    return null;
  }

  return {
    filename,
    name: fields.pkgname,
    version: fields.pkgver,
    arch: fields.arch,
  };
}

function comparePackages(left, right) {
  const versionComparison = compareArchVersions(left.version, right.version);

  if (versionComparison !== 0) {
    return versionComparison;
  }

  return left.arch.localeCompare(right.arch);
}

function compareArchVersions(left, right) {
  const vercmp = spawnSync('vercmp', [left, right], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });

  if (vercmp.status === 0 && vercmp.stdout.trim()) {
    return Number.parseInt(vercmp.stdout.trim(), 10);
  }

  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function printHelp() {
  console.log(`Usage: node scripts/prune-arch-packages.mjs [options]

Options:
  --apply          Delete old package files. Without this, only prints a dry run.
  --keep <count>   Number of versions to keep per package. Default: ${DEFAULT_KEEP}
  --dir <path>     Package repository directory. Default: ${DEFAULT_DIR}
  -h, --help       Show this help.
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
