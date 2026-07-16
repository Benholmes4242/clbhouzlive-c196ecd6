/**
 * i18next-parser config — Wave 0.
 *
 * Extracts t('…') / <Trans /> keys into public/locales/<lng>/<ns>.json,
 * keeping catalogs sorted so diffs stay reviewable.
 */
export default {
  input: ['src/**/*.{ts,tsx}'],
  output: 'public/locales/$LOCALE/$NAMESPACE.json',
  locales: ['en', 'ja', 'ko', 'es', 'de'],
  defaultNamespace: 'common',
  keySeparator: '.',
  namespaceSeparator: ':',
  sort: true,
  createOldCatalogs: false,
  keepRemoved: true,
  useKeysAsDefaultValue: false,
  defaultValue: (locale, _ns, key) => (locale === 'en' ? key : ''),
  verbose: false,
};
