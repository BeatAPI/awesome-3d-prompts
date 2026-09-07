import { readFile, writeFile } from 'node:fs/promises';

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error('Usage: npm run import-source -- /path/to/catalog.json');

const source = JSON.parse(await readFile(sourcePath, 'utf8'));
const portable = source.map((item) => {
  const {
    local_preview: localPreview,
    local_video: localVideo,
    ...result
  } = item.result;
  return {
    ...item,
    result: {
      ...result,
      preview_integrity: localPreview ? {
        sha256: localPreview.sha256,
        bytes: localPreview.bytes,
        content_type: localPreview.content_type,
        width: localPreview.width,
        height: localPreview.height,
      } : undefined,
      video_integrity: localVideo ? {
        sha256: localVideo.sha256,
        bytes: localVideo.bytes,
        content_type: localVideo.content_type,
        width: localVideo.width,
        height: localVideo.height,
        duration_seconds: localVideo.duration_seconds,
      } : undefined,
    },
  };
});

await writeFile(new URL('../data/prompts.json', import.meta.url), `${JSON.stringify(portable, null, 2)}\n`);
console.log(`Imported ${portable.length} portable prompt records.`);
