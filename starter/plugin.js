(function () {
"use strict";
var yapmodPlugin = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // plugins/starter/index.tsx
  var index_exports = {};
  __export(index_exports, {
    default: () => index_default
  });
  var {
    createComponent: _$createComponent
  } = yapmod.solidWeb;
  var {
    memo: _$memo
  } = yapmod.solidWeb;
  var {
    Input,
    Section,
    SettingRow,
    SettingsPage
  } = yapmod.ui;
  var DEFAULT_GREETING = "Hello, world!";
  function index_default() {
    const storage = yapmod.storage;
    return {
      onLoad() {
        yapmod.log("Plugin started!");
        yapmod.settings.registerSection({
          id: "starter",
          label: "Starter",
          icon: "settings",
          render: () => _$createComponent(SettingsPage, {
            title: "My Plugin",
            description: "Example plugin settings",
            get children() {
              return _$createComponent(Section, {
                label: "Appearance",
                get children() {
                  return _$createComponent(SettingRow, {
                    label: "Greeting",
                    hint: "The text shown when the plugin starts",
                    get children() {
                      return _$createComponent(Input, {
                        get value() {
                          return storage.greeting ?? DEFAULT_GREETING;
                        },
                        onChange: (value) => {
                          storage.greeting = value;
                        }
                      });
                    }
                  });
                }
              });
            }
          })
        });
      },
      onUnload() {
        yapmod.log("Plugin stopped!");
      }
    };
  }
  return __toCommonJS(index_exports);
})();

;const plugin = typeof yapmodPlugin !== 'undefined'
  ? yapmodPlugin.default ?? yapmodPlugin
  : undefined;
if (plugin === undefined) {
  throw new Error(
    'yapmod: bundle has no default export; export the plugin with `export default`.',
  );
}
return plugin;
})();
