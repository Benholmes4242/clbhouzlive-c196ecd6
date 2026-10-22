import { describe, it, expect } from 'vitest';

import { roundsGateState } from '@/features/explore-magazine/RoundsGate';
/* CB13 — the four gate states. The predicate under test: a settled
   useWhsConnection read with an undeleted connection row. */
describe('CB13 — the Rounds gate state', () => {
  it('a signed-out visitor is never gated and never frosted', () => {
    expect(roundsGateState(undefined, { isSuccess: true, data: null })).toBe('signedOut');
    expect(roundsGateState(undefined, { isSuccess: false, data: undefined })).toBe('signedOut');
  });

  it('an unsettled connection read holds the loading treatment', () => {
    expect(roundsGateState('u1', { isSuccess: false, data: undefined })).toBe('loading');
  });

  it('CB45 — a settled failed read falls to the ungated page, never the gate', () => {
    expect(roundsGateState('u1', { isSuccess: false, isError: true, data: undefined })).toBe('connected');
  });

  it('a settled read with no connection row gates the page', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: null })).toBe('gated');
  });

  it('a settled read with a connection row renders the page untouched', () => {
    expect(roundsGateState('u1', { isSuccess: true, data: { id: 'c1' } })).toBe('connected');
  });
});

