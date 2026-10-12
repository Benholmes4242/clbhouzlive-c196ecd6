import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RoundResults } from '@/features/courses/_shared/scorecard/RoundResults';
import { ScoringKey } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import type { RoundAwardsResult } from '@/hooks/gam/useRoundAwards';

/* BRIEF_SCORECARD_SHEET — C.1 key, C.2/C.3/C.4 strip, C.5 placing column, C.6 basis. */

const en = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/locales/en/courses.json'), 'utf8')).scorecard;
const enH = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'public/locales/en/handicap.json'), 'utf8')).roundResults.scope;
const sheetSrc = fs.readFileSync(path.resolve(process.cwd(), 'src/features/courses/_shared/scorecard/CardScorecardSheet.tsx'), 'utf8');

const scope = { courseName: 'Sundridge Park', roundsHere: 33, subjectName: "James's", subject: 'He', possessive: 'his', verb: 'has', pronoun: 'he' as const };
const unplaced: RoundAwardsResult['efforts'] = [
  { unit_kind: 'round_gross', value: 87, rank_here: null, top_ten: false, attempts: 33 },
  { unit_kind: 'front_nine', value: 10, rank_here: null, top_ten: false, attempts: 33 },
];

describe('scorecard sheet basis and strip', () => {
  it('the vs-average label is neutral and does not depend on the sign', () => {
    for (const key of ['figVsYourAvgNeutralHere', 'figVsTheirAvgNeutralHere']) {
      expect(en[key].toLowerCase()).not.toContain('better');
      expect(en[key].toLowerCase()).not.toContain('worse');
    }
    // One label call, no branch on diff, and the "better" keys are not read.
    expect(sheetSrc).not.toMatch(/scorecard\.figVs(Your|Their)AvgHere'/);
    expect(sheetSrc).not.toMatch(/vsAvg(Better|Worse)/);
  });

  it('the strip carries no tone and no handicap item', () => {
    const block = sheetSrc.slice(sheetSrc.indexOf('const courseSection = useMemo'), sheetSrc.indexOf('const rail = useMemo'));
    expect(block).not.toMatch(/tone:/);
    expect(block).not.toMatch(/indexthen|figHcpAtTime/);
    expect((block.match(/items\.push\(/g) ?? []).length).toBe(2);
  });

  it('drops the placing column when no effort row placed', () => {
    const { container } = render(<RoundResults result={{ awards: [], efforts: unplaced }} scope={scope} />);
    expect(container.querySelector('[data-round-efforts-placing-header]')).toBeNull();
    expect(container.querySelector('[data-round-efforts-table]')?.getAttribute('data-round-efforts-columns')).toBe('2');
    expect(container.querySelector('[data-round-effort="round_gross"]')?.children).toHaveLength(2);
  });

  it('keeps three columns when one row placed', () => {
    const efforts = [{ ...unplaced[0], rank_here: 3 }, unplaced[1]];
    const { container } = render(<RoundResults result={{ awards: [], efforts }} scope={scope} />);
    expect(container.querySelector('[data-round-efforts-placing-header]')).not.toBeNull();
    expect(container.querySelector('[data-round-effort="front_nine"]')?.children).toHaveLength(3);
  });

  it('the key renders four items', () => {
    const { container } = render(<ScoringKey />);
    expect(container.querySelectorAll('[data-scorecard-key-item]')).toHaveLength(4);
  });

  it('awards render inside the own-rounds section, after its heading', () => {
    const result: RoundAwardsResult = {
      efforts: [],
      awards: [{ award_kind: 'new_best', unit_kind: 'front_nine', unit_key: 0, tier: 'gold', value: 0, previous_value: 1, delta: 1, rank_here: 1, attempts: 41 }],
    };
    const { container } = render(<RoundResults result={result} scope={scope} />);
    const own = container.querySelector('[data-round-results-own]');
    const heading = own?.querySelector('[data-round-results-scope]');
    const awards = own?.querySelector('[data-round-results-block="awards"]');
    expect(heading && awards).toBeTruthy();
    expect(heading!.compareDocumentPosition(awards!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('no rendered string claims own-rounds-only beside the field comparison', () => {
    const { container } = render(<RoundResults result={{ awards: [], efforts: unplaced }} scope={scope} />);
    expect(container.textContent).not.toContain('roundResults.scope.line');
    expect(enH.ownLine.toLowerCase()).not.toContain('other members');
    // The field sentence is not inside the own-rounds section.
    expect(sheetSrc.indexOf('data-scorecard-field-block')).toBeGreaterThan(sheetSrc.indexOf('<RoundResults'));
    expect(sheetSrc).not.toContain("roundResults.scope.line");
  });
});
