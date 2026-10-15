import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';
import {
  placeMentionsPanel,
  correctPanelBottom,
  PANEL_MAX_HEIGHT,
  readVisibleArea,
} from '@/components/mentions/MentionsComposerInput';

describe('placeMentionsPanel', () => {
  it('dock with a short text box fills the gap', () => {
    expect(placeMentionsPanel({ placement: 'dock', vTop: 0, vBottom: 541, anchorTop: 250, anchorBottom: 320, safeTop: 47 }))
      .toEqual({ mode: 'dock', targetBottom: 541, maxHeight: 213 });
  });
  it('dock with a tall text box keeps MIN_PANEL on the keyboard', () => {
    expect(placeMentionsPanel({ placement: 'dock', vTop: 0, vBottom: 541, anchorTop: 155, anchorBottom: 409, safeTop: 47 }))
      .toEqual({ mode: 'dock', targetBottom: 541, maxHeight: 170 });
  });
  it('dock with the keyboard closed', () => {
    const r = placeMentionsPanel({ placement: 'dock', vTop: 0, vBottom: 932, anchorTop: 155, anchorBottom: 409, safeTop: 47 });
    expect(r.targetBottom).toBe(932);
    expect(r.maxHeight).toBe(PANEL_MAX_HEIGHT);
  });
  it('above floats over the composer', () => {
    const r = placeMentionsPanel({ placement: 'above', vTop: 0, vBottom: 541, anchorTop: 480, anchorBottom: 530, safeTop: 47 });
    expect(r.mode).toBe('above');
    expect(r.targetBottom).toBe(472);
  });
});

describe('panelPlacement per host', () => {
  const read = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');
  const tag = (src: string) => src.slice(src.indexOf('<MentionsComposerInput'), src.indexOf('/>', src.indexOf('<MentionsComposerInput')));
  it('review and post composers dock (no prop)', () => {
    expect(tag(read('src/features/review-v2/ReviewComposerV2.tsx'))).not.toContain('panelPlacement');
    expect(tag(read('src/features/post-v2/components/CaptionField.tsx'))).not.toContain('panelPlacement');
  });
  it('comment composer passes above', () => {
    expect(tag(read('src/features/comments-v2/components/CommentComposer.tsx'))).toContain('panelPlacement="above"');
  });
});

describe('readVisibleArea', () => {
  it('ignores visualViewport.offsetTop', () => {
    expect(readVisibleArea({ innerHeight: 932, visualViewport: { height: 541, offsetTop: 221 } as any }))
      .toEqual({ vTop: 0, vBottom: 541 });
  });
});

describe('correctPanelBottom', () => {
  it('adds the measured delta to bottom', () => {
    expect(correctPanelBottom({ bottom: 220, measuredBottom: 930, targetBottom: 760, corrections: 0 }))
      .toEqual({ bottom: 390, corrections: 1, done: false });
  });
  it('stops after two corrections', () => {
    expect(correctPanelBottom({ bottom: 390, measuredBottom: 800, targetBottom: 760, corrections: 2 }))
      .toEqual({ bottom: 390, corrections: 2, done: true });
  });
  it('is done when within 1px', () => {
    expect(correctPanelBottom({ bottom: 390, measuredBottom: 760.5, targetBottom: 760, corrections: 1 }).done).toBe(true);
  });
});
