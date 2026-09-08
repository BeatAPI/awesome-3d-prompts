import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const prompts = JSON.parse(await readFile(new URL('../data/prompts.json', import.meta.url), 'utf8'));
const ids = new Set();
const slugs = new Set();
const promptHashes = new Set();

function validateMediaUrl(item, kind, url, integrity, extension) {
  const parsed = new URL(url);
  if (parsed.origin !== 'https://media.beatapi.io') throw new Error(`invalid ${kind} origin: ${item.id}`);
  const escapedSlug = item.slug.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const expected = new RegExp(`^/prompt-gallery/gpt-6-astra-3d/${escapedSlug}/${kind}-${integrity.sha256.slice(0, 12)}\\.${extension}$`);
  if (!expected.test(parsed.pathname)) throw new Error(`invalid ${kind} path: ${item.id}`);
}

for (const item of prompts) {
  if (ids.has(item.id)) throw new Error(`duplicate id: ${item.id}`);
  if (slugs.has(item.slug)) throw new Error(`duplicate slug: ${item.slug}`);
  if (!item.source.url.startsWith('https://')) throw new Error(`invalid source: ${item.id}`);
  if (item.source.platform !== 'X') throw new Error(`non-X source in final catalog: ${item.id}`);
  if (!item.result.preview_source_url.startsWith('https://')) throw new Error(`missing source preview: ${item.id}`);
  if (!item.result.preview_public_url?.startsWith('https://media.beatapi.io/')) throw new Error(`missing public WebP: ${item.id}`);
  if (item.result.preview_integrity?.content_type !== 'image/webp') throw new Error(`non-WebP preview: ${item.id}`);
  if (!['exact', 'creator-stated', 'source-stated'].includes(item.instruction.fidelity)) throw new Error(`invalid prompt fidelity: ${item.id}`);
  if (item.instruction.text.trim().length < 20) throw new Error(`short prompt: ${item.id}`);
  if (!item.verification.verified_at) throw new Error(`unverified: ${item.id}`);
  if (item.result.local_preview) throw new Error(`non-portable local preview path: ${item.id}`);
  if (!item.result.preview_integrity?.sha256) throw new Error(`missing preview integrity: ${item.id}`);
  validateMediaUrl(
    item,
    item.result.media_type === 'video' ? 'poster' : 'image',
    item.result.preview_public_url,
    item.result.preview_integrity,
    'webp',
  );
  if (item.result.media_type === 'video') {
    if (!Number.isFinite(item.result.duration_seconds) || item.result.duration_seconds > 300) throw new Error(`video exceeds five-minute policy: ${item.id}`);
    if (!item.result.video_public_url?.startsWith('https://media.beatapi.io/')) throw new Error(`missing public WebM: ${item.id}`);
    if (item.result.video_integrity?.content_type !== 'video/webm') throw new Error(`non-WebM video: ${item.id}`);
    validateMediaUrl(item, 'video', item.result.video_public_url, item.result.video_integrity, 'webm');
  }
  const hash = createHash('sha256').update(item.instruction.text).digest('hex');
  if (hash !== item.instruction.sha256) throw new Error(`prompt hash mismatch: ${item.id}`);
  if (promptHashes.has(hash)) throw new Error(`duplicate prompt: ${item.id}`);
  ids.add(item.id); slugs.add(item.slug); promptHashes.add(hash);
}

console.log(`Validated ${prompts.length} source-verified prompts.`);
