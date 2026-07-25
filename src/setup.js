import { chmod, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SNIPPET_CLIENTS, normalizeBaseUrl, renderSnippet } from './snippets.js';

// Re-exported because `doctor` validates the same --base-url flag.
export { normalizeBaseUrl };

// `setup` configures editors and agents. The cURL/Python/Node snippets in
// SNIPPET_CLIENTS are reading material for the website and examples/ rather
// than something this command writes into a client's config directory.
export const clients = Object.freeze(
  SNIPPET_CLIENTS
    .filter(({ kind }) => kind !== 'example')
    .map(({ id, mode, filename }) => ({ id, mode, artifact: filename })),
);

export async function setupClient(clientId, options = {}) {
  const client = clients.find(({ id }) => id === clientId);
  if (!client) {
    throw new Error(`Unsupported client: ${clientId}`);
  }

  const { content } = renderSnippet(clientId, {
    baseUrl: options.baseUrl,
    model: options.model,
  });
  const outputDirectory = path.resolve(
    options.output ?? path.join(process.cwd(), '.free-llm', clientId),
  );
  const artifactPath = path.join(outputDirectory, client.artifact);

  if (options.dryRun) {
    const exists = await stat(artifactPath).then(() => true, () => false);
    return { artifactPath, mode: client.mode, content, written: false, exists };
  }

  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(artifactPath, content, {
      encoding: 'utf8',
      flag: 'wx',
      mode: clientId === 'claude-code' ? 0o755 : 0o644,
    });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new Error(`Generated artifact already exists: ${artifactPath}`);
    }
    throw error;
  }
  if (clientId === 'claude-code') {
    await chmod(artifactPath, 0o755);
  }

  return { artifactPath, mode: client.mode, content, written: true, exists: false };
}
