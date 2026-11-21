import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('build publishes a portable collection index and safe catalog links', async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const fixture = await mkdtemp(join(tmpdir(), 'yapmod-collection-'));
  t.after(() => rm(fixture, { recursive: true, force: true }));
  await cp(join(root, 'scripts'), join(fixture, 'scripts'), { recursive: true });
  await symlink(join(root, 'node_modules'), join(fixture, 'node_modules'), 'dir');
  await writeFile(join(fixture, 'collection.json'), JSON.stringify({
    name: ' Demo <plugins> ', description: 'One & two',
  }));
  for (const slug of ['beta', 'alpha']) {
    await mkdir(join(fixture, 'plugins', slug), { recursive: true });
    await writeFile(join(fixture, 'plugins', slug, 'index.tsx'), 'export default () => ({});');
    await writeFile(join(fixture, 'plugins', slug, 'package.json'), JSON.stringify({
      name: slug, author: 'Test Author', description: `${slug} description`, version: '1.0.0',
    }));
  }
  const build = (repo) => execFileSync(process.execPath, ['scripts/plugins.mjs', 'build'], {
    cwd: fixture,
    env: { ...process.env, GITHUB_REPOSITORY: repo },
    stdio: 'pipe',
  });
  build('owner/fork');
  const index = JSON.parse(await readFile(join(fixture, 'dist/index.json'), 'utf8'));
  assert.equal(index.schemaVersion, 1);
  assert.equal(index.name, 'Demo <plugins>');
  assert.equal(index.description, 'One & two');
  assert.deepEqual(index.plugins.map((plugin) => plugin.url), ['./alpha/', './beta/']);
  for (const entry of index.plugins) {
    const manifest = JSON.parse(await readFile(join(fixture, 'dist', entry.url, 'plugin.json'), 'utf8'));
    assert.deepEqual(entry, {
      name: manifest.name, author: manifest.author, description: manifest.description, url: entry.url,
    });
    assert.ok((await readFile(join(fixture, 'dist', entry.url, 'plugin.js'), 'utf8')).length);
    assert.equal(new URL(entry.url, 'https://raw.githubusercontent.com/owner/fork/plugin-dist/index.json').href,
      `https://raw.githubusercontent.com/owner/fork/plugin-dist/${entry.name}/`);
  }
  const html = await readFile(join(fixture, 'dist/index.html'), 'utf8');
  assert.ok(html.includes('https://raw.githubusercontent.com/owner/fork/plugin-dist/index.json'));
  assert.ok(html.includes('https://raw.githubusercontent.com/owner/fork/plugin-dist/alpha/'));
  assert.ok(html.includes('Demo &lt;plugins&gt;'));
  assert.ok(html.includes('One &amp; two'));

  await rm(join(fixture, 'plugins/beta'), { recursive: true });
  build('');
  const localIndex = JSON.parse(await readFile(join(fixture, 'dist/index.json'), 'utf8'));
  assert.deepEqual(localIndex.plugins, index.plugins.slice(0, 1));
  await assert.rejects(readFile(join(fixture, 'dist/beta/plugin.js')));
  const localHtml = await readFile(join(fixture, 'dist/index.html'), 'utf8');
  assert.ok(localHtml.includes('href="./index.json"'));
  assert.ok(!localHtml.includes('raw.githubusercontent.com'));

  for (const metadata of [{ name: '' }, { name: 'Demo', description: 12 }, null]) {
    await writeFile(join(fixture, 'collection.json'), JSON.stringify(metadata));
    assert.throws(() => build('owner/fork'), /collection.json/);
  }
});
