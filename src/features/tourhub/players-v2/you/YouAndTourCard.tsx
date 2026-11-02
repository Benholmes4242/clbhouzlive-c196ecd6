/**
 * YouAndTourCard — Players build 3 (signed-off mock). Sits after Your players
 * (or the race card), before In form. Renders nothing unless isVisible holds.
 * All arithmetic lives in youAndTourRules; amber is "you" only.
 */
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { P, FIG } from '../playersTokens';
import type { PageData } from '../pageModel';
import { surname } from '../playersRules';
import { useMyHoleScoring, useTourHoleAverages } from './useYouAndTour';
import { AMBER_SEG, breakdown, footLine, HOLE_NAME, HOLE_TYPES, isVisible, mine, segmentColours, signed, tours } from './youAndTourRules';

export function YouAndTourCard({ data }: { data: PageData }) {
  const { user } = useSupabaseSession();
  const navigate = useNavigate();
  const { data: tour } = useTourHoleAverages(data.tour, data.season);
  const { data: me } = useMyHoleScoring(user?.id);
  const shown = isVisible({ signedIn: !!user, mine: me, tour });
  const viewed = useRef(false);
  useEffect(() => {
    if (shown && me && !viewed.current) {
      viewed.current = true;
      analyticsEvents.track('tour_you_card_viewed', { tour: data.tour, rounds: me.rounds });
    }
  }, [shown, me, data.tour]);
  if (!shown || !me || !tour) return null;

  const b = breakdown(me, tour);
  const colours = segmentColours(b.lost, b.costliest);
  const leader = data.players[0];
  const lstat = leader?.playerId ? data.scorecard?.get(leader.playerId) : undefined;
  const foot = footLine({ leaderName: leader?.name, leaderBogey: lstat?.bogey_rate, leaderRounds: lstat?.rounds, tourBogey: tour.bogey_rate, myBogey: me.bogey_rate }, surname);
  const small = { display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', color: P.DIM, marginTop: 2 } as const;

  return (
    <section
      data-front-card="you_and_tour"
      role="button"
      tabIndex={0}
      onClick={() => { analyticsEvents.track('tour_you_card_tapped', { tour: data.tour }); navigate('/profile?tab=handicap'); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
      style={{ margin: '14px 16px 0', padding: '14px 16px 12px', borderRadius: 18, background: P.CARD, border: '1px solid rgba(247,147,30,0.35)', cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: AMBER_SEG }}>YOU AND THE TOUR</span>
        <span style={{ fontSize: 11.5, color: P.DIM, whiteSpace: 'nowrap', ...FIG }}>Your last {me.rounds} rounds</span>
      </div>
      <p data-you-line style={{ margin: '4px 0 0', fontSize: 13, lineHeight: 1.4, color: P.MUTE }}>
        Against the tour, you give away <b style={{ color: P.INK, fontWeight: 700, ...FIG }}>{b.total.toFixed(1)}</b> shots a round. {HOLE_NAME[b.costliest]} cost you the most: <b style={{ color: P.INK, fontWeight: 700, ...FIG }}>{b.lost[b.costliest].toFixed(1)}</b>.
      </p>
      <div style={{ marginTop: 12, display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>
        {HOLE_TYPES.map((k) => <i key={k} data-seg={k} data-seg-colour={colours[k]} style={{ display: 'block', height: '100%', flexGrow: b.lost[k], flexBasis: 0, background: colours[k] }} />)}
      </div>
      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 11, color: P.DIM, ...FIG }}>
        {HOLE_TYPES.map((k) => <span key={k}>{HOLE_NAME[k]} {b.lost[k].toFixed(1)}</span>)}
      </div>
      <div style={{ marginTop: 10 }}>
        {HOLE_TYPES.map((k, i) => (
          <div key={k} data-you-row={k} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 74px', columnGap: 8, alignItems: 'baseline', minHeight: 36, paddingTop: 8, borderTop: i ? `1px solid ${P.HAIR}` : undefined }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: P.MUTE }}>{HOLE_NAME[k].toUpperCase()}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: P.INK, ...FIG }}>{signed(mine(me, k))}<small style={small}>YOU</small></span>
            <span style={{ fontSize: 14, fontWeight: 700, color: P.MUTE, ...FIG }}>{signed(tours(tour, k))}<small style={small}>TOUR</small></span>
            <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, color: P.INK, ...FIG }}>{b.lost[k].toFixed(1)}<small style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: P.DIM }}>a round</small></span>
          </div>
        ))}
      </div>
      <div data-you-foot style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.HAIR}`, fontSize: 12, color: P.MUTE, ...FIG }}>
        {foot.map((s, i) => (s.bold ? <b key={i} style={{ color: P.INK, fontWeight: 600 }}>{s.text}</b> : <span key={i}>{s.text}</span>))}
      </div>
    </section>
  );
}
