import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

// Wave 3b.iii — single source of truth for the i18next/no-literal-string
// options (project-wide WARN + scope-dir ERROR overrides).

/**
 * ─── QUERY KEY RATCHET ───────────────────────────────────────────────────────
 * Enforces the REACHABILITY TEST from src/lib/queryKeys.ts: a query key must
 * not be derived from the CONTENTS of an id array. Such a key churns on every
 * pagination page, `data` goes undefined for a paint, and everything rendered
 * from it unmounts mid-scroll.
 *
 * WARN globally today (a large migration, landing per vertical), ERROR per
 * directory as each vertical clears — same ratchet the i18n waves used.
 *
 * Limits, by design: this rule is SYNTACTIC. It cannot tell whether a key
 * SHOULD be viewer-scoped (that is the factory's typed `ViewerId` parameter),
 * and it can never detect the third defect class — rendering a viewer-scoped
 * query on another member's page, which only a render guard prevents. See the
 * header of src/lib/queryKeys.ts.
 */
const queryKeyPlugin = {
  rules: {
    "no-array-derived-key": {
      meta: {
        type: "problem",
        docs: { description: "Query keys must not be derived from id-array contents." },
        schema: [],
        messages: {
          arrayDerived:
            "Query key derived from array contents ({{ what }}). Keys state the identity of the ANSWER, not the shape of the request — use a builder from src/lib/queryKeys.ts (batchKey: scope + viewer + loadedCount).",
        },
      },
      create(context) {
        const filename = context.filename ?? context.getFilename();
        if (filename.replace(/\\/g, "/").endsWith("src/lib/queryKeys.ts")) return {};

        const describe = (node) => {
          if (node.type === "Identifier") return node.name;
          if (node.type === "MemberExpression" && node.property && node.property.name) return node.property.name;
          if (node.type === "CallExpression") {
            const c = node.callee;
            if (c.type === "MemberExpression" && c.property && c.property.name === "join") return ".join(...)";
            if (c.type === "MemberExpression" && c.object && c.object.name === "JSON" && c.property.name === "stringify") return "JSON.stringify(...)";
            if (c.type === "Identifier" && /^(keyFor|hash)/.test(c.name)) return c.name + "(...)";
          }
          return null;
        };

        const suspicious = (node) => {
          const label = describe(node);
          if (!label) return null;
          if (label === ".join(...)" || label === "JSON.stringify(...)" || /\(\.\.\.\)$/.test(label)) return label;
          // Identifier / member access that names a collection of ids.
          if (/(^|[a-z])[Ii]ds$/.test(label) || /^ids$/.test(label)) return label;
          return null;
        };

        return {
          Property(node) {
            const keyName = node.key && (node.key.name || node.key.value);
            if (keyName !== "queryKey") return;
            const value = node.value;
            const candidates =
              value.type === "ArrayExpression"
                ? value.elements.filter(Boolean)
                : [value];
            for (const el of candidates) {
              const what = suspicious(el.type === "SpreadElement" ? el.argument : el);
              if (what) {
                context.report({ node: el, messageId: "arrayDerived", data: { what } });
                return;
              }
            }
          },
        };
      },
    },
  },
};

/**
 * ─── SETTLED-STATE GUARD ─────────────────────────────────────────────────────
 * A DISABLED React Query (v5) is `isPending` with `fetchStatus: 'idle'`, so
 * `isLoading` (= isPending && isFetching) is FALSE before the query has ever
 * run. Any expression that combines a negated isLoading with a null/empty test
 * on that query's data therefore CLAIMS "no data" before the database has been
 * asked. Six shipped defects came from exactly this shape.
 *
 * WARN by design (section 3.4 of the brief): ~87 `!isLoading` sites exist and
 * most are harmless ("not currently fetching"). Suppress those inline with
 * `// eslint-disable-next-line settled/no-not-loading-empty-check`.
 */
