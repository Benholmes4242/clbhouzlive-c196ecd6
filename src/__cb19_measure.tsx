import React from 'react';
import ReactDOM from 'react-dom/client';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { Section } from '@/features/explore-magazine/Section';

/** CB19 temporary measurement harness: the real Section, the real t() path and
 * the real en/courses.json, so the eyebrow string and its line are measured as
 * the page renders them. Deleted after the measurement. */
export async function mount(el: HTMLElement) {
  const i18n = i18next.createInstance();
  const courses = await fetch('/public/locales/en/courses.json').then((r) => r.json());
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { courses } },
    interpolation: { escapeValue: false },
  });

  const t = i18n.getFixedT('en');
  ReactDOM.createRoot(el).render(
    React.createElement(
      I18nextProvider,
      { i18n },
      React.createElement(
        'div',
        { id: 'root', style: { background: '#fff', minHeight: '100vh' } },
        React.createElement(Section, {
          eyebrow: t('amateur.competitions.eyebrow', { defaultValue: 'Home club golf' }),
          contest: true,
          title: t('amateur.competitions.title', { defaultValue: 'Competitions' }),
          meta: t('amateur.competitions.window', { defaultValue: 'Last 30 days' }),
          first: true,
          children: React.createElement('div', { style: { height: 40 } }),
        }),
      ),
    ),
  );
}
