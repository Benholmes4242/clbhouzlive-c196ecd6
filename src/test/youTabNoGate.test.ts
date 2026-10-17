/**
 * YOU_TAB_NO_GATE_1 — the sample-size gate is gone; the round count now
 * drives only the wording. Pins the noun rule (U2) and that the gate helper
 * is gone (U1).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { COURSE_FIELD_MIN_ROUNDS, fieldSample } from '@/lib/courseYou/youDerivations';

describe('fieldSample (YOU_TAB_NO_GATE_1 U2)', () => {
  it('one round is "the one round logged here"', () => {
    expect(fieldSample(1)).toBe('one');
  });

  it('two to four rounds is "the N rounds logged here"', () => {
    expect(fieldSample(2)).toBe('few');
    expect(fieldSample(4)).toBe('few');
  });

  it('five or more is "the field", exactly as today', () => {
    expect(fieldSample(COURSE_FIELD_MIN_ROUNDS)).toBe('field');
    expect(fieldSample(500)).toBe('field');
  });

  it('an unknown count is not a field', () => {
    expect(fieldSample(null)).toBe('few');
    expect(fieldSample(undefined)).toBe('few');
    expect(fieldSample(NaN)).toBe('few');
  });
});

describe('the gate is gone (U1)', () => {
  const derivations = readFileSync(path.resolve(__dirname, '../lib/courseYou/youDerivations.ts'), 'utf8');
  const youTab = readFileSync(
    path.resolve(__dirname, '../components/courses/course-detail/CourseYouTab.tsx'),
    'utf8',
  );

  it('courseFieldKnown no longer exists', () => {
    expect(derivations).not.toContain('courseFieldKnown');
    expect(youTab).not.toContain('courseFieldKnown');
  });

  it('the You tab never switches a course-side section off on sample size', () => {
    expect(youTab).not.toMatch(/total_rounds\s*\?\?\s*0\)\s*>=\s*FIELD_CHART_MIN_ROUNDS[\s\S]{0,400}showAgainst/);
  });
});
