/** EP5.2 fix: portalled BizcSheet keeps shell variables and scoped selectors. */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('react-i18next', () => ({ initReactI18next: { type: '3rdParty', init: () => {} }, useTranslation: () => ({ t: (_k: string, o?: { defaultValue?: string }) => o?.defaultValue ?? '' }) }));

import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';

const ep = readFileSync('src/features/edit-profile/edit-profile.css', 'utf8');
const bizc = readFileSync('src/features/business-create/business-create.css', 'utf8');
const privacy = readFileSync('src/components/settings/settingsPrivacy.css', 'utf8');

/** Every custom property declared in rules whose selector is exactly `sel`. */
function vars(css: string, sel: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = new RegExp(`(?:^|\\}|\\*/)\\s*${sel.replace('.', '\\.')}\\s*\\{([^}]*)\\}`, 'g');
  for (const m of css.matchAll(re)) {
    for (const d of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) out[d[1]] = d[2].trim();
  }
  return out;
}

afterEach(cleanup);

describe('BizcSheet root', () => {
  it('renders .bizc-sheet-root in document.body containing both the scrim and the sheet', () => {
    render(<div className="ep-shell"><BizcSheet title="T" testId="s" onDone={() => {}}><p>x</p></BizcSheet></div>);
    const root = document.body.querySelector(':scope > .bizc-sheet-root');
    expect(root).not.toBeNull();
    expect(root!.querySelector('.bizc-sheet-scrim')).not.toBeNull();
    expect(root!.querySelector('.bizc-sheet[data-testid="s"]')).not.toBeNull();
    expect(root!.closest('.ep-shell')).toBeNull();
  });

  it('.bizc-sheet-root defines the shell variables with identical values', () => {
    const root = vars(bizc, '.bizc-sheet-root');
    const shells = { ...vars(ep, '.ep-shell'), ...vars(ep, '.ep-settings'), ...vars(bizc, '.bizc-shell') };
    for (const name of ['--ep-ink', '--ep-mute', '--ep-dim', '--ep-hair', '--bizc-ink', '--bizc-mute', '--bizc-hair']) {
      expect(shells[name]).toBeTruthy();
      expect(root[name]).toBe(shells[name]);
    }
    // Every shell variable is carried, so later additions cannot drift.
    for (const [name, value] of Object.entries(shells)) expect(root[name]).toBe(value);
  });

  it('no .ep-shell / .bizc-shell selector remains for the known in-sheet classes', () => {
    const known = ['.ep-links-options .ep-opt', '.ep-golf-connect-button', '.ep-golf-search', '.ep-golf-remove', '.ep-golf-add', '.ep-link-remove', '.st2-switch', '.st3-switch'];
    for (const css of [ep, bizc, privacy]) {
      for (const k of known) {
        expect(css).not.toContain(`.ep-shell ${k}`);
        expect(css).not.toContain(`.bizc-shell ${k}`);
      }
    }
  });
});
