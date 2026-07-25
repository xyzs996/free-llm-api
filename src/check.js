import { readdir, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { findStaleArtifacts, renderArtifacts } from './render.js';
import { validateChangelog, validateProviders } from './validate.js';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage']);
const ignoredFiles = new Set(['data/probe-output.json']);
const credentialPatterns = [
  ['OpenAI-style key', /sk-[A-Za-z0-9_-]{20,}/g],
  ['OpenRouter key', /sk-or-v1-[A-Za-z0-9_-]{20,}/g],
  ['Groq key', /gsk_[A-Za-z0-9_-]{20,}/g],
  ['GitHub token', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['GitHub fine-grained token', /github_pat_[A-Za-z0-9_]{20,}/g],
  ['Google API key', /AIza[0-9A-Za-z_-]{30,}/g],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  ['credential-bearing URL', /\bhttps?:\/\/[^\s/@:]+:[^\s/@]+@[^\s/]+/gi],
];

export function findCredentialLeaks(filePath, text) {
  const leaks = [];
  for (const [label, pattern] of credentialPatterns) {
    for (const match of text.matchAll(pattern)) {
      leaks.push(`${filePath}: possible ${label} at offset ${match.index}`);
    }
  }
  return leaks;
}

async function listFiles(directory, root = directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(absolutePath, root));
    } else if (entry.isFile()) {
      files.push({
        absolutePath,
        relativePath: relative(root, absolutePath).replaceAll('\\', '/'),
      });
    }
  }

  return files;
}

export async function checkRepository(root = repositoryRoot) {
  const errors = [];
  const providers = JSON.parse(await readFile(resolve(root, 'data/providers.json'), 'utf8'));
  errors.push(...validateProviders(providers));

  const changelog = JSON.parse(await readFile(resolve(root, 'data/changelog.json'), 'utf8'));
  errors.push(...validateChangelog(changelog, providers));

  const stale = await findStaleArtifacts(renderArtifacts(providers, changelog), root);
  for (const relativePath of stale) {
    errors.push(`${relativePath} is missing or out of date; run npm run render`);
  }

  for (const file of await listFiles(root)) {
    if (ignoredFiles.has(file.relativePath)) continue;
    const content = await readFile(file.absolutePath, 'utf8').catch(() => null);
    if (content !== null) errors.push(...findCredentialLeaks(file.relativePath, content));
  }

  return errors;
}
