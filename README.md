# Yapmod Plugin Starter

A starter template for building [Yapmod](https://github.com/yapmod) plugins with TypeScript and SolidJS.

## Quick Start

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Or develop with hot reload
pnpm dev

# Type-check without building
pnpm typecheck
```

## Project Structure

```
├── src/
│   └── index.tsx     # Your plugin entry point
├── dist/             # Built output (generated)
├── package.json
├── tsconfig.json
└── README.md
```

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

The entry point (`src/index.tsx`) exports a **default function** that returns an object with lifecycle hooks. Inside it you have the fully typed `yapmod` API and the shared UI components:

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

## Building

```bash
pnpm build
```

This produces a single `dist/index.js` file that you can upload to Yapmod.

## Developing

```bash
pnpm dev
```

Watches for file changes and rebuilds automatically.

## Dependencies

- **@yapmod/builder** — Bundles your TypeScript + SolidJS code into the plugin format
- **@yapmod/types** — TypeScript definitions for the plugin API, the `yapmod` global, and `@yapmod/ui`
- **solid-js** — Reactive UI library used by Yapmod plugins
- **typescript** — Type checking for your plugin source
