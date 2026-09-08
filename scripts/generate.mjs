import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const prompts = JSON.parse(await readFile(new URL('data/prompts.json', root), 'utf8'));
const detailsDir = new URL('details/', root);
const catalogDir = new URL('catalog/', root);
const videoCount = prompts.filter((item) => item.result.media_type === 'video').length;
const imageCount = prompts.length - videoCount;
const fidelityCounts = Object.groupBy(prompts, (item) => item.instruction.fidelity);

const categoryOrder = [
  'blender-scenes',
  'web-3d',
  'game-engines',
  'product-visualization',
  'cad-3d-printing',
  '3d-workflow',
];

const copy = {
  en: {
    title: 'Awesome GPT-6 Astra 3D Prompts',
    description: `${prompts.length} hand-reviewed, source-backed GPT-6 Astra 3D prompts and stated instructions for Blender, Three.js, WebGL, games, CAD, product visualization, and agent workflows—with visual results and creator attribution.`,
    browse: `Browse all ${prompts.length} prompts`,
    api: 'Use GPT-6 Astra via API',
    language: '中文说明',
    contribute: 'Contribute a prompt',
    explore: 'Explore by workflow',
    gallery: 'Featured 36',
    prompt: 'Prompt',
    model: 'Model',
    engine: 'Engine',
    fidelity: 'Prompt fidelity',
    source: 'Source',
    stats: `${prompts.length} source-backed cases · ${categoryOrder.length} workflows · ${videoCount} WebM videos · ${imageCount} WebP images · ${fidelityCounts.exact?.length ?? 0} verbatim · ${fidelityCounts['creator-stated']?.length ?? 0} creator-stated · ${fidelityCounts['source-stated']?.length ?? 0} source-stated`,
    original: 'Original post and result',
    detail: 'Full evidence and rights notes',
    categories: {
      'blender-scenes': 'Blender Scenes',
      'web-3d': 'Web 3D',
      'game-engines': 'Game Engines',
      'product-visualization': 'Product Visualization',
      'cad-3d-printing': 'CAD & 3D Printing',
      '3d-workflow': 'Agent Workflows',
    },
  },
  zh: {
    title: 'Awesome GPT-6 Astra 3D Prompts 中文版',
    description: `${prompts.length} 条经过人工审核、可追溯 X 来源的 GPT-6 Astra 3D Prompt 与明确陈述的制作指令，覆盖 Blender、Three.js、WebGL、游戏、CAD、产品可视化和 Agent 工作流，并展示真实结果与作者署名。`,
    browse: `浏览全部 ${prompts.length} 条 Prompt`,
    api: '通过 API 使用 GPT-6 Astra',
    language: 'English',
    contribute: '贡献 Prompt',
    explore: '按工作流浏览',
    gallery: '精选 36 条',
    prompt: 'Prompt',
    model: '模型',
    engine: '引擎',
    fidelity: 'Prompt 类型',
    source: '来源',
    stats: `${prompts.length} 条来源可追溯案例 · ${categoryOrder.length} 类工作流 · ${videoCount} 段 WebM 视频 · ${imageCount} 张 WebP 图片 · ${fidelityCounts.exact?.length ?? 0} 条逐字原文 · ${fidelityCounts['creator-stated']?.length ?? 0} 条作者陈述 · ${fidelityCounts['source-stated']?.length ?? 0} 条来源陈述`,
    original: '原始帖子与结果',
    detail: '完整证据与版权说明',
    categories: {
      'blender-scenes': 'Blender 场景',
      'web-3d': 'Web 3D',
      'game-engines': '游戏引擎',
      'product-visualization': '产品可视化',
      'cad-3d-printing': 'CAD 与 3D 打印',
      '3d-workflow': 'Agent 工作流',
    },
  },
};

const categories = new Map(categoryOrder.map((category) => [category, []]));
for (const prompt of prompts) {
  const values = categories.get(prompt.category) ?? [];
  values.push(prompt);
  categories.set(prompt.category, values);
}
const featuredPrompts = categoryOrder.flatMap((category) => categories.get(category).slice(0, 6));

