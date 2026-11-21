import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const folders = (await readdir('plugins', { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
if (!folders.length) throw new Error('Add a plugin in plugins/<slug> first.');
for (const slug of folders) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Invalid plugin folder "${slug}". Use lowercase letters, digits and hyphens.`);
  }
}

const builder = 'node_modules/@yapmod/builder';
const { bin } = JSON.parse(await readFile(join(builder, 'package.json'), 'utf8'));
function run(command, slug, ...options) {
  execFileSync(process.execPath, [
    join(builder, bin.yapmod), command, '--entry', `plugins/${slug}/index.tsx`, ...options,
  ], { stdio: 'inherit' });
}

const [command, selected, ...options] = process.argv.slice(2);
if (command === 'dev') {
  const slug = selected ?? (folders.length === 1 ? folders[0] : undefined);
  if (!folders.includes(slug)) throw new Error(`Choose a plugin: pnpm dev <${folders.join('|')}>`);
  run('dev', slug, ...options);
} else if (command === 'build') {
  await buildCatalog();
} else {
  throw new Error('Expected build or dev.');
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function buildCatalog() {
  const metadata = JSON.parse(await readFile('collection.json', 'utf8'));
  if (typeof metadata?.name !== 'string' || !metadata.name.trim()) {
    throw new Error('collection.json: provide a non-empty string for name.');
  }
  if (metadata.description !== undefined && typeof metadata.description !== 'string') {
    throw new Error('collection.json: description must be a string.');
  }
  const collection = {
    schemaVersion: 1,
    name: metadata.name.trim(),
    description: metadata.description?.trim() ?? '',
    plugins: [],
  };
  const cards = [];
  await rm('dist', { recursive: true, force: true });
  for (const slug of folders) {
    const file = `plugins/${slug}/package.json`;
    const metadata = JSON.parse(await readFile(file, 'utf8'));
    const manifest = {};
    for (const key of ['name', 'author', 'description', 'version']) {
      if (typeof metadata[key] !== 'string' || !metadata[key].trim()) {
        throw new Error(`${file}: provide a non-empty string for ${key}.`);
      }
      manifest[key] = metadata[key].trim();
    }

    const bundle = `dist/${slug}/plugin.js`;
    run('build', slug, '--outfile', bundle);
    manifest.hash = createHash('sha256').update(await readFile(bundle)).digest('hex');
    await writeFile(`dist/${slug}/plugin.json`, JSON.stringify(manifest, null, 2) + '\n');
    collection.plugins.push({
      name: manifest.name,
      author: manifest.author,
      description: manifest.description,
      url: `./${slug}/`,
    });

    const repo = process.env.GITHUB_REPOSITORY;
    const url = repo && `https://raw.githubusercontent.com/${repo}/plugin-dist/${slug}/`;
    cards.push(`<article>
      <h2>${escapeHtml(manifest.name)}</h2>
      <small>v${escapeHtml(manifest.version)} · ${escapeHtml(manifest.author)}</small>
      <p>${escapeHtml(manifest.description)}</p>
      <a href="./${slug}/plugin.js" download="${slug}.js">Download JavaScript</a>
      ${url ? `<label>Yapmod import URL<input readonly value="${escapeHtml(url)}" onclick="this.select()"></label>` : ''}
    </article>`);
  }
  await writeFile('dist/index.json', JSON.stringify(collection, null, 2) + '\n');
  const template = await readFile(new URL('./catalog.html', import.meta.url), 'utf8');
  const repo = process.env.GITHUB_REPOSITORY;
  const collectionUrl = repo && `https://raw.githubusercontent.com/${repo}/plugin-dist/index.json`;
  const introduction = `<h1>${escapeHtml(collection.name)}</h1>
    <p>${escapeHtml(collection.description)}</p>
    <p>Download individual plugins or add the whole collection in <strong>Plugins → Add Plugin → Collection</strong>.</p>
    ${collectionUrl ? `<label>Yapmod collection URL<input readonly value="${escapeHtml(collectionUrl)}" onclick="this.select()"></label>` : '<p>Publish this catalog to get a collection import URL.</p>'}
    <p><a href="./index.json" download="index.json">Download collection index</a></p>`;
  await writeFile('dist/index.html', template
    .replace('<!-- collection -->', () => introduction)
    .replace('<!-- plugins -->', () => cards.join('\n')));
}
