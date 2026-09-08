/**
 * BLOCK 2 — OUR PICKS (BRIEF_TOUR_REBUILD).
 *
 * TOURNAMENT INTELLIGENCE, STATED AS READING RATHER THAN AS A BET.
 *
 * WHAT IT SHOWS: the reasoning behind each pick, the stated concern against it,
 * the dark horses, and — only once the event has settled — an honest,
 * SAMPLE-QUALIFIED record line. It does NOT show confidence, and it does not
 * show a win probability: a percentage beside a name reads as a claim the model
 * cannot support, and it was the one figure the old carousel could not justify.
 *
 * DARK, TOKENS ONLY. The light TIPicksCarousel is not dragged onto this canvas —
 * its palette is a light-surface palette (INK #0E1013, mint and rose chip fills)
 * and every one of those values fails here. This block reads the same data
 * (useAIPredictions, usePickLiveState, tiVerdict) through the dark analytical
 * tokens the rest of the page uses.
 *
 * THE PICKER GOVERNS THIS BLOCK. It follows the tour in view: the live event of
 * that tour when there is one, otherwise its next scheduled event.
 *
 * COLOUR LAW: under par reads red, level and over par read ink, true minus. No
 * amber — no viewing member appears here.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { DiscoverSectionHeading } from '@/components/ui/DiscoverSectionHeading';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { DISCOVER_FACT, DISCOVER_QUIET, FIGS, SANS } from '@/components/explore-tab-new/courseled/tokens';
import { TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { HAIRLINE_INK_7, INK, INK_MUTE, LIVE_INK } from '@/features/tourhub/_shared/tokens';
import { resolvePlayerAvatarCandidates } from '@/features/tourhub/_shared/resolvePlayerAvatar';
import { useAIPredictions, type AIPredictionData } from '@/features/tourhub/hooks/useAIPredictions';
import { usePickLiveState } from '@/features/tourhub/overview/data/usePickLiveState';
import { tiVerdict } from '@/features/tourhub/overview/sections/tiVerdict';
import { useTournamentsCache } from '@/hooks/useTournamentsCache';
import type { TourId } from '@/features/tourhub/hooks/useOverviewData';
import { TOUR_CONFIG } from '@/features/tourhub/hooks/useOverviewData';
import { analyticsEvents } from '@/utils/analyticsEvents';

/** Three picks on the page — the rest of the reasoning lives on each pick. */
const VISIBLE_PICKS = 3;

const KICKER: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase',
};

/** True minus, and the ramp the rest of the page uses. */
function scoreText(score: number | null): { text: string; tone: string } | null {
  if (score == null || !Number.isFinite(score)) return null;
  if (score === 0) return { text: 'E', tone: DISCOVER_FACT };
  return {
    text: score > 0 ? `+${score}` : `\u2212${Math.abs(score)}`,
    tone: score < 0 ? TOPAR_RED : DISCOVER_FACT,
  };
}

