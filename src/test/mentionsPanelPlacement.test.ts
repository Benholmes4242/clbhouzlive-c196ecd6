import { describe, it, expect } from 'vitest';
import {
  placeMentionsPanel,
  correctPanelBottom,
  PANEL_MAX_HEIGHT,
  readVisibleArea,
} from '@/components/mentions/MentionsComposerInput';

describe('placeMentionsPanel', () => {
  it('docks on the keyboard in the review wizard', () => {
    expect(placeMentionsPanel({ vTop: 0, vBottom: 541, anchorTop: 250, anchorBottom: 320, safeTop: 47 }))
      .toEqual({ mode: 'dock', targetBottom: 541, maxHeight: 213 });
  });
  it('docks at the screen bottom with the keyboard closed', () => {
    const r = placeMentionsPanel({ vTop: 0, vBottom: 932, anchorTop: 250, anchorBottom: 320 });
    expect(r.mode).toBe('dock');
    expect(r.maxHeight).toBe(PANEL_MAX_HEIGHT);
  });
  it('floats above a composer sitting on the keyboard', () => {
    const r = placeMentionsPanel({ vTop: 0, vBottom: 541, anchorTop: 480, anchorBottom: 530 });
    expect(r.mode).toBe('above');
    expect(r.targetBottom).toBe(472);
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
