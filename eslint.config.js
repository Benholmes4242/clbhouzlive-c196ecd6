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
  },
  // ─── Wave 1: format-drift lint guard ─────────────────────────────────
  // Forbid direct display-formatting calls (toLocaleDateString /
  // toLocaleTimeString / toLocaleString) and date-fns display imports
  // (`format`, `formatDistanceToNow`) OUTSIDE src/i18n/. Route through
  // src/i18n/format.ts wrappers so localisation, byte-parity, and
  // quirk-replication live in one place. Severity split per Wave 1
  // burn-down: ERROR on already-swept scope dirs, WARN elsewhere until
  // sub-batch 1f completes.
  {
    // Warn everywhere first, then error-only override below picks up
    // paths we've fully cleaned.
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/i18n/**",
      "src/features/admin/**",
      "src/perf/**",
      "src/**/*.test.{ts,tsx}",
      "src/test/**",
      "src/mocks/**",
    ],
    rules: {
      "no-restricted-syntax": [
        "warn",
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
        "warn",
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
  // Error-level for paths already swept in Waves 1a–1e + tourhub.
  {
    files: [
      "src/components/courses/**/*.{ts,tsx}",
      "src/components/championship/**/*.{ts,tsx}",
      "src/components/leaderboard/**/*.{ts,tsx}",
      "src/components/leaderboards/**/*.{ts,tsx}",
      "src/components/course-media-tab/**/*.{ts,tsx}",
      "src/components/top100/**/*.{ts,tsx}",
      "src/components/profile/**/*.{ts,tsx}",
      "src/components/profile-v2/**/*.{ts,tsx}",
      "src/components/settings/**/*.{ts,tsx}",
      "src/components/achievements/**/*.{ts,tsx}",
      "src/components/quest/**/*.{ts,tsx}",
      "src/components/business/**/*.{ts,tsx}",
      "src/components/explore-tab-new/**/*.{ts,tsx}",
      "src/features/tourhub/**/*.{ts,tsx}",
      "src/pages/**/*.{ts,tsx}",
    ],
    ignores: [
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
  }
);
