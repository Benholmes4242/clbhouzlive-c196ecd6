import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

import { roundsGateState, gateReach } from '@/features/explore-magazine/RoundsGate';
import { WHS_COUNTRIES } from '@/lib/whs/whsCountries';

const enCourses = JSON.parse(
  readFileSync(process.cwd() + '/public/locales/en/courses.json', 'utf8'),
) as Record<string, Record<string, string>>;

/* CB13 — the four gate states. The predicate under test: a settled
   useWhsConnection read with an undeleted connection row. */
describe('CB13 — the Rounds gate state', () => {
  it('a signed-out visitor is never gated and never frosted', () => {
    expect(roundsGateState(undefined, { isSuccess: true, data: null })).toBe('signedOut');
    expect(roundsGateState(undefined, { isSuccess: false, data: undefined })).toBe('signedOut');
  });

  it('an unsettled or failed connection read holds the loading treatment', () => {
    expect(roundsGateState('u1', { isSuccess: false, data: undefined })).toBe('loading');
  });

  it('a settled read with no connection row gates the page', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: null })).toBe('gated');
  });

  it('a settled read with a connection row renders the page untouched', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: { id: 'c1' } })).toBe('connected');
  });
});

/* CB14 — the sheet's truth line is derived from WHS_COUNTRIES, never a fixed
   string, so it cannot drift when a second provider launches. */
describe('CB14 — the sheet reach line is derived from the data', () => {
  it('names every supported body and only supported bodies', () => {
    const { supportedBodies } = gateReach();
    expect(supportedBodies).toEqual(WHS_COUNTRIES.filter((c) => c.supported).map((c) => c.body));
    expect(supportedBodies.length).toBeGreaterThan(0);
  });

  it('names exactly the unsupported home nations, excluding comingSoon partners', () => {
    const { unsupportedHomeNations } = gateReach();
    expect(unsupportedHomeNations).toEqual(['Scotland', 'Wales', 'Ireland']);
    const comingSoon = WHS_COUNTRIES.filter((c) => c.comingSoon).map((c) => c.name);
    for (const name of comingSoon) expect(unsupportedHomeNations).not.toContain(name);
  });

  it('the locale carries the two sheet rows and the reach sentence, with no dishonoured rows left', () => {
    const gate = enCourses.amateur as Record<string, string>;
    expect(Object.keys(gate)).not.toEqual(expect.arrayContaining(['scotland', 'wales', 'ireland', 'anywhere']));
    expect(gate.sheetReach).toContain('{{supported}}');
    expect(gate.sheetReach).toContain('{{unsupported}}');
  });
});
