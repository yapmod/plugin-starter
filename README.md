# Yapmod Plugin Starter

Develop and publish a collection of [Yapmod](https://github.com/yapmod) plugins from one public GitHub repository. Each plugin gets a catalog entry, a JavaScript download and its own stable import URL.

## Develop a plugin

Fork this repository, clone your fork, and run these commands from its root (Node 24 and pnpm 12):

```bash
pnpm install
pnpm dev starter
```

Open the control page printed by the dev server to use hot reload. With a single plugin, `pnpm dev` also works.

Edit `plugins/starter/index.tsx`. To add another plugin, copy `plugins/starter/` to a sibling such as `plugins/weather/`. Give it a distinct name, author, description and version in its own `package.json`, update its settings section ID and code, then run `pnpm dev weather`. Each folder name becomes part of its public URL. Use lowercase letters, digits and hyphens, and keep it stable after publication.

## Build and publish

`pnpm build` type-checks the collection, bundles each entry with the Yapmod CLI and writes `dist/<slug>/plugin.js`, `dist/<slug>/plugin.json` `dist/index.json` and `dist/index.html`. Open the HTML file for a local preview. Set `GITHUB_REPOSITORY=OWNER/REPO` when building locally to preview the import URLs as well. Build output is generated on every run.

1. In your public fork, enable GitHub Actions and select **Settings → Pages → Build and deployment → Source → GitHub Actions**.
2. Push to the default branch, or run **Actions → Plugin catalog → Run workflow** on that branch. The workflow uses the built-in GitHub token. Repository rules must allow it to write the generated `plugin-dist` branch.
3. Open the deployment URL from the workflow to share the catalog. Future pushes rebuild the collection, including added and removed folders.

Visitors can download a plugin’s JavaScript or copy its **Yapmod import URL**. In Yapmod, open **Plugins → Add Plugin**, select **URL**, paste the URL into **Plugin URL** and select **Fetch**. Yapmod reads the manifest and bundle from `https://raw.githubusercontent.com/OWNER/REPO/plugin-dist/<slug>/`.

## Share the collection in Yapmod

Edit `collection.json` at the repository root to set the collection's display name and optional description:

```json
{
  "name": "My Yapmod plugins",
  "description": "A collection of plugins for Yapin."
}
```

Every build generates `dist/index.json` using Yapmod's `schemaVersion: 1` collection format. It lists every built plugin with its name, author, description and relative folder URL. Adding or removing a plugin folder updates the index on the next build; do not edit the generated file.

After publishing, copy **Yapmod collection URL** from the catalog page:

```text
https://raw.githubusercontent.com/OWNER/REPO/plugin-dist/index.json
```

In a Yapmod client with collection support, open **Plugins → Add Plugin → Collection**, paste that URL and select **Add Collection**. Expand the collection group to install individual plugins. Adding a collection does not install or enable its plugins. Use the group's **Refresh** action to fetch new listings.

The workflow publishes the index to both GitHub Pages and `plugin-dist`. Share the GitHub Raw URL for importing into Yapmod because Yapin restricts download hosts. Relative plugin URLs resolve alongside the index, so the file also works when hosted with its plugin folders elsewhere on an allowed host. Local builds without `GITHUB_REPOSITORY` still generate the index and a download link, but omit the published import URLs.

Collection support is introduced in [yapmod/client#102](https://github.com/yapmod/client/pull/102). Older clients can still use individual plugin import URLs and JavaScript downloads.

## TypeScript setup

`@yapmod/types` is installed as a dev dependency and referenced from `tsconfig.json`:

```json
{
  "compilerOptions": {
    "types": ["@yapmod/types/plugin-env"]
  }
}
```

The `plugin-env` entry declares the `yapmod` global, so it is fully typed everywhere in your plugin without imports. It also declares the `@yapmod/ui` module, so component imports type-check even though you never install the UI package.

## Writing Your Plugin

The entry point (`plugins/starter/index.tsx`) exports a **default function** that returns an object with lifecycle hooks. Inside it you have the fully typed `yapmod` API and the shared UI components:

```tsx
import { Input, Section, SettingRow, SettingsPage } from '@yapmod/ui';

interface StarterStorage {
  greeting?: string;
}

const DEFAULT_GREETING = 'Hello, world!';

export default function () {
  const storage = yapmod.storage as StarterStorage;

  return {
    onLoad() {
      yapmod.log('Plugin started!');

      yapmod.settings.registerSection({
        id: 'starter',
        label: 'Starter',
        icon: 'settings',
        render: () => (
          <SettingsPage title="My Plugin" description="Example plugin settings">
            <Section label="Appearance">
              <SettingRow label="Greeting" hint="The text shown when the plugin starts">
                <Input
                  value={storage.greeting ?? DEFAULT_GREETING}
                  onChange={(value) => {
                    storage.greeting = value;
                  }}
                />
              </SettingRow>
            </Section>
          </SettingsPage>
        ),
      });
    },

    onUnload() {
      yapmod.log('Plugin stopped!');
    },
  };
}
```

`onLoad` runs when the plugin starts and `onUnload` runs when it is stopped, so use them to set up and clean up resources.

### UI imports

`@yapmod/ui` is not a dependency. The components ship in the Yapmod client bundle, and `@yapmod/types` provides their typings. The builder rewrites imports like this:

```js
import { Button, Switch } from '@yapmod/ui';
```

into references to the shared runtime object:

```js
const { Button, Switch } = yapmod.ui;
```

The same rewriting applies to `solid-js`, `solid-js/web`, and `solid-js/store`, which keeps a single copy of SolidJS in the page.

The `yapmod` object provides:

- **`yapmod.log()`** — Log messages with a plugin prefix
- **`yapmod.storage`** — Reactive per-plugin storage backed by `localStorage`
- **`yapmod.flushStorage()`** — Persist nested storage changes
- **`yapmod.ui`** — SolidJS UI components (`SettingsPage`, `Section`, `SettingRow`, `Input`, `Button`, `Select`, etc.)
- **`yapmod.settings`** — Register settings sections
- **`yapmod.observe()`** — Watch for DOM elements
- **`yapmod.solid`** — Access to the shared SolidJS instance

Full API documentation is available at [yapmod.dev/docs](https://yapmod.dev/docs).

## Dependencies

- **@yapmod/builder** — Bundles your TypeScript + SolidJS code into the plugin format
- **@yapmod/types** — TypeScript definitions for the plugin API, the `yapmod` global, and `@yapmod/ui`
- **solid-js** — Reactive UI library used by Yapmod plugins
- **typescript** — Type checking for your plugin source
