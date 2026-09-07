import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('..', import.meta.url);
const prompts = JSON.parse(await readFile(new URL('data/prompts.json', root), 'utf8'));

test('catalog keeps evidence boundaries explicit', () => {
  assert.equal(prompts.length, 29);
  for (const item of prompts) {
    assert.equal(item.model.id, 'gpt-6-astra');
    assert.equal(item.source.platform, 'X');
    assert.ok(item.source.url);
    assert.ok(item.result.preview_source_url);
    assert.equal(item.rights.status, 'review-required');
    assert.equal(item.result.local_preview, undefined);
  }
});

test('generated readmes expose one primary funnel', async () => {
  const readme = await readFile(new URL('README.md', root), 'utf8');
  assert.match(readme, /Browse the visual 3D Prompt Gallery on BeatAPI/);
  assert.match(readme, /29 accepted cases toward a target of 50/);
});
