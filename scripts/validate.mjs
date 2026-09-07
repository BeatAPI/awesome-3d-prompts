import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const prompts = JSON.parse(await readFile(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const ids = new Set();
const slugs = new Set();
const promptHashes = new Set();

for (const item of prompts) {
  if (ids.has(item.id)) throw new Error(`duplicate id: ${item.id}`);
  if (slugs.has(item.slug)) throw new Error(`duplicate slug: ${item.slug}`);
  if (!item.source.url.startsWith('https://')) throw new Error(`invalid source: ${item.id}`);
  if (item.source.platform !== 'X') throw new Error(`non-X source in final catalog: ${item.id}`);
  if (!item.result.preview_source_url.startsWith('https://')) throw new Error(`missing preview: ${item.id}`);
  if (!['exact', 'derived'].includes(item.instruction.fidelity)) throw new Error(`invalid fidelity: ${item.id}`);
  if (item.instruction.text.trim().length < 20) throw new Error(`short prompt: ${item.id}`);
  if (!item.verification.verified_at) throw new Error(`unverified: ${item.id}`);
  if (item.result.local_preview) throw new Error(`non-portable local preview path: ${item.id}`);
  if (!item.result.preview_integrity?.sha256) throw new Error(`missing preview integrity: ${item.id}`);
  const hash = createHash('sha256').update(item.instruction.text).digest('hex');
  if (hash !== item.instruction.sha256) throw new Error(`prompt hash mismatch: ${item.id}`);
  if (promptHashes.has(hash)) throw new Error(`duplicate prompt: ${item.id}`);
  ids.add(item.id); slugs.add(item.slug); promptHashes.add(hash);
}

console.log(`Validated ${prompts.length} source-verified prompts.`);
