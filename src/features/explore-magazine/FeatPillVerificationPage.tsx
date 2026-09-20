import React from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';

import en from '../../../public/locales/en/courses.json';
import de from '../../../public/locales/de/courses.json';
import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { FeatPillVerificationFixture } from './AchievementCallout';

const fixtures = [
  { id: 'owner-lennon', label: 'Owner - Lennon', mode: 'rare-owner' as const, name: 'Lennon Hill', locale: 'en-GB', lng: 'en' },
  { id: 'non-owner', label: 'Non-owner', mode: 'rare-viewer' as const, name: null, locale: 'en-GB', lng: 'en' },
  { id: 'repeat-owner', label: 'Repeat owner - longest', mode: 'repeat-owner' as const, name: 'Lennon Hill', locale: 'en-GB', lng: 'en' },
  { id: 'german-owner', label: 'German owner', mode: 'rare-owner' as const, name: 'Lennon Hill', locale: 'de-DE', lng: 'de' },
  { id: 'handle-fallback', label: 'Handle fallback', mode: 'rare-owner' as const, name: 'j.edge1994', locale: 'en-GB', lng: 'en' },
];

export function FeatPillVerificationPage() {
  return (
    <main style={{ minHeight: '100vh', background: A.CANVAS, color: A.INK, fontFamily: SANS, padding: '24px 14px', boxSizing: 'border-box' }}>
      {fixtures.map((fixture) => {
        const instance = i18next.createInstance();
        void instance.init({ lng: fixture.lng, resources: { en: { courses: en }, de: { courses: de } }, ns: ['courses'], defaultNS: 'courses' });
        return (
          <section key={fixture.id} data-feat-pill-case={fixture.id} style={{ marginBottom: 28 }}>
            <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, color: A.MUTE }}>{fixture.label}</div>
            <I18nextProvider i18n={instance}>
              <FeatPillVerificationFixture mode={fixture.mode} displayName={fixture.name} locale={fixture.locale} />
            </I18nextProvider>
          </section>
        );
      })}
    </main>
  );
}