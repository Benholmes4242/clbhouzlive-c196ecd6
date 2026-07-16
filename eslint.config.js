import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

// Wave 3b.iii — single source of truth for the i18next/no-literal-string
// options (project-wide WARN + scope-dir ERROR overrides).
const i18nLiteralOptions = {
  mode: "jsx-text-only",
  "should-validate-template": false,
  "jsx-attributes": {
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
};

// Wave 3b.iii — user-visible attribute guard for gated scopes.
// Diagnosis: eslint-plugin-i18next's `jsx-text-only` mode never scans
// JSX attributes, and `jsx-only` mode has no include-list — it fires
// on every prop (color/side/fill/reportType/etc). Substitute a
// targeted no-restricted-syntax selector that flags string-literal
// values on exactly the five user-visible attributes we care about.
// Values without a lowercase letter (empty strings, ALL_CAPS tokens)
// are excluded via the value regex.
const literalAttrSyntax = {
  selector:
    "JSXAttribute[name.name=/^(aria-label|title|placeholder|alt|label)$/] > Literal[value=/[a-z]/]",
  message:
    "Localise user-visible props (aria-label/title/placeholder/alt/label) via t() — no bare string literals.",
};

const toLocaleSyntax = [
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
];

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
      "i18next/no-literal-string": ["warn", i18nLiteralOptions],
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
      "no-restricted-syntax": ["error", ...toLocaleSyntax],
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
  {
    files: ["src/pages/auth/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax],
    },
  },
  // ─── Wave 3b — scope-dir ERROR flip for messaging ─────────────────
  {
    files: ["src/pages/messaging-v2/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax],
    },
  }
);
