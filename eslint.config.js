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
          // Wave 3b.ii — widened jsx-attribute instrument. Previously the
          // include list was [] which meant NO string props were audited
          // (jsx-text-only mode). We now explicitly audit the user-visible
          // string props. Excludes are pruned to technical props only:
          //   className/style/styleName → visual, never user copy
          //   type/id/key/name/href/src → identifiers / URLs
          //   role/data-.*/testId/test-id/data-testid → a11y roles + test hooks
          "jsx-attributes": {
            include: ["placeholder", "title", "aria-label", "label"],
            exclude: [
              "className",
              "style",
              "styleName",
              "type",
              "id",
              "key",
              "name",
              "href",
              "src",
              "role",
              "data-.*",
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
  },
  // ─── Wave 1 (sub-batch 1f — FINAL RATCHET) ─────────────────────────
  // Forbid direct display-formatting calls (toLocaleDateString /
  // toLocaleTimeString / toLocaleString) and date-fns display imports
  // (`format`, `formatDistanceToNow`) OUTSIDE src/i18n/. Route through
  // src/i18n/format.ts wrappers so localisation, byte-parity, and
  // quirk-replication live in one place.
  //
  // Severity map:
  //   ERROR — everything under src/ except the ignored surfaces below.
  //   OFF   — src/i18n/** (the wrapper implementation itself),
  //           src/features/admin/**, src/perf/**, tests, mocks,
  //           and the admin/debug/error pages (internal tooling).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/i18n/**",
      "src/features/admin/**",
      "src/perf/**",
      "src/**/*.test.{ts,tsx}",
      "src/test/**",
      "src/mocks/**",
      "src/pages/admin/**",
      "src/pages/**/*Debug*.{ts,tsx}",
      "src/pages/AdminSetupPage.tsx",
      "src/pages/ErrorLogPage.tsx",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='toLocaleDateString']",
          message: "Use a wrapper from src/i18n/format.ts (e.g. formatDayMonthYearShortGB) instead of Date.prototype.toLocaleDateString().",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleTimeString']",
          message: "Use a wrapper from src/i18n/format.ts (e.g. formatTimeHm) instead of Date.prototype.toLocaleTimeString().",
        },
        {
          selector: "CallExpression[callee.property.name='toLocaleString']",
          message: "Use formatNumber() or another wrapper from src/i18n/format.ts instead of toLocaleString().",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "date-fns",
              importNames: ["format", "formatDistanceToNow"],
              message: "Import the equivalent wrapper from '@/i18n/format' instead of date-fns display helpers.",
            },
          ],
        },
      ],
    },
  },
  // ─── Wave 3a.ii — scope-dir ERROR flip for auth ────────────────────
  // Auth surface is literal-clean; upgrade to ERROR so regressions block.
  // Composer + post-v2 remain WARN pending mid-redesign settle.
  {
    files: ["src/pages/auth/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": "error",
    },
  },
  // ─── Wave 3b — scope-dir ERROR flip for messaging ─────────────────
  {
    files: ["src/pages/messaging-v2/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": "error",
    },
  }
);