export function TourPicksBlock({ tour }: { tour: TourId }) {
  const navigate = useNavigate();
  const { data: cache } = useTournamentsCache();

  /* THE PICKER GOVERNS THE SUBJECT: the tour's live event, else its next one.
     THE SETTLED EVENT IS THE HONEST FALLBACK. Sportradar publishes a field only
     in the days before an event, and generate-predictions refuses to read a
     field it does not have ("no confirmed field"). Between events there is
     therefore nothing to predict — rather than an empty block for four days, the
     block reads the tour's LAST SETTLED event, where the picks exist AND the
     record line is true. The heading names the event either way, so the member
     is never shown last week's reading as though it were next week's. */
  const ahead = useMemo(() => {
    const live = (cache?.live ?? [])
      .filter((t) => t.status === 'inprogress' && t.season?.tour_name === tour)
      .sort((a, b) => (b.purse ?? 0) - (a.purse ?? 0))[0];
    if (live) return { id: live.id, name: live.name, live: true, settled: false };
    const next = (cache?.upcoming ?? [])
      .filter((t) => t.season?.tour_name === tour)
      .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];
    return next ? { id: next.id, name: next.name, live: false, settled: false } : null;
  }, [cache, tour]);

  const behind = useMemo(() => {
    const done = (cache?.completed ?? [])
      .filter((t) => t.season?.tour_name === tour)
      .sort((a, b) => b.end_date.localeCompare(a.end_date))[0];
    return done ? { id: done.id, name: done.name, live: false, settled: true } : null;
  }, [cache, tour]);

  const aheadQ = useAIPredictions(ahead?.id ?? null);
  const behindQ = useAIPredictions(behind?.id ?? null);

  const aheadPicks = aheadQ.data?.topContenders ?? [];
  const useAhead = aheadPicks.length > 0 || aheadQ.isLoading;
  const subject = useAhead ? ahead : behind ?? ahead;
  const predictions: AIPredictionData | null = (useAhead ? aheadQ.data : behindQ.data) ?? null;
  const isLoading = useAhead ? aheadQ.isLoading : behindQ.isLoading;

  const picks = (predictions?.topContenders ?? []).slice().sort((a, b) => a.rank - b.rank);
  const shown = picks.slice(0, VISIBLE_PICKS);
  const { data: liveMap } = usePickLiveState(
    subject?.id,
    picks.map((p) => p.playerId),
    { live: !!subject?.live },
  );

  /* THE RECORD LINE IS SAMPLE-QUALIFIED AND ONLY EXISTS ONCE IT IS TRUE. Before
     the event settles there is nothing to report, so nothing is said. */
  const record = useMemo(() => {
    if (!subject?.settled || picks.length === 0 || !liveMap) return null;
    const inside = picks.reduce((n, p) => {
      const k = tiVerdict(liveMap[p.playerId]).kind;
      return n + (k === 'win' || k === 'top20' ? 1 : 0);
    }, 0);
    return `${inside} of ${picks.length} picks finished inside the top 20 at ${subject.name}`;
  }, [subject, picks, liveMap]);

  /* THE SKELETON IS THE SIZE OF THE REAL CARD, NEVER LARGER: heading, then three
     pick rows. Generation on a cache miss runs on the edge function, so the wait
     can be tens of seconds — the held shape has to be honest about what lands. */
  if (isLoading) {
    return (
      <section style={{ paddingTop: 32, fontFamily: SANS }} aria-hidden>
        <div style={{ height: 18, width: 120, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              marginTop: 14,
              height: 78,
              borderBottom: `0.5px solid ${HAIRLINE_INK_7}`,
              background: 'rgba(255,255,255,0.04)',
            }}
          />
        ))}
      </section>
    );
  }
  /* AN EMPTY SECTION RENDERS NOTHING — no heading over no content. */
  if (!subject || shown.length === 0) return null;

  return (
    <section style={{ paddingTop: 32, fontFamily: SANS, ...FIGS }}>
      <DiscoverSectionHeading
        title="Our picks"
        right={`${TOUR_CONFIG[tour].name} \u00b7 ${subject.name}`}
      />

      {predictions?.editorialFraming && (
        <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 400, lineHeight: 1.5, color: INK_MUTE }}>
          {predictions.editorialFraming}
        </p>
      )}

      {shown.map((pick) => {
        const verdict = tiVerdict(liveMap?.[pick.playerId]);
        const score = scoreText(liveMap?.[pick.playerId]?.score ?? null);
        const reasoning = pick.pulledQuote || pick.reasons?.[0] || null;
        return (
          <button
            key={pick.playerId}
            type="button"
            onClick={() => {
              analyticsEvents.track('tour_pick_pressed', { rank: pick.rank });
              navigate(`/tourhub/player/${pick.playerId}`);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: `0.5px solid ${HAIRLINE_INK_7}`,
              textAlign: 'left',
              fontFamily: SANS,
              cursor: 'pointer',
              ...FIGS,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ ...KICKER, width: 26, flex: '0 0 26px', color: INK_MUTE }}>
                {pick.rank}
              </span>
              <SquircleAvatar
                size={38}
                srcCandidates={resolvePlayerAvatarCandidates({
                  name: pick.playerName,
                  photoUrl: pick.photoUrl,
                  tourSlug: tour,
                })}
                alt={pick.playerName}
                userId={pick.playerId}
                hairlineRing
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 700,
                    color: INK,
                    letterSpacing: '-0.01em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pick.playerName}
                </span>
                {pick.worldRanking > 0 && (
                  <span style={{ ...KICKER, color: DISCOVER_QUIET }}>World {pick.worldRanking}</span>
                )}
              </span>
              {verdict.label && (
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
                  <span style={{ ...KICKER, color: verdict.kind === 'mc' ? INK_MUTE : LIVE_INK }}>
                    {verdict.label}
                  </span>
                  {score && (
                    <span style={{ fontSize: 14, fontWeight: 200, color: score.tone }}>{score.text}</span>
                  )}
                </span>
              )}
            </span>

            {reasoning && (
              <span
                style={{
                  display: 'block',
                  marginTop: 8,
                  fontSize: 13,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: DISCOVER_FACT,
                }}
              >
                {reasoning}
              </span>
            )}

            {/* THE CONCERN IS STATED, not softened: a pick with no stated risk is
                an advertisement. */}
            {pick.concern && (
              <span
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: 12.5,
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: INK_MUTE,
                }}
              >
                Concern: {pick.concern}
              </span>
            )}
          </button>
        );
      })}

      {picks.length > VISIBLE_PICKS && (
        <button
          type="button"
          onClick={() => {
            analyticsEvents.track('tour_picks_see_all', { total: picks.length });
            navigate(`/tourhub/tournament/${subject.id}`);
          }}
          style={{
            ...KICKER,
            display: 'block',
            width: '100%',
            marginTop: 12,
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: INK,
            fontFamily: SANS,
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          See all {picks.length} picks
        </button>
      )}

      {(predictions?.darkHorses?.length ?? 0) > 0 && (
        <div style={{ paddingTop: 24 }}>
          <div style={{ ...KICKER, color: DISCOVER_QUIET, paddingBottom: 8 }}>Dark horses</div>
          {predictions!.darkHorses.slice(0, 3).map((horse) => (
            <button
              key={horse.playerId}
              type="button"
              onClick={() => navigate(`/tourhub/player/${horse.playerId}`)}
              style={{
                display: 'block',
                width: '100%',
                padding: '11px 0',
                background: 'transparent',
                border: 'none',
                borderBottom: `0.5px solid ${HAIRLINE_INK_7}`,
                textAlign: 'left',
                fontFamily: SANS,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: INK }}>
                {horse.playerName}
              </span>
              {horse.hook && (
                <span
                  style={{ display: 'block', marginTop: 4, fontSize: 12.5, fontWeight: 400, lineHeight: 1.5, color: INK_MUTE }}
                >
                  {horse.hook}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {record && (
        <p style={{ margin: '14px 0 0', ...KICKER, color: DISCOVER_QUIET, lineHeight: 1.5 }}>{record}</p>
      )}
    </section>
  );
}

export default TourPicksBlock;
