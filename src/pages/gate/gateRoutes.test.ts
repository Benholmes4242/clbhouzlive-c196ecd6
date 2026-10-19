import { describe, expect, it } from 'vitest';
import { isGateExemptPath } from './gateRoutes';

describe('gate exemptions', () => {
  it('/get is exempt: it holds no data and needs no session', () => {
    expect(isGateExemptPath('/get')).toBe(true);
  });
  it('gated app paths are not exempt', () => {
    expect(isGateExemptPath('/clubhouse')).toBe(false);
    expect(isGateExemptPath('/courses')).toBe(false);
  });
});
