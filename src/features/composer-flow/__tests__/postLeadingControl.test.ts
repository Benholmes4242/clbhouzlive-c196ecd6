/**
 * PHASE 3 §9.1 / §9.2 — the post composer's leading control and requestReopen.
 *
 * The control is a RULE, not a look: ← means "there is a step 1 behind this",
 * and only an entry from step 1 has one. The rest (a course page's post-about-
 * this, an edit, a draft, a deep link) must close, because a ← there would
 * promise a screen that does not exist.
 */
import { describe, expect, it, beforeEach } from 'vitest';
import { postLeadingControl } from '../handoffRules';
import { useComposerFlowStore } from '../composerFlowStore';

describe('postLeadingControl', () => {
  it('draws back only when a handoff from step 1 exists', () => {
    expect(postLeadingControl({ returnPath: '/', armed: true, awayPath: '/' })).toBe('back');
    // Written but not yet armed: the composer paints before the arm effect runs,
    // so this must already be 'back' or the glyph would swap on first paint.
    expect(postLeadingControl({ returnPath: '/', armed: false, awayPath: null })).toBe('back');
  });

  it('draws close for every other entry', () => {
    expect(postLeadingControl(null)).toBe('close');
  });
});

describe('requestReopen', () => {
  beforeEach(() => {
    useComposerFlowStore.setState({ handoff: null, reopenRequested: false });
  });

  it('clears the handoff as it fires', () => {
    useComposerFlowStore.getState().beginHandoff('/clubhouse');
    useComposerFlowStore.getState().requestReopen();
    const st = useComposerFlowStore.getState();
    expect(st.reopenRequested).toBe(true);
    expect(st.handoff).toBeNull();
  });

  it('does nothing on a second call — one-shot, like everything else here', () => {
    useComposerFlowStore.getState().beginHandoff('/clubhouse');
    useComposerFlowStore.getState().requestReopen();
    useComposerFlowStore.getState().consumeReopen();
    useComposerFlowStore.getState().requestReopen();
    expect(useComposerFlowStore.getState().reopenRequested).toBe(false);
    expect(useComposerFlowStore.getState().handoff).toBeNull();
  });
});
