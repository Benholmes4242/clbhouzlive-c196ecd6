import i18n from 'i18next';
import coursesEn from '../public/locales/en/courses.json';

async function main() {
  await i18n.init({
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['courses'],
    resources: {
      en: { courses: coursesEn as Record<string, unknown> },
    },
    interpolation: { escapeValue: false },
  });

  const resolved = i18n.t('courses:teeCard.eyebrow');
  console.log(`resolved: "${resolved}"`);
  console.log(`match: ${resolved === 'The course card'}`);
  process.exit(resolved === 'The course card' ? 0 : 1);
}

main();
