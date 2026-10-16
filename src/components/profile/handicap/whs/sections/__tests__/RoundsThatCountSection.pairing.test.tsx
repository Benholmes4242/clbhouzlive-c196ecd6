/** BRIEF_MECHANISM_PAIRING — bars and the counting eight share one selection by round id. */
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import common from '../../../../../../../public/locales/en/common.json';
import RoundsThatCountSection from '../RoundsThatCountSection';

const state = vi.hoisted(() => ({ sheet: vi.fn() }));
// Most recent first. s1 and s2 share a 2.4 differential; s10 does not count.
const diffs = [1.1, 2.4, 2.4, 3.0, 3.2, 3.5, 3.8, 4.0, 9, 10, 15, 11, 12, 13, 14, 16, 17, 18, 19, 20];
const scores = diffs.map((d, i) => ({
  id: `s${i}`,
  play_date: `2026-${String(10 - Math.floor(i / 3)).padStart(2, '0')}-${String(28 - (i % 3) * 7).padStart(2, '0')}`,
  handicap_differential: d,
  is_counter: i < 8,
  course: { name: `Course ${i}` },
}));
vi.mock('@/lib/whs/hooks', () => ({ useAllScores: () => ({ data: scores, isLoading: false }) }));
vi.mock('@/utils/analyticsEvents', () => ({ analyticsEvents: { track: vi.fn() } }));
vi.mock('../round-detail/RoundDetailSheet', () => ({
  default: (props: { open: boolean; scoreId: string; onClose: () => void }) => {
    state.sheet(props);
    return props.open ? <div role="dialog"><button onClick={props.onClose}>Close round</button></div> : null;
  },
}));

const i18n = createInstance();
beforeAll(async () => {
  await i18n.init({ lng: 'en', resources: { en: { common } }, interpolation: { escapeValue: false } });
});
afterEach(() => { cleanup(); state.sheet.mockClear(); });

const mount = () => render(<I18nextProvider i18n={i18n}><RoundsThatCountSection connectionId="c" userId="u" /></I18nextProvider>);
const barFor = (course: string) => screen.getAllByRole('button', { name: new RegExp(`, ${course}, `) })
  .find((b) => !b.hasAttribute('data-round-id'))!;
const chipFor = (id: string) => document.querySelector(`[data-round-id="${id}"]`) as HTMLElement;
const lastSheet = () => state.sheet.mock.calls.at(-1)![0];

it('a chip tap lights the matching bar and opens the sheet with that round id', () => {
  mount();
  fireEvent.click(chipFor('s3'));
  expect(lastSheet()).toMatchObject({ scoreId: 's3', open: true });
  expect(barFor('Course 3').getAttribute('aria-pressed')).toBe('true');
  expect((barFor('Course 4').firstChild as HTMLElement).style.opacity).toBe('0.55');
});

it('a bar tap lights the matching chip', () => {
  mount();
  fireEvent.click(barFor('Course 5'));
  expect(chipFor('s5').getAttribute('aria-pressed')).toBe('true');
  expect(chipFor('s5').style.opacity).toBe('1');
  expect(chipFor('s4').style.opacity).toBe('0.55');
});

it('two rounds sharing a differential are paired by id, not first match', () => {
  mount();
  fireEvent.click(chipFor('s2'));
  expect(lastSheet().scoreId).toBe('s2');
  expect(barFor('Course 2').getAttribute('aria-pressed')).toBe('true');
  expect(barFor('Course 1').getAttribute('aria-pressed')).toBe('false');
  expect(chipFor('s1').style.opacity).toBe('0.55');
});

it('dismissing the sheet leaves the selection in place', () => {
  mount();
  fireEvent.click(chipFor('s6'));
  fireEvent.click(screen.getByText('Close round'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(chipFor('s6').getAttribute('aria-pressed')).toBe('true');
  expect(barFor('Course 6').getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(chipFor('s6'));
  expect(lastSheet()).toMatchObject({ scoreId: 's6', open: true });
});

it('a non-counting bar opens its round and lights no chip', () => {
  mount();
  fireEvent.click(barFor('Course 10'));
  expect(lastSheet()).toMatchObject({ scoreId: 's10', open: true });
  expect(barFor('Course 10').getAttribute('aria-label')).toMatch(/Does not count$/);
  document.querySelectorAll('[data-round-id]').forEach((c) => {
    expect(c.getAttribute('aria-pressed')).toBe('false');
    expect((c as HTMLElement).style.opacity).toBe('0.55');
  });
});
