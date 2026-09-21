import { describe, it, expect } from 'vitest';
import { nextHandoffAction, type HandoffSnapshot } from '../handoffRules';
import { useComposerFlowStore, notifyComposerCompleted } from '../composerFlowStore';

const CLUBHOUSE = '/clubhouse';
const unarmed: HandoffSnapshot = { returnPath: CLUBHOUSE, armed: false, awayPath: null };
const armedAtRoute: HandoffSnapshot = {
  returnPath: CLUBHOUSE,
  armed: true,
  awayPath: '/courses/abc/rate',
};
const armedAtOverlay: HandoffSnapshot = {
  returnPath: CLUBHOUSE,
  armed: true,
  awayPath: CLUBHOUSE,
};

describe('composer handoff — arming', () => {
  it('does nothing while the handoff is written but we have not left yet', () => {
    expect(
      nextHandoffAction({
        handoff: unarmed,
        pathname: CLUBHOUSE,
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'none' });
  });

  it('arms when the review route takes over', () => {
    expect(
      nextHandoffAction({
        handoff: unarmed,
        pathname: '/courses/abc/rate',
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'arm', awayPath: '/courses/abc/rate' });
  });

  it('arms when the post overlay opens over the same path', () => {
    expect(
      nextHandoffAction({
        handoff: unarmed,
        pathname: CLUBHOUSE,
        studioOpen: true,
        navWasBack: false,
      }),
    ).toEqual({ type: 'arm', awayPath: CLUBHOUSE });
  });
});

describe('composer handoff — reopening', () => {
  it('reopens step 1 on a back out of the review route', () => {
    expect(
      nextHandoffAction({
        handoff: armedAtRoute,
        pathname: CLUBHOUSE,
        studioOpen: false,
        navWasBack: true,
      }),
    ).toEqual({ type: 'reopen' });
  });

  it('reopens step 1 on a back out of the post overlay', () => {
    expect(
      nextHandoffAction({
        handoff: armedAtOverlay,
        pathname: CLUBHOUSE,
        studioOpen: false,
        navWasBack: true,
      }),
    ).toEqual({ type: 'reopen' });
  });

  it('stays quiet while still inside the composer', () => {
    expect(
      nextHandoffAction({
        handoff: armedAtOverlay,
        pathname: CLUBHOUSE,
        studioOpen: true,
        navWasBack: false,
      }),
    ).toEqual({ type: 'none' });
    expect(
      nextHandoffAction({
        handoff: armedAtRoute,
        pathname: '/courses/abc/rate',
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'none' });
  });
});

describe('composer handoff — disarming', () => {
  it('expires when the composer is closed by anything other than back', () => {
    expect(
      nextHandoffAction({
        handoff: armedAtRoute,
        pathname: CLUBHOUSE,
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'clear' });
  });

  it('expires when the member navigates on somewhere else', () => {
    expect(
      nextHandoffAction({
        handoff: armedAtRoute,
        pathname: '/profile',
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'clear' });
  });

  it('never reopens on a later, unrelated return to the same page', () => {
    // The record is cleared the first time the member moves on...
    expect(
      nextHandoffAction({
        handoff: armedAtRoute,
        pathname: '/amateur',
        studioOpen: false,
        navWasBack: false,
      }),
    ).toEqual({ type: 'clear' });
    // ...so an hour later there is no record at all and nothing can fire.
    expect(
      nextHandoffAction({
        handoff: null,
        pathname: CLUBHOUSE,
        studioOpen: false,
        navWasBack: true,
      }),
    ).toEqual({ type: 'none' });
  });
});

describe('composer handoff — the record itself', () => {
  it('starts empty, which is what makes a cold launch safe', () => {
    expect(useComposerFlowStore.getState().handoff).toBeNull();
  });

  it('is forgotten the moment a post or review completes', () => {
    useComposerFlowStore.getState().beginHandoff(CLUBHOUSE);
    useComposerFlowStore.getState().arm('/courses/abc/rate');
    expect(useComposerFlowStore.getState().handoff).not.toBeNull();
    notifyComposerCompleted();
    expect(useComposerFlowStore.getState().handoff).toBeNull();
  });
});
