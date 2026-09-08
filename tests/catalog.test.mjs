import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const prompts = JSON.parse(await readFile(new URL('data/prompts.json', root), 'utf8'));

test('catalog keeps evidence boundaries explicit', () => {
  assert.equal(prompts.length, 38);
  for (const item of prompts) {
    assert.equal(item.model.id, 'gpt-6-astra');
    assert.equal(item.source.platform, 'X');
    assert.ok(item.source.url);
    assert.ok(item.result.preview_source_url);
    assert.equal(item.rights.status, 'review-required');
    assert.equal(item.result.local_preview, undefined);
    assert.equal(item.instruction.fidelity, 'exact');
  }
});

test('generated readmes surface every result with a stable local preview', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8');
  for (const item of prompts) {
    const extension = item.result.preview_integrity.content_type === 'image/png' ? 'png' : 'jpg';
    const relativePath = `assets/readme-previews/${item.slug}.${extension}`;
    await access(new URL(relativePath, root));
    assert.match(readme, new RegExp(relativePath.replaceAll('.', '\\.') ));

    const preview = await readFile(new URL(relativePath, root));
    assert.equal(
      createHash('sha256').update(preview).digest('hex'),
      item.result.preview_integrity.sha256,
      `preview hash mismatch: ${item.slug}`,
    );

    const detail = await readFile(new URL(`details/${item.slug}.md`, root), 'utf8');
    assert.match(detail, new RegExp(`\.\./${relativePath.replaceAll('.', '\\.')}`));
    assert.match(detail, new RegExp(item.source.url.replaceAll('.', '\\.')));
  }
});

test('the public contribution link opens a structured prompt submission form', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8');
  assert.match(readme, /issues\/new\?template=prompt\.yml/);
  await access(new URL('.github/ISSUE_TEMPLATE/prompt.yml', root));
});

test('the generated first screen links to the live Astra 3D gallery', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8');
  const readmeZh = await readFile(new URL('README.zh-CN.md', root), 'utf8');
  assert.match(readme, /^# Awesome GPT-6 Astra 3D Prompts$/m);
  assert.match(readme, /assets\/readme-hero\.webp/);
  assert.match(readmeZh, /assets\/readme-hero\.webp/);
  await access(new URL('assets/readme-hero.webp', root));
  assert.match(readme, /\[Browse all 38 prompts\]\(https:\/\/beatapi\.io\/gpt-6-astra-3d-prompts\?utm_source=github/);
  assert.match(readmeZh, /\[浏览全部 38 条 Prompt\]\(https:\/\/beatapi\.io\/gpt-6-astra-3d-prompts\?utm_source=github/);
  assert.match(readme, /Use GPT-6 Astra via API/);
});
