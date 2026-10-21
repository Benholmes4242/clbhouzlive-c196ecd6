import React from 'react';
import ReactDOM from 'react-dom/client';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { Section } from '@/features/explore-magazine/Section';

/** CB19 temporary measurement harness: the real Section with the real t() path,
 * rendered twice — once reading the real en/courses.json, once with no resource
 * so only the defaultValue in the Section call can supply the string. Deleted
 * after the measurement. */
function section(i18n: i18next.i18n, tag: string) {
  const t = i18n.getFixedT('en');
  return React.createElement(
    'div',
    { 'data-cb19': tag },
    React.createElement(Section, {
      eyebrow: t('amateur.competitions.eyebrow', { defaultValue: 'Home club golf' }),
      contest: true,
      title: t('amateur.competitions.title', { defaultValue: 'Competitions' }),
      meta: t('amateur.competitions.window', { defaultValue: 'Last 30 days' }),
      first: true,
      children: React.createElement('div', { style: { height: 40 } }),
    }),
  );
}

export async function mount(el: HTMLElement) {
  const courses = await fetch('/public/locales/en/courses.json').then((r) => r.json());

  const fromLocale = i18next.createInstance();
  await fromLocale.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: { en: { courses } },
    interpolation: { escapeValue: false },
  });

  const fromDefault = i18next.createInstance();
  await fromDefault.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: {} });

  ReactDOM.createRoot(el).render(
    React.createElement(
      'div',
      { style: { background: '#fff', minHeight: '100vh' } },
      React.createElement(I18nextProvider, { i18n: fromLocale }, section(fromLocale, 'locale')),
      React.createElement(I18nextProvider, { i18n: fromDefault }, section(fromDefault, 'default')),
    ),
  );
}
