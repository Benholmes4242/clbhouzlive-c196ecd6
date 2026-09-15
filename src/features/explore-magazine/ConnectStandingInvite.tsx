import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { useHandicapChipState } from '@/lib/whs/useHandicapChipState';
import { analyticsEvents } from '@/utils/analyticsEvents';

import { StandingShelf } from './StandingShelf';

/**
 * THE CONNECT INVITATION (handoff 1.8) — SCORES ONLY.
 *
 * It lives in exactly one place: the slot where "Where you stand" would render
 * in the SCORES shelf rotation, for a viewer with no connected handicap. It
 * NEVER appears on All, and it appears at most once on the page because the
 * standing slot itself appears at most once.
 *
 * CONNECTED IS DECIDED BY useHandicapChipState — the same predicate the header's
 * "Connect HCP" chip uses — so the chip and this invitation can never disagree.
 * While that read is unsettled the slot renders NOTHING: not a shell, because a
 * shell here would be a claim about which of two surfaces is coming.
 *
 * NO NEW COPY. The sentence is common:connectGhost.champions.sub and the action
 * is common:connectGhost.cta; the heading is the standing shelf's own
 * courses:amateur.stream.shelf.standing. No bordered panel — heading row plus
 * body, the same geometry and gutter as the shelf it replaces.
 *
 * The CTA opens /manage/handicap, the destination the header chip opens.
 */
export function ScoresStandingSlot({
  viewerId,
  pos,
}: {
  viewerId: string | undefined;
  pos: number;
}) {
  const state = useHandicapChipState(viewerId);

  if (!state.settled) return null;
  if (state.connected) return <StandingShelf viewerId={viewerId} pos={pos} />;
  return <ConnectStandingInvite pos={pos} />;
}

function ConnectStandingInvite({ pos }: { pos: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation('courses');
  const { t: tc } = useTranslation('common');
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    shown.current = true;
    analyticsEvents.track('amateur_connect_invite_shown', { view: 'scores', pos });
  }, [pos]);

  return (
    <div style={{ fontFamily: SANS, padding: '0 16px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.015em', color: A.INK }}>
        {t('amateur.stream.shelf.standing', 'Where you stand')}
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 500, lineHeight: 1.4, color: A.MUTE }}>
        {tc('connectGhost.champions.sub')}
      </div>
      <button
        type="button"
        onClick={() => {
          analyticsEvents.track('amateur_connect_invite_tapped', { pos });
          navigate('/manage/handicap');
        }}
        style={{
          marginTop: 10,
          border: 0,
          background: 'transparent',
          padding: 0,
          color: A.INK,
          fontFamily: SANS,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        {tc('connectGhost.cta')}
      </button>
    </div>
  );
}

export default ScoresStandingSlot;