const settledPlugin = {
  rules: {
    "no-not-loading-empty-check": {
      meta: {
        type: "problem",
        docs: { description: "Do not decide data absence from !isLoading." },
        schema: [],
        messages: {
          notLoading:
            "A disabled React Query is isLoading:false before it has run. Use isFetched / isSuccess to decide whether data is genuinely absent.",
        },
      },
      create(context) {
        // `!isLoading`, `!q.isLoading`, `!someThingLoading`
        const isNegatedLoading = (node) => {
          if (!node || node.type !== "UnaryExpression" || node.operator !== "!") return false;
          const a = node.argument;
          const name =
            a.type === "Identifier" ? a.name
            : a.type === "MemberExpression" && a.property && a.property.name ? a.property.name
            : null;
          return !!name && /^is[A-Za-z]*Loading$|Loading$/.test(name) && /loading/i.test(name);
        };

        // A claim that data is absent: `!data`, `data == null`, `x.length === 0`,
        // `!x || x.length < 1`, `(data ?? []).length === 0`, `!data?.rows`.
        const isAbsenceClaim = (node) => {
          if (!node) return false;
          switch (node.type) {
            case "UnaryExpression":
              return node.operator === "!" && !isNegatedLoading(node);
            case "BinaryExpression": {
              const nullish =
                (n) => n.type === "Literal" && n.value === null;
              if ((node.operator === "==" || node.operator === "===") && (nullish(node.left) || nullish(node.right))) return true;
              const isLength = (n) =>
                n.type === "MemberExpression" && n.property && n.property.name === "length";
              if (isLength(node.left) || isLength(node.right)) {
                return ["===", "==", "<", "<="].includes(node.operator);
              }
              return false;
            }
            case "LogicalExpression":
              return isAbsenceClaim(node.left) || isAbsenceClaim(node.right);
            default:
              return false;
          }
        };

        const walk = (node) => {
          if (!node || node.type !== "LogicalExpression" || node.operator !== "&&") return false;
          const parts = [];
          const flatten = (n) => {
            if (n.type === "LogicalExpression" && n.operator === "&&") {
              flatten(n.left); flatten(n.right);
            } else parts.push(n);
          };
          flatten(node);
          const hasLoading = parts.some(isNegatedLoading);
          if (!hasLoading) return false;
          return parts.some((p) => !isNegatedLoading(p) && isAbsenceClaim(p));
        };

        return {
          LogicalExpression(node) {
            // Report only the outermost matching expression.
            const parent = node.parent;
            if (parent && parent.type === "LogicalExpression" && parent.operator === "&&") return;
            if (walk(node)) context.report({ node, messageId: "notLoading" });
          },
        };
      },
    },
  },
};

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
    // Extra exclude: U+2039/U+203A single angle quotation marks used as
    // decorative chevrons in row/action affordances (see EventInfoSection,
    // SectionEyebrow, StorySection). U+00B7 middot used as a decorative
    // aria-hidden separator (HeroSection meta rows). Non-linguistic glyphs.
    exclude: ["[0-9!-/:-@[-`{-~]+", "[A-Z_-]+", "[\\u2039\\u203A]+", "[\\u00B7]+"],
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
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3b — scope-dir ERROR flip for messaging ─────────────────
  {
    files: ["src/pages/messaging-v2/**/*.{ts,tsx}"],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3c — scope-dir ERROR flip for achievements + quest ──────
  {
    files: [
      "src/components/achievements/**/*.{ts,tsx}",
      "src/components/quest/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3d — courses vertical parent gate ─────────────────────────
  // Consolidates the per-subdir ERROR blocks from 3d.i / 3d.ii / 3d.iii
  // slices 1-5 into two parent gates. New subdirs under either parent
  // are born gated. course-media-tab keeps its own block (separate
  // top-level path).
  {
    files: [
      "src/components/course-media-tab/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  {
    files: [
      "src/components/courses/**/*.{ts,tsx}",
      "src/features/courses/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3e.i — tourhub slice: _shared/* + top-level components/*.tsx ─
  // Parent gate for src/features/tourhub/** lands with 3e.v close-out.
  // Slice-scoped block keeps subdirs (overview-v3/, premium/, shared/,
  // tabs/, tournament-v2/, leaderboard/, player-v2/, players-v2/,
  // leaders-v2/, college-v2/) at WARN until their slice ships.
  {
    files: [
      "src/features/tourhub/_shared/**/*.{ts,tsx}",
      "src/features/tourhub/components/*.tsx",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3e.ii — schedule-v2 slice (Turn 1) ─────────────────────────
  {
    files: [
      "src/features/tourhub/schedule-v2/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3e.iii — tournament-v2 + leaderboard slices (Turn B.3 close) ─
  {
    files: [
      "src/features/tourhub/tournament-v2/**/*.{ts,tsx}",
      "src/features/tourhub/leaderboard/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── Wave 3e.iv — leaders-v2 (C.1) · players-v2 (C.2) · player-v2 (C.3) ─
  {
    files: [
      "src/features/tourhub/leaders-v2/**/*.{ts,tsx}",
      "src/features/tourhub/players-v2/**/*.{ts,tsx}",
      "src/features/tourhub/player-v2/**/*.{ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": ["error", i18nLiteralOptions],
      "no-restricted-syntax": ["error", literalAttrSyntax, ...toLocaleSyntax],
    },
  },
  // ─── QUERY KEY RATCHET — warn globally, error per vertical as it clears ───
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}", "src/test/**", "src/mocks/**"],
    plugins: { querykeys: queryKeyPlugin },
    rules: {
      "querykeys/no-array-derived-key": "warn",
    },
  }

);


