import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      i18next,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // i18n WAVE 0: warn-only global ratchet. We flip warn → error path by
      // path as each feature vertical is extracted. Ignored surfaces:
      // className / style / testid props, imports, console.*, analytics
      // event names, admin, perf harnesses, and tests.
      "i18next/no-literal-string": [
        "warn",
        {
          mode: "jsx-text-only",
          "should-validate-template": false,
          "jsx-attributes": {
            include: [],
            exclude: [
              "className",
              "style",
              "styleName",
              "type",
              "id",
              "key",
              "href",
              "src",
              "alt",
              "role",
              "data-.*",
              "aria-.*",
              "testId",
              "test-id",
              "data-testid",
            ],
          },
          callees: {
            exclude: [
              "i18n(ext)?",
              "t",
              "require",
              "addEventListener",
              "removeEventListener",
              "postMessage",
              "getElementById",
              "dispatch",
              "commit",
              "includes",
              "indexOf",
              "endsWith",
              "startsWith",
              "console\\.(log|warn|error|info|debug)",
              "track",
              "logEvent",
              "captureEvent",
            ],
          },
          words: {
            exclude: ["[0-9!-/:-@[-`{-~]+", "[A-Z_-]+"],
          },
        },
      ],
    },
  },
  {
    files: [
      "src/features/admin/**/*.{ts,tsx}",
      "src/perf/**/*.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "src/test/**/*.{ts,tsx}",
      "src/mocks/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": "off",
    },
  }
);
