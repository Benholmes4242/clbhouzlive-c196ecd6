/**
 * TYPE — THE HERO EXCEPTION (BRIEF_TOUR_OVERVIEW_TYPE_SCALE, Part 2).
 * The hero is a broadcast surface. Tracked-out caps over photography read
 * larger than their point size, so a ticker segment, a band label or a rank
 * marker takes the AXIS floor of 10 rather than the READ floor of 11 — the
 * same exception granted to the scorecard axis and the chart ticks. It covers
 * COORDINATES AND MARKERS ONLY. It does NOT cover leader names, tournament
 * names, course names, scores, or any sentence: those are language and take
 * 11. Nothing goes below 10.
 */
/**
 * ChampionStrip — THE champion block (.tv-champion), shared by the tournament
 * page and the Tour overview on a completed event: a 46px face inside a GOLD
 * squircle ring, CHAMPION in gold, the name at 18px/800, the score at
 * 26px/800 with "BY {words}" beneath, then the narrative line. No trophy
 * icon, no flag. Styles live in championStrip.css, scoped to .tv-champion so
 * they resolve off .tournament-v3. The old overview strip presentation was
 * removed when the overview adopted this block — nothing else used it.
 */

import { copy as tvCopyPlayoff } from '../../../tournament-v2/data/tournamentRules';
import { useTranslation } from 'react-i18next';
import { GOLD } from '../HybridHero.constants';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ActiveRing } from '@/features/find-people/ActiveRing';
import './championStrip.css';

const PLAYOFF_LABEL = tvCopyPlayoff('playoff');

interface ChampionStripProps {
  name: string;
  score: string;
  /** Numeric to-par behind `score` — drives the canonical under-par treatment (never gold). */
  scoreValue?: number | null;
  scoreLabel?: string;
  eyebrow?: string;
  /** Full shared resolver walk; preserve the player's identity on every miss. */
  avatarCandidates?: string[];
  playerKey?: string | null;
  /** championNarrative parts: the how-it-was-won line beneath the block. */
  narrativeParts?: { text: string; bold?: boolean }[];
}

/** --tv-panel (#121216): the ring's 2px gap reads the block's own ground. */
const TV_PANEL = '#121216';

/** The champion's face carries a GOLD squircle ring AROUND it — the same
 *  constant as the CHAMPION label (--tv-gold resolves to the same #FBBC2E).
 *  Built on ActiveRing exactly like the pick ring: 1.5px ring, 2px gap in
 *  the block's background, then the avatar at 34%. The avatar keeps
 *  hideRing — no grey hairline inside. */
function PlayerHead({ size = 46, avatarCandidates, name, playerKey }: { size?: number; avatarCandidates?: string[]; name: string; playerKey?: string | null }) {
  return (
    <ActiveRing active surface="canvas" gapColor={TV_PANEL} ringColor={GOLD}>
      <SquircleAvatar
        srcCandidates={avatarCandidates}
        alt={name}
        userId={playerKey ?? name}
        size={size}
        hideRing
      />
    </ActiveRing>
  );
}

export function ChampionStrip({
  name,
  score,
  scoreValue,
  scoreLabel,
  eyebrow,
  avatarCandidates,
  playerKey,
  narrativeParts,
}: ChampionStripProps) {
  const { t } = useTranslation('tourhub');
  const resolvedEyebrow = eyebrow ?? t('overview.champion.eyebrow');

  return (
    <section className="tv-champion" data-tv-section="champion">
      <div className="tv-champion-top">
        <PlayerHead size={46} avatarCandidates={avatarCandidates} name={name} playerKey={playerKey} />
        <div>
          <div className="tv-champion-label">{resolvedEyebrow}</div>
          <div className="tv-champion-name">{name}</div>
        </div>
        <div className="tv-champion-score">
          <b className={scoreValue != null && scoreValue < 0 ? 'tv-under' : ''}>{score}</b>
          {scoreLabel && <small data-playoff={scoreLabel === PLAYOFF_LABEL || undefined}>{scoreLabel}</small>}
        </div>
      </div>
      {narrativeParts && narrativeParts.length > 0 && (
        <p className="tv-champion-line">
          {narrativeParts.map((p, i) => (p.bold ? <b key={i}>{p.text}</b> : <span key={i}>{p.text}</span>))}
        </p>
      )}
    </section>
  );
}

export default ChampionStrip;
