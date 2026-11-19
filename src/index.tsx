import { Input, Section, SettingRow, SettingsPage } from '@yapmod/ui';

/** Shape of the data this plugin keeps in `yapmod.storage`. */
interface StarterStorage {
  greeting?: string;
}

const DEFAULT_GREETING = 'Hello, world!';

export default function () {
  // `yapmod.storage` is typed as `Record<string, unknown>`, so assert the
  // shape once and use the typed view everywhere else.
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
                  // Top-level storage writes persist on their own, and the
                  // value stays reactive because storage is proxied.
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