function previewPath(item) {
  return item.result.preview_public_url;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function excerpt(value, maxLength = 180) {
  const compact = value.replaceAll(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, maxLength - 1).trimEnd()}…`;
}

function categoryNavigation(language) {
  const labels = copy[language];
  return categoryOrder
    .map((category) => `[${labels.categories[category]} (${categories.get(category).length})](catalog/${category}.md)`)
    .join(' · ');
}

function gallery(language, values = featuredPrompts, detailPrefix = 'details') {
  const labels = copy[language];
  let index = 0;
  return [
      ...values.flatMap((item) => {
        index += 1;
        const engines = item.engines.join(' + ') || (language === 'zh' ? '原始来源未注明' : 'Not specified in source');
        const fidelityLabels = language === 'zh'
          ? { exact: '逐字原文', 'creator-stated': '作者明确陈述', 'source-stated': '来源明确陈述' }
          : { exact: 'Verbatim', 'creator-stated': 'Creator-stated', 'source-stated': 'Source-stated' };
        const fidelity = fidelityLabels[item.instruction.fidelity];
        return [
          `#### ${index}. [${item.title}](${detailPrefix}/${item.slug}.md)`,
          '',
          `<a href="${item.source.url}">`,
          `  <img src="${previewPath(item)}" alt="${escapeHtml(item.title)} result preview" width="700" />`,
          '</a>',
          '',
          item.effect_summary,
          '',
          '<details>',
          `<summary><strong>${labels.prompt}</strong> — ${escapeHtml(excerpt(item.instruction.text))}</summary>`,
          '',
          '~~~~text',
          item.instruction.text,
          '~~~~',
          '',
          '</details>',
          '',
          `**${labels.model}:** ${item.model.label} · **${labels.engine}:** ${engines} · **${labels.fidelity}:** ${fidelity}`,
          '',
          `**${labels.source}:** [${item.source.author.name}](${item.source.url}) · [${labels.original}](${item.source.url}) · [${labels.detail}](${detailPrefix}/${item.slug}.md)`,
          '',
          '---',
          '',
        ];
      }),
    ].join('\n');
}

function buildReadme(language) {
  const labels = copy[language];
  const alternateReadme = language === 'zh' ? './README.md' : './README.zh-CN.md';
  const galleryUrl = 'https://beatapi.io/gpt-6-astra-3d-prompts?utm_source=github&utm_medium=readme&utm_campaign=awesome-3d-prompts';
  const apiUrl = 'https://beatapi.io/gpt-6-astra-api?utm_source=github&utm_medium=readme&utm_campaign=awesome-3d-prompts';
  const sections = [
    '<!-- Generated by scripts/generate.mjs. Edit data/prompts.json or the generator, not this file. -->',
    '',
    '<p align="center">',
    '  <img src="./assets/readme-hero.webp" alt="GPT-6 Astra 3D Prompt Gallery" width="100%" />',
    '</p>',
    '',
    `# ${labels.title}`,
    '',
    labels.description,
    '',
    `**[${labels.browse}](${galleryUrl})** · **[${labels.api}](${apiUrl})** · **[${labels.language}](${alternateReadme})** · **[${labels.contribute}](https://github.com/BeatAPI/awesome-3d-prompts/issues/new?template=prompt.yml)**`,
    '',
    labels.stats,
    '',
    `## ${labels.explore}`,
    '',
    categoryNavigation(language),
    '',
  ];

  if (language === 'zh') {
    sections.push(
      '## 这个合集有什么不同',
      '',
      '这里不只罗列 Prompt。每条案例都会展示实际结果预览、公开 Prompt 或明确陈述的制作指令、原始作者与帖子、使用的 3D 引擎和核验日期，并标注证据层级。',
      '',
      '> GPT-6 Astra 是来源所述工作流使用的模型。BeatAPI 提供模型 API；Blender、Three.js、WebGL、Godot、MCP 服务和渲染工具属于工作流中的独立部分。',
      '',
    );
  } else {
    sections.push(
      '## What makes this collection useful',
      '',
      'This is more than a list of prompt text. Every case pairs a publicly stated prompt or instruction with its visible result, original post, creator attribution, 3D workflow, and verification date. Fidelity labels distinguish verbatim prompts from creator- or source-stated instructions.',
      '',
      '> GPT-6 Astra identifies the model used in the cited workflow. BeatAPI provides model API access; Blender, Three.js, WebGL, Godot, MCP servers, and rendering tools remain separate parts of the workflow.',
      '',
    );
  }

  sections.push(
    '<a id="prompt-gallery"></a>',
    '',
    `## ${labels.gallery}`,
    '',
    gallery(language),
    '',
    language === 'zh'
      ? `**[查看 GitHub 完整 ${prompts.length} 条目录](catalog/README.md)** · **[在 BeatAPI 可视化浏览全部案例](${galleryUrl})**`
      : `**[Open the complete ${prompts.length}-item GitHub catalog](catalog/README.md)** · **[Browse every result visually on BeatAPI](${galleryUrl})**`,
  );

  if (language === 'zh') {
    sections.push(
      '## 核验方法',
      '',
      `当前版本收录 ${prompts.length} 条通过审核的案例。每条都需要公开 X 来源、GPT-6 Astra 模型证据、公开 Prompt 或明确陈述的制作指令，以及可见结果。我们不会为了数量补写或反推 Prompt。Prompt fidelity 字段区分逐字原文、作者明确陈述与来源明确陈述；模型归因来自公开来源，不代表所有案例都经过独立复现。`,
      '',
      '## 更多 BeatAPI Prompt 合集',
      '',
      '- [Awesome MiniMax H3 Prompts](https://github.com/BeatAPI/awesome-minimax-h3-prompts)',
      '- [Awesome Seedance 2.5 Prompts](https://github.com/BeatAPI/awesome-seedance-2-5-prompts)',
      '- [GPT-6 Astra API](https://beatapi.io/gpt-6-astra-api)',
      '',
      '## 贡献与版权',
      '',
      '新增条目必须提供公开来源、可复制 Prompt 或 Agent 指令、明确的模型声明与可见结果。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。',
      '',
      'MIT 许可证只覆盖本仓库原创工具与编辑结构。来源 Prompt 和媒体保留各自原始权利，详见 [RIGHTS.md](RIGHTS.md)。',
      '',
    );
  } else {
    sections.push(
      '## Verification methodology',
      '',
      `The current release contains ${prompts.length} accepted cases. Every entry needs a public X source, GPT-6 Astra model evidence, a publicly stated prompt or production instruction, and a visible result. We do not reconstruct prompts merely to hit a number. The prompt fidelity field distinguishes verbatim, creator-stated, and source-stated instructions. Model attribution follows public evidence; it does not mean every case was independently reproduced.`,
      '',
      '## More prompt collections from BeatAPI',
      '',
      '- [Awesome MiniMax H3 Prompts](https://github.com/BeatAPI/awesome-minimax-h3-prompts)',
      '- [Awesome Seedance 2.5 Prompts](https://github.com/BeatAPI/awesome-seedance-2-5-prompts)',
      '- [GPT-6 Astra API](https://beatapi.io/gpt-6-astra-api)',
      '',
      '## Contributing and rights',
      '',
      'New entries need a public source, a copyable prompt or agent instruction, an explicit model claim, and a visible result. Read [CONTRIBUTING.md](CONTRIBUTING.md).',
      '',
      'The MIT license covers this repository’s original tooling and editorial structure only. Source prompts and media retain their original rights; see [RIGHTS.md](RIGHTS.md).',
      '',
    );
  }

  return sections.join('\n');
}

