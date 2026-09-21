/**
 * PHASE 3 of BRIEF_THE_UNIFIED_COMPOSER — the two things a later tidy-up breaks.
 *
 * §9.3 THE SUBMIT GATE, written here against COMMIT A's rule (media required)
 * so that commit B's flip to "media OR words" is visible as a change to this
 * file rather than an invisible change of behaviour.
 *
 * §9.4 THE INVARIANT, in the spirit of 766990e and of phase 2's step guard: the
 * media rail and the caption must not be unmounted by opening or closing the
 * media sheet. The sheet is a SIBLING of the screen, not a replacement for it —
 * if someone later moves the rail or the caption inside the sheet's conditional,
 * a member loses attached photos and typed words by tapping a thumbnail. Read
 * from the source because the failure is structural, not visual.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { postContentGate } from '../lib/postGate';

const SRC = readFileSync(join(process.cwd(), 'src/features/post-v2/StageComposer.tsx'), 'utf8');

describe('post content gate (commit A: media required)', () => {
  const cases: Array<[string, boolean, number, string, boolean]> = [
    ['media and words', false, 2, 'two sentences', true],
    ['media only', false, 1, '', true],
    ['words only', false, 0, 'two sentences', false],
    ['neither', false, 0, '', false],
    ['edit mode with nothing', true, 0, '', true],
  ];
  for (const [name, isEditMode, mediaCount, caption, expected] of cases) {
    it(`${name} -> ${expected}`, () => {
      expect(postContentGate({ isEditMode, mediaCount, caption })).toBe(expected);
    });
  }
});

describe('the media sheet cannot unmount the rail or the caption', () => {
  it('renders the sheet as a sibling variable, not around the screen', () => {
    expect(SRC).toContain('const mediaSheet = !mediaSheetOpen ? null : (');
    expect(SRC).toContain('{mediaSheet}');
  });

  it('keeps the rail and the caption outside every media-sheet condition', () => {
    const ret = SRC.slice(SRC.indexOf('// ---- STEP 2 — ONE SCREEN'));
    expect(ret).toContain('<CaptionField');
    expect(ret).toContain('emptyStage ?');
    // Neither may be gated on the sheet being open or closed.
    expect(ret).not.toContain('mediaSheetOpen');
    expect(ret).not.toContain('openMediaIndex !== null');
  });

  it('has no page state and no local step counter left', () => {
    expect(SRC).not.toContain('setPage(');
    expect(SRC).not.toMatch(/>1 \/ 2</);
    expect(SRC).not.toMatch(/>2 \/ 2</);
  });

  it('draws the shared header, not a counter of its own', () => {
    expect(SRC).toContain('<ComposerStepHeader step={2} total={2}');
  });
});
