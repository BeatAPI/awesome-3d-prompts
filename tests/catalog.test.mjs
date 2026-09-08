import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const prompts = JSON.parse(await readFile(new URL('data/prompts.json', root), 'utf8'));

test('catalog keeps evidence and media boundaries explicit', () => {
  assert.equal(prompts.length, 306);
  assert.equal(prompts.filter((item) => item.result.media_type === 'video').length, 250);
  assert.equal(prompts.filter((item) => item.result.media_type === 'image').length, 56);
  for (const item of prompts) {
    assert.equal(item.model.id, 'gpt-6-astra');
    assert.equal(item.source.platform, 'X');
    assert.ok(item.source.url);
    assert.ok(item.result.preview_source_url);
    assert.equal(item.rights.status, 'review-required');
    assert.equal(item.result.local_preview, undefined);
    assert.equal(item.result.local_video, undefined);
    assert.equal(item.result.video_source_url_used, undefined);
    assert.ok(['exact', 'creator-stated', 'source-stated'].includes(item.instruction.fidelity));
    assert.equal(item.result.preview_integrity.content_type, 'image/webp');
    assert.match(item.result.preview_public_url, /^https:\/\/media\.beatapi\.io\/prompt-gallery\/gpt-6-astra-3d\/[a-z0-9-]+\/(?:image|poster)-[a-f0-9]{12}\.webp$/);
    if (item.result.media_type === 'video') {
      assert.ok(item.result.duration_seconds <= 300, 'videos longer than five minutes must stay excluded');
      assert.equal(item.result.video_integrity.content_type, 'video/webm');
      assert.match(item.result.video_public_url, /^https:\/\/media\.beatapi\.io\/prompt-gallery\/gpt-6-astra-3d\/[a-z0-9-]+\/video-[a-f0-9]{12}\.webm$/);
    }
  }
});

test('generated details surface every result with stable public media links', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8');
  for (const item of prompts) {
    const detail = await readFile(new URL(`details/${item.slug}.md`, root), 'utf8');
    assert.match(detail, new RegExp(item.result.preview_public_url.replaceAll('.', '\\.')));
    if (item.result.video_public_url) {
      assert.match(detail, new RegExp(item.result.video_public_url.replaceAll('.', '\\.')));
    }
    assert.match(detail, new RegExp(item.source.url.replaceAll('.', '\\.')));
  }
  assert.match(readme, /Featured 36/);
  const catalog = await readFile(new URL('catalog/README.md', root), 'utf8');
  assert.match(catalog, /Complete GPT-6 Astra 3D Prompt Catalog/);
  for (const category of ['blender-scenes', 'web-3d', 'game-engines', 'product-visualization', 'cad-3d-printing', '3d-workflow']) {
    const page = await readFile(new URL(`catalog/${category}.md`, root), 'utf8');
    assert.match(page, /\.\.\/details\/[a-z0-9-]+\.md/);
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
  assert.match(readme, /\[Browse all 306 prompts\]\(https:\/\/beatapi\.io\/gpt-6-astra-3d-prompts\?utm_source=github/);
  assert.match(readmeZh, /\[浏览全部 306 条 Prompt\]\(https:\/\/beatapi\.io\/gpt-6-astra-3d-prompts\?utm_source=github/);
  assert.match(readme, /Use GPT-6 Astra via API/);
});
