import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);
const prompts = JSON.parse(await readFile(new URL('data/prompts.json', root), 'utf8'));
const detailsDir = new URL('details/', root);

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
    description: `${prompts.length} hand-reviewed, source-backed 3D prompts for Blender, Three.js, WebGL, games, CAD, product visualization, and agent workflows—with visual results, original sources, and creator attribution.`,
    browse: `Browse all ${prompts.length} prompts`,
    api: 'Use GPT-6 Astra via API',
    language: '中文说明',
    contribute: 'Contribute a prompt',
    explore: 'Explore by workflow',
    gallery: 'Prompt gallery',
    prompt: 'Prompt',
    model: 'Model',
    engine: 'Engine',
    fidelity: 'Prompt fidelity',
    source: 'Source',
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
    description: `${prompts.length} 条经过人工审核、可追溯来源的 GPT-6 Astra 3D Prompt，覆盖 Blender、Three.js、WebGL、游戏、CAD、产品可视化和 Agent 工作流，并展示真实结果、原始来源和作者署名。`,
    browse: `浏览全部 ${prompts.length} 条 Prompt`,
    api: '通过 API 使用 GPT-6 Astra',
    language: 'English',
    contribute: '贡献 Prompt',
    explore: '按工作流浏览',
    gallery: 'Prompt 案例库',
    prompt: 'Prompt',
    model: '模型',
    engine: '引擎',
    fidelity: 'Prompt 类型',
    source: '来源',
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

function previewPath(item) {
  const extension = item.result.preview_integrity.content_type === 'image/png' ? 'png' : 'jpg';
  return `assets/readme-previews/${item.slug}.${extension}`;
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
    .map((category) => `[${labels.categories[category]} (${categories.get(category).length})](#${category})`)
    .join(' · ');
}

function gallery(language) {
  const labels = copy[language];
  let index = 0;
  return categoryOrder.flatMap((category) => {
    const values = categories.get(category);
    return [
      `<a id="${category}"></a>`,
      '',
      `### ${labels.categories[category]} (${values.length})`,
      '',
      ...values.flatMap((item) => {
        index += 1;
        const engines = item.engines.join(' + ') || (language === 'zh' ? '原始来源未注明' : 'Not specified in source');
        const fidelity = item.instruction.fidelity === 'exact'
          ? (language === 'zh' ? '原文' : 'Exact')
          : (language === 'zh' ? '依据来源整理' : 'Derived from source');
        return [
          `#### ${index}. [${item.title}](details/${item.slug}.md)`,
          '',
          `<a href="${item.source.url}">`,
          `  <img src="./${previewPath(item)}" alt="${escapeHtml(item.title)} result preview" width="700" />`,
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
          `**${labels.source}:** [${item.source.author.name}](${item.source.url}) · [${labels.original}](${item.source.url}) · [${labels.detail}](details/${item.slug}.md)`,
          '',
          '---',
          '',
        ];
      }),
    ];
  }).join('\n');
}

function buildReadme(language) {
  const labels = copy[language];
  const alternateReadme = language === 'zh' ? './README.md' : './README.zh-CN.md';
  const apiUrl = 'https://beatapi.io/gpt-6-astra-api?utm_source=github&utm_medium=readme&utm_campaign=awesome-3d-prompts';
  const sections = [
    '<!-- Generated by scripts/generate.mjs. Edit data/prompts.json or the generator, not this file. -->',
    '',
    '<p align="center">',
    '  <a href="details/storm-race-threejs-638553.md">',
    '    <img src="./assets/readme-previews/storm-race-threejs-638553.jpg" alt="GPT-6 Astra 3D prompt gallery featured result" width="100%" />',
    '  </a>',
    '</p>',
    '',
    `# ${labels.title}`,
    '',
    labels.description,
    '',
    `**[${labels.browse}](#prompt-gallery)** · **[${labels.api}](${apiUrl})** · **[${labels.language}](${alternateReadme})** · **[${labels.contribute}](https://github.com/BeatAPI/awesome-3d-prompts/issues/new?template=prompt.yml)**`,
    '',
    `${prompts.length} source-backed cases · ${categoryOrder.length} workflows · ${prompts.length} visual previews · exact/derived fidelity labels`,
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
      '这里不只罗列 Prompt。每条案例都会展示实际结果预览、可复制的 Prompt 或 Agent 指令、原始作者与帖子、使用的 3D 引擎、核验日期，以及该指令是原文还是根据公开来源整理。',
      '',
      '> GPT-6 Astra 是来源所述工作流使用的模型。BeatAPI 提供模型 API；Blender、Three.js、WebGL、Godot、MCP 服务和渲染工具属于工作流中的独立部分。',
      '',
    );
  } else {
    sections.push(
      '## What makes this collection useful',
      '',
      'This is more than a list of prompt text. Every case shows the visible result, a copyable prompt or agent instruction, the original creator and post, the 3D engine, the verification date, and whether the instruction is exact or derived from the public source.',
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
  );

  if (language === 'zh') {
    sections.push(
      '## 核验方法',
      '',
      `当前版本收录 ${prompts.length} 条通过审核的案例。每条都需要公开来源、明确的 GPT-6 Astra 模型声明、可复制指令和可见结果。我们宁可保留较小但可追溯的合集，也不会为了数量虚构 Prompt。模型归因来自原作者公开说明，不代表所有案例都经过独立复现。`,
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
      `The current release contains ${prompts.length} accepted cases. Every entry needs a public source, an explicit GPT-6 Astra model claim, a copyable instruction, and a visible result. We prefer a smaller traceable collection over invented prompts added to hit a number. Model attribution follows the creator’s public statement; it does not mean every case was independently reproduced.`,
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
for (const item of prompts) {
  const engines = item.engines.join(' + ') || 'Not specified in source';
  const fidelity = item.instruction.fidelity === 'exact' ? 'Exact source instruction' : 'Derived from the public source';
  const body = [
    '<!-- Generated by scripts/generate.mjs. -->',
    '',
    `# ${item.title}`,
    '',
    `<a href="${item.source.url}">`,
    `  <img src="../${previewPath(item)}" alt="${escapeHtml(item.title)} result preview" width="900" />`,
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

await writeFile(new URL('README.md', root), buildReadme('en'));
await writeFile(new URL('README.zh-CN.md', root), buildReadme('zh'));
