import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const host = fs.readFileSync('src/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet.tsx', 'utf8');
const hook = fs.readFileSync('src/components/explore-tab-new/courseled/hooks/useRoundNetScores.ts', 'utf8');

describe('RoundDetailSheet net read', () => {
  it('(f) exactly one gam_round_net read, through the shared hook, for the score id', () => {
    expect(host).not.toMatch(/from\(\s*'gam_round_net'/);
    expect(host.match(/useRoundNetScores\(/g)?.length).toBe(1);
    expect(host).toMatch(/useRoundNetScores\(open \? scoreIdList : \[\]\)/);
    expect(hook).toContain("select('whs_score_id, net_score, course_handicap')");
  });
  it('(g) a failed read settles to the fallback row: no NET props, PLAYED OFF shown once', () => {
    expect(host).toMatch(/net=\{roundNet\?\.net \?\? null\}/);
    expect(host).toMatch(/courseHandicap=\{roundNet\?\.courseHandicap \?\? null\}/);
    expect(hook).toMatch(/return data \?\? EMPTY/);
  });
});
