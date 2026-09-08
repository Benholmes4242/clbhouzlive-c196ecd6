/**
 * THE TOUR HERO (BRIEF_TOUR_REBUILD, block 0).
 *
 * 340px, full bleed into the notch, on the same geometry as the Amateur hero
 * so the two bottom-nav destinations open the same way. The venue photograph is
 * the frame; the state decides what sits on it.
 *
 * LIVE           tournament, round + thru, top three.
 * JUST FINISHED  champion, winning score, tournament, venue.
 * NOTHING LIVE   next tournament, date, venue, defending champion.
 *
 * TRUE MINUS, and the analytical ramp: under par reads red, level and over par
 * read ink. No amber anywhere in this hero — amber is the viewing member and a
 * deliberate Post control, and neither is on a tour photograph.
 */

import { useNavigate } from 'react-router-dom';

import { CourseImageFallback } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import { DISCOVER_FACT, DISCOVER_QUIET, KICKER } from '@/components/explore-tab-new/courseled/tokens';
import { FIGS, TOPAR_RED } from '@/features/courses/components/holes/analytical/tokens';
import { useVenueImage } from '@/features/tourhub/hooks/useVenueImage';
import { FONT, INK_MUTE } from '@/features/tourhub/_shared/tokens';
import { SCRIM_STANDOUT } from '@/styles/photoScrim';

import { useTourHeroState, type HeroPlayer, type TourHeroState } from './useTourHeroState';

export const TOUR_HERO_H = 340;

const SHADOW = '0 1px 2px rgba(0,0,0,0.72)';

/** Local deepening, this hero only — SCRIM_STANDOUT fades out exactly where the caption stack sits. */
const DEEPEN =
  'linear-gradient(0deg, rgba(10,14,10,0.74) 0%, rgba(10,14,10,0.58) 28%, rgba(10,14,10,0.32) 42%, rgba(10,14,10,0) 54%)';

function toPar(score: number | null): { text: string; tone: string } | null {
  if (score == null) return null;
  if (score === 0) return { text: 'E', tone: DISCOVER_FACT };
  /* TRUE MINUS (U+2212), never the hyphen a template literal would give. */
  return {
    text: score > 0 ? `+${score}` : `\u2212${Math.abs(score)}`,
    tone: score < 0 ? TOPAR_RED : DISCOVER_FACT,
  };
}

function dateLine(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function venueLine(t: TourHeroState['tournament']): string | null {
  if (!t) return null;
  const place = [t.venue_city, t.venue_country].filter(Boolean).join(', ');
  const venue = t.venue_course_name || t.venue_name;
  return [venue, place].filter(Boolean).join(' · ') || null;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...KICKER, display: 'block', color: DISCOVER_QUIET, textShadow: SHADOW }}>
      {children}
    </span>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        marginTop: 6,
        fontSize: 22,
        lineHeight: 1.1,
        fontWeight: 800,
        letterSpacing: '-0.01em',
        color: DISCOVER_FACT,
        textShadow: SHADOW,
      }}
    >
      {children}
    </span>
  );
}

function Meta({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'block',
        marginTop: 6,
        fontSize: 12,
        fontWeight: 600,
        color: INK_MUTE,
        textShadow: SHADOW,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

/** One ranked line of the live top three: position, name, to-par. */
function LiveRow({ p, i }: { p: HeroPlayer; i: number }) {
  const par = toPar(p.toPar);
  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        marginTop: i === 0 ? 8 : 3,
        fontSize: 13,
        fontWeight: 700,
        color: DISCOVER_FACT,
        textShadow: SHADOW,
      }}
    >
      <span className="tabular-nums" style={{ width: 14, color: DISCOVER_QUIET, fontWeight: 700 }}>
        {p.position ?? i + 1}
      </span>
      <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {p.name}
      </span>
      {par && (
        <span className="tabular-nums" style={{ marginLeft: 'auto', color: par.tone }}>
          {par.text}
        </span>
      )}
    </span>
  );
}

export function TourHero() {
  const navigate = useNavigate();
  const state = useTourHeroState();
  const t = state.tournament;
  const venueImage = useVenueImage(t?.venue_name ?? null, t?.venue_city ?? null);

  const champion = state.kind === 'finished' ? state.players[0] ?? null : null;
  const championPar = toPar(champion?.toPar ?? null);

  return (
    <section
      style={{
        position: 'relative',
        height: TOUR_HERO_H,
        overflow: 'hidden',
        fontFamily: FONT,
        ...FIGS,
      }}
    >
      <CourseImageFallback
        courseId={venueImage.data?.courseId ?? null}
        courseName={t?.venue_name ?? null}
        imageUrl={venueImage.data?.imageUrl ?? null}
        flatWhenEmpty
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 0 }}
      >
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM_STANDOUT }} />
        <span aria-hidden style={{ position: 'absolute', inset: 0, background: DEEPEN }} />
      </CourseImageFallback>

      {t && (
        <button
          type="button"
          onClick={() => navigate(`/tourhub/tournament/${t.id}`)}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 1,
            display: 'block',
            width: 'auto',
            padding: 0,
            border: 0,
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: FONT,
          }}
        >
          {/* ---------------- LIVE ---------------- */}
          {state.kind === 'live' && (
            <>
              <Kicker>
                {[
                  'Live',
                  state.round ? `Round ${state.round}` : null,
                  state.thru != null ? `Thru ${state.thru}` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Kicker>
              <Title>{t.name}</Title>
              {state.players.map((p, i) => (
                <LiveRow key={`${p.name}-${i}`} p={p} i={i} />
              ))}
            </>
          )}

          {/* ---------------- JUST FINISHED ---------------- */}
          {state.kind === 'finished' && (
            <>
              <Kicker>Champion</Kicker>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <Title>{champion?.name ?? t.name}</Title>
                {championPar && (
                  <span
                    className="tabular-nums"
                    style={{
                      marginLeft: 'auto',
                      fontSize: 20,
                      fontWeight: 800,
                      color: championPar.tone,
                      textShadow: SHADOW,
                    }}
                  >
                    {championPar.text}
                  </span>
                )}
              </span>
              <Meta>{t.name}</Meta>
              {venueLine(state.tournament) && <Meta>{venueLine(state.tournament)}</Meta>}
            </>
          )}

          {/* ---------------- NOTHING LIVE ---------------- */}
          {state.kind === 'upcoming' && (
            <>
              <Kicker>{['Next', dateLine(t.start_date)].filter(Boolean).join(' · ')}</Kicker>
              <Title>{t.name}</Title>
              {venueLine(state.tournament) && <Meta>{venueLine(state.tournament)}</Meta>}
              {state.defendingChampion && <Meta>Defending: {state.defendingChampion}</Meta>}
            </>
          )}
        </button>
      )}
    </section>
  );
}

export default TourHero;