await rm(detailsDir, { recursive: true, force: true });
await mkdir(detailsDir, { recursive: true });
await rm(catalogDir, { recursive: true, force: true });
await mkdir(catalogDir, { recursive: true });
for (const item of prompts) {
  const engines = item.engines.join(' + ') || 'Not specified in source';
  const fidelity = {
    exact: 'Verbatim source instruction',
    'creator-stated': 'Creator-stated instruction',
    'source-stated': 'Source-stated instruction',
  }[item.instruction.fidelity];
  const body = [
    '<!-- Generated by scripts/generate.mjs. -->',
    '',
    `# ${item.title}`,
    '',
    `<a href="${item.source.url}">`,
    `  <img src="${previewPath(item)}" alt="${escapeHtml(item.title)} result preview" width="900" />`,
    '</a>',
    '',
    item.effect_summary,
    '',
    `- **Model:** ${item.model.label}`,
    `- **Engine:** ${engines}`,
    `- **Category:** ${copy.en.categories[item.category]}`,
    `- **Prompt fidelity:** ${fidelity}`,
    `- **Source checked:** ${item.verification.verified_at}`,
    `- **Creator:** [${item.source.author.name}](${item.source.url})`,
    `- **Rights:** ${item.rights.status}; preview and prompt retain source attribution`,
    '',
    '## Prompt',
    '',
    '~~~~text',
    item.instruction.text,
    '~~~~',
    '',
    '## Original result and attribution',
    '',
    `[View the original post and result on X](${item.source.url})`,
    ...(item.result.video_public_url ? ['', `[Watch the optimized WebM result](${item.result.video_public_url})`] : []),
    '',
    '## Run it with GPT-6 Astra',
    '',
    '[Open GPT-6 Astra API](https://beatapi.io/gpt-6-astra-api?utm_source=github&utm_medium=detail&utm_campaign=awesome-3d-prompts)',
    '',
    '> BeatAPI provides model API access. The 3D application, MCP integration, assets, and rendering pipeline remain separate parts of the workflow.',
    '',
    '[← Back to the full prompt gallery](../README.md#prompt-gallery)',
    '',
  ].join('\n');
  await writeFile(new URL(`details/${item.slug}.md`, root), body);
}

const catalogIndex = [
  '# Complete GPT-6 Astra 3D Prompt Catalog',
  '',
  `${prompts.length} source-backed prompt/result pairs. Open a workflow page below or use the [visual BeatAPI gallery](https://beatapi.io/gpt-6-astra-3d-prompts?utm_source=github&utm_medium=catalog&utm_campaign=awesome-3d-prompts).`,
  '',
  ...categoryOrder.map((category) => `- [${copy.en.categories[category]} (${categories.get(category).length})](./${category}.md)`),
  '',
  '[← Back to README](../README.md)',
  '',
].join('\n');
await writeFile(new URL('README.md', catalogDir), catalogIndex);

for (const category of categoryOrder) {
  const values = categories.get(category);
  const body = [
    `# ${copy.en.categories[category]} — ${values.length} prompts`,
    '',
    `[← Complete catalog](./README.md) · [Visual gallery](https://beatapi.io/gpt-6-astra-3d-prompts?utm_source=github&utm_medium=catalog&utm_campaign=awesome-3d-prompts)`,
    '',
    gallery('en', values, '../details'),
  ].join('\n');
  await writeFile(new URL(`${category}.md`, catalogDir), body);
}

await writeFile(new URL('README.md', root), buildReadme('en'));
await writeFile(new URL('README.zh-CN.md', root), buildReadme('zh'));
