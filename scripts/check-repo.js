#!/usr/bin/env node

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { checkRepository } from '../src/check.js';
import { STALE_AFTER_DAYS, staleSources } from '../src/lifecycle.js';

const ignoredDirectories = new Set(['.git', '.free-llm', 'node_modules', 'coverage']);
const requiredFiles = [
  '.github/workflows/ci.yml',
  'LICENSE',
  'README.md',
  'README_zh.md',
  'SECURITY.md',
  'docs/clients.md',
  'docs/doctor.md',
  'package.json',
  'src/cli.js',
];
const credentialLabels = [
  { name: 'OpenAI key', pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Anthropic key', pattern: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/ },
  { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/ },
  { name: 'GitHub fine-grained token', pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: 'Groq key', pattern: /\bgsk_[A-Za-z0-9_-]{20,}\b/ },
  { name: 'Google API key', pattern: /\bAIza[0-9A-Za-z_-]{30,}\b/ },
  { name: 'private key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'credential-bearing URL', pattern: /https?:\/\/[^/\s:@]+:[^@\s/]+@/ },
];

function parseRoot(args) {
  if (args.length === 0) return null;
  if (args.length === 2 && args[0] === '--root') return path.resolve(args[1]);
  throw new Error('Usage: node scripts/check-repo.js [--root <directory>]');
}

async function collectFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...await collectFiles(absolutePath, root));
      }
    } else if (entry.isFile()) {
      files.push(path.relative(root, absolutePath));
    }
  }
  return files;
}

async function credentialFindings(root, files) {
  const findings = [];
  for (const relativePath of files) {
    const content = await readFile(path.join(root, relativePath));
    if (content.includes(0)) continue;
    const text = content.toString('utf8');
    for (const { name, pattern } of credentialLabels) {
      if (pattern.test(text)) findings.push({ relativePath, name });
    }
  }
  return findings;
}

async function checkDirectory(root) {
  const files = await collectFiles(root);
  const fileSet = new Set(files);
  const missingFiles = requiredFiles.filter((file) => !fileSet.has(file));
  if (missingFiles.length > 0) {
    throw new Error(`Missing required file: ${missingFiles.join(', ')}`);
  }
  const findings = await credentialFindings(root, files);
  if (findings.length > 0) {
    const summary = findings
      .map(({ relativePath, name }) => `${relativePath} (${name})`)
      .join(', ');
    throw new Error(`Credential-like pattern in ${summary}`);
  }
  process.stdout.write(`Repository check passed: ${files.length} files scanned.\n`);
}

async function main(args) {
  const root = parseRoot(args);

  if (root !== null) {
    await checkDirectory(root);
    return;
  }

  const errors = await checkRepository();
  if (errors.length > 0) {
    process.stderr.write(`${errors.map((error) => `- ${error}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Repository checks passed.\n');
  await warnAboutStaleSources();
}

// 只报不拦:退出码不动。见 src/lifecycle.js 里那段说明 —— 源没重读是欠账,
// 该有人看见;把它做成硬闸,人只会去把天数调大。
async function warnAboutStaleSources() {
  const catalogPath = new URL('../data/providers.json', import.meta.url);
  const providers = JSON.parse(await readFile(catalogPath, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  const stale = staleSources(providers, today);
  if (stale.length === 0) {
    // 没有欠账的时候也印一行。只在坏消息时说话的检查,和被人删掉的检查,
    // 输出一模一样。
    process.stdout.write(
      `Sources: all ${providers.length} re-read within ${STALE_AFTER_DAYS} days.\n`,
    );
    return;
  }

  const lines = stale.map(({ id, checkedAt, daysAgo }) => `  - ${id}: ${checkedAt} (${daysAgo} days ago)`);
  process.stdout.write(
    `Sources not re-read in over ${STALE_AFTER_DAYS} days (${stale.length} of ${providers.length}):\n${lines.join('\n')}\n`,
  );
}

main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(`Repository check failed: ${error.message}\n`);
  process.exitCode = 1;
});
