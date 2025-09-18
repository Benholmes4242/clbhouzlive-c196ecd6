type Dict = Record<string, Record<string, string>>;

// Extend as needed
const dict: Dict = {
  en: {
    'discover.tip.title': 'Tip: Swipe on suggested cards to follow players!',
    'discover.tip.body': 'Swipe up to follow 👍 · Swipe down to dismiss 👎',
    'discover.tip.follow': 'Follow',
    'discover.tip.dismiss': 'Dismiss',
    'common.got_it': 'Got it',
  },
  // Example: add Arabic, French, etc.
  // fr: { ... }
};

let current = 'en';

export function setLocale(locale: string) {
  current = dict[locale] ? locale : 'en';
}

export function t(key: string) {
  return (dict[current] && dict[current][key]) || dict['en'][key] || key;
}