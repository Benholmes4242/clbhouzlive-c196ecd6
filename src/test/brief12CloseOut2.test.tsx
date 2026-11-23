// Brief 12 close-out 2: counted Your courses title, first-name team sheet titles
// with their no-name fallbacks, and the split club "you" panel. Uses a real
// i18next instance with the shipped en resources (a real provider, no mock).
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import en from '@/locales/en/common.json';
import * as rules from '@/features/courses/_shared/siLadderRules';
import { IndexDisagreesSection } from '@/features/business/clubAnalytics/sections';
import type { ClubCourseAnalytics } from '@/features/business/clubAnalytics/types';
import { teamTitleFirst } from '@/components/business/teamSummary';
import { YouCardShell } from '@/components/business/YouCardShell';

const i18n = createInstance();
void i18n.init({ lng: 'en', fallbackLng: 'en', resources: { en: { translation: en } }, interpolation: { escapeValue: false }, initAsync: false });
const read = (p: string) => readFileSync(resolve(__dirname, '..', '..', p), 'utf8');
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function flagged(n: number): rules.SiLadder {
  const rows = Array.from({ length: n }, (_, i) => ({ holeNo: i + 1, strokeIndex: i + 5, measuredRank: i + 1, shotsGap: 0.4, direction: 'harder' as const, avgToPar: 0, placesGap: -4, flagged: true }));
  return { flagged: rows, rows: [], shotsFloor: 0.07, rounds: 738, sd: 0.2 };
}

describe('Your courses counted title', () => {
  it.each([
    [1, "1 hole doesn't play to its stroke index"],
    [4, "4 holes don't play to their stroke index"],
    [12, "12 holes don't play to their stroke index"],
  ])('%i flagged holes', (count, expected) => {
    vi.spyOn(rules, 'buildSiLadder').mockReturnValue(flagged(count));
    render(<I18nextProvider i18n={i18n}><IndexDisagreesSection data={{ holes: [], complete_rounds: 738 } as unknown as ClubCourseAnalytics} /></I18nextProvider>);
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(expected);
  });
});

describe('Team sheet titles name the first name only', () => {
  it('first whitespace token of the display name; none without one', () => {
    expect(teamTitleFirst('Christopher Featherstonehaugh')).toBe('Christopher');
    expect(teamTitleFirst('  Alexandra  Montgomery-Whitfield ')).toBe('Alexandra');
    expect(teamTitleFirst('')).toBe('');
    expect(teamTitleFirst(null)).toBe('');
  });
  it('named and no-name titles', () => {
    const t = i18n.t.bind(i18n);
    expect(t('business.team.sectionOne.declineTitle', { name: teamTitleFirst('Christopher Featherstonehaugh') })).toBe("Decline Christopher's request?");
    expect(t('business.team.sectionTwo.removeSheet.title', { name: teamTitleFirst('Alexandra Montgomery-Whitfield') })).toBe('Remove Alexandra from the team?');
    expect(t('business.team.sectionOne.declineTitleNoName')).toBe('Decline this request?');
    expect(t('business.team.sectionThree.cancelSheet.titleNoName')).toBe('Cancel this invite?');
    for (const k of ['sectionOne.addTitleNoName', 'sectionThree.roleSheet.titleNoName', 'sectionTwo.roleSheet.titleNoName', 'sectionTwo.jobSheet.titleNoName', 'sectionTwo.ownerSheet.titleNoName', 'sectionTwo.removeSheet.titleNoName']) {
      expect(i18n.exists(`business.team.${k}`), k).toBe(true);
    }
  });
  it('every named team sheet title reads the first-name value, never the full name', () => {
    const list = read('src/components/business/TeamListSection.tsx');
    for (const k of ['roleSheet', 'jobSheet', 'ownerSheet', 'removeSheet']) expect(list).toContain(`titled(\`\${P}.${k}.title\`)`);
    expect(list).not.toMatch(/Sheet\.title`, \{ name: sName \}/);
    const invites = read('src/components/business/TeamInvitesSection.tsx');
    expect(invites).not.toMatch(/Sheet\.title`, \{ name \}/);
    expect(read('src/components/business/AccessRequestsSection.tsx')).toMatch(/\{ name: titleFirst, business: businessName \}/);
  });
});

describe('Club "you" panel split', () => {
  it('first sentence is the title, second is body text beneath', () => {
    const { container } = render(<YouCardShell dataAttr="data-club-you" kicker="YOU HERE" first="You've played 12 rounds here." second="Your best is 78." faces={null} />);
    expect(container.querySelector('.club-you-title')?.textContent).toBe("You've played 12 rounds here.");
    const body = container.querySelector('[data-club-you-body]');
    expect(body?.tagName).toBe('P');
    expect(body?.textContent).toBe('Your best is 78.');
    expect(body?.previousElementSibling).toBe(container.querySelector('.club-you-title'));
  });
  it('no second sentence → no body', () => {
    const { container } = render(<YouCardShell dataAttr="data-club-you" kicker="YOU HERE" first="Only one." faces={null} />);
    expect(container.querySelector('[data-club-you-body]')).toBeNull();
  });
});
