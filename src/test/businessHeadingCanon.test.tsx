/**
 * Canonical heading brief 12: Business and Insights headings read the
 * section canon (SECTION_EYEBROW 11/700/.16em/1, SECTION_TITLE 21/700/-.035em/1.05).
 * Class-based headings are checked against their CSS rules and the :root
 * variables; inline headings are checked for the shared token spread.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');
const index = read('src/index.css');
const rule = (css: string, sel: string) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = new RegExp(`(?:^|\\n)\\s*${esc}\\s*\\{([^}]*)\\}`).exec(css);
  expect(m, `${sel} rule must exist`).not.toBeNull();
  return m![1];
};
const rootVar = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(index)?.[1].trim();
const EYEBROW_VARS = ['size', 'weight', 'tracking', 'leading', 'transform'];
const TITLE_VARS = ['size', 'weight', 'tracking', 'leading', 'synthesis'];
const usesVars = (body: string, kind: 'eyebrow' | 'title') =>
  (kind === 'eyebrow' ? EYEBROW_VARS : TITLE_VARS).every(v => body.includes(`var(--section-${kind}-${v})`));

describe('Brief 12 business heading canon', () => {
  it('the canon variables hold the canonical values', () => {
    expect([rootVar('section-eyebrow-size'), rootVar('section-eyebrow-weight'), rootVar('section-eyebrow-tracking'), rootVar('section-eyebrow-leading')])
      .toEqual(['11px', '700', '0.16em', '1']);
    expect([rootVar('section-title-size'), rootVar('section-title-weight'), rootVar('section-title-tracking'), rootVar('section-title-leading')])
      .toEqual(['21px', '700', '-0.035em', '1.05']);
    expect(rootVar('section-title-gap')).toBe('5px');
  });

  it('an Insights panel eyebrow and title sit at canon with the 5px gap', () => {
    expect(usesVars(rule(index, '.insights-visits-kicker'), 'eyebrow')).toBe(true);
    const title = rule(index, '.insights-reviews-title');
    expect(usesVars(title, 'title')).toBe(true);
    expect(title).toMatch(/margin:\s*var\(--section-title-gap,\s*5px\)\s+0\s+0/);
  });

  it('a team sheet title sits at canon', () => {
    expect(usesVars(rule(index, '.team-sheet-title'), 'title')).toBe(true);
    expect(rule(index, '.team-list-title')).toMatch(/letter-spacing:\s*var\(--section-title-tracking\)/);
  });

  it('the claim sheet title spreads SECTION_TITLE', () => {
    const src = read('src/components/business/ClaimYourCourseSheet.tsx');
    expect(src).toMatch(/id="claim-your-course-title" style=\{\{[^}]*\.\.\.SECTION_TITLE/);
    expect(src).toMatch(/import \{ SECTION_TITLE \} from '@\/lib\/tokens\/type'/);
  });

  it('the verification SectionCard title spreads SECTION_TITLE', () => {
    const src = read('src/components/business/verification/VerificationFlowSheet.tsx');
    expect(src).toMatch(/data-vf-heading[\s\S]{0,120}style=\{\{[^}]*\.\.\.SECTION_TITLE/);
  });

  it('the business-create step h1 keeps 28px and takes -0.035em / 1.05', () => {
    const body = rule(read('src/features/business-create/business-create.css'), '.bizc-body h1');
    expect(body).toMatch(/font-size:28px/);
    expect(body).toMatch(/letter-spacing:-0\.035em/);
    expect(body).toMatch(/line-height:1\.05/);
  });
});

describe('Brief 12 close-out', () => {
  const sections = read('src/features/business/clubAnalytics/sections.tsx');
  it('a club analytics sibling (Records) eyebrow and title sit at canon with the 5px gap', () => {
    expect(sections).toMatch(/const S7_KICKER: React\.CSSProperties = \{ \.\.\.SECTION_EYEBROW,/);
    expect(sections).toMatch(/const S7_TITLE: React\.CSSProperties = \{ marginTop: SECTION_TITLE_GAP, \.\.\.SECTION_TITLE,/);
  });
  it('the What golfers say empty-state title spreads SECTION_TITLE', () => {
    const src = read('src/components/business/ClubWhatGolfersSay.tsx');
    expect(src).toMatch(/<h2 style=\{\{ \.\.\.SECTION_TITLE, color: T\.ink, margin: 0 \}\}>\s*No one has reviewed/);
  });
  it('a remaining card eyebrow (followers) takes SECTION_EYEBROW at 11px / 0.16em', async () => {
    const { SECTION_EYEBROW } = await import('@/lib/tokens/type');
    expect([SECTION_EYEBROW.fontSize, SECTION_EYEBROW.letterSpacing]).toEqual([11, '0.16em']);
    expect(read('src/components/business/BusinessFollowersCard.tsx')).toMatch(/<span style=\{\{ \.\.\.SECTION_EYEBROW, color: T\.ink \}\}>/);
  });
  it('the RequestAnotherCourseSheet title spreads SECTION_TITLE', () => {
    expect(read('src/components/business/RequestAnotherCourseSheet.tsx')).toMatch(/id="request-another-course-title" style=\{\{[^}]*\.\.\.SECTION_TITLE/);
  });
});

describe('Brief 12 close-out continuation', () => {
  it('the Insights funnel kicker takes SECTION_EYEBROW at 11px / 0.16em', async () => {
    const { SECTION_EYEBROW } = await import('@/lib/tokens/type');
    expect([SECTION_EYEBROW.fontSize, SECTION_EYEBROW.letterSpacing, SECTION_EYEBROW.lineHeight]).toEqual([11, '0.16em', 1]);
    expect(read('src/components/business/insights/InsightsFunnel.tsx')).toMatch(/\.\.\.SECTION_EYEBROW, color: FUNNEL_INK,/);
  });
});
