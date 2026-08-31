/**
 * StoryBody — walks a story's body_blocks IN ORDER and renders each by type.
 *
 * The embeds are the point of the format. The leaderboard block REUSES the
 * existing BoardTable (the same component the Leaderboard tab paints), while
 * the player block has a story-specific presentation paired with the story's
 * tournament card.
 *
 * An unrecognised block never reaches this component: parseStoryBlocks drops it,
 * so a new server-side block type is invisible on an old client and breaks
 * nothing.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import CountryFlag from '@/components/ui/country-flag';
import { BoardTable, type BoardEntry, type CutState } from '../leaderboard/BoardTable';
import { useTournamentMeta } from '../leaderboard/useTournamentMeta';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { resolveCutDisplay } from '../_shared/cutDisplay';
import { resolvePlayerAvatarCandidates } from '../_shared/resolvePlayerAvatar';
import type { StoryBlock } from './blocks';
import { FONT, HAIRLINE_INK_10, INK, INK_FAINT, INK_MUTE, SLATE_100, AMBER } from '../_shared/tokens';

/** Inline embeds sit on the panel wash, not the page canvas. */
const EMBED_BG = 'rgba(255,255,255,0.04)';

/** How many rows an INLINE board shows before it defers to the full board. */
const INLINE_BOARD_ROWS = 10;

const PLAYER_TOUR_LABEL: Record<string, string> = {
  pga: 'PGA Tour',
  lpga: 'LPGA',
  euro: 'DP World Tour',
  dpwt: 'DP World Tour',
  pgad: 'Korn Ferry Tour',
  champ: 'PGA Tour Champions',
  liv: 'LIV Golf',
};

function Paragraph({ text }: { text: string }) {
  return (
    <p style={{ margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.65, color: INK_MUTE, whiteSpace: 'pre-wrap' }}>
      {text}
    </p>
  );
}

function Heading({ text }: { text: string }) {
  return (
    <h2
      style={{
        margin: '22px 0 10px',
        fontSize: 16,
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.01em',
        color: INK,
      }}
    >
      {text}
    </h2>
  );
}

/**
 * IMAGE BLOCKS ARE FULL CONTENT WIDTH, not full-bleed — the lead image is the
 * only full-bleed element on the page, and that distinction is what stops a
 * six-image story reading as a slideshow with paragraphs wedged between.
 */
function ImageBlock({ url, caption, credit }: { url: string; caption?: string | null; credit?: string | null }) {
  return (
    <figure style={{ margin: '4px 0 18px' }}>
      <img
        src={url}
        alt={caption ?? ''}
        loading="lazy"
        style={{ width: '100%', display: 'block', borderRadius: 10, background: SLATE_100 }}
      />
      {(caption || credit) && (
        <figcaption style={{ marginTop: 6 }}>
          {caption && <span style={{ fontSize: 12, lineHeight: 1.4, color: INK_MUTE }}>{caption}</span>}
          {credit && (
            <span style={{ fontSize: 10, lineHeight: 1.4, color: INK_FAINT, marginLeft: caption ? 6 : 0 }}>
              {credit}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function Quote({ text, attribution }: { text: string; attribution?: string | null }) {
  return (
    <blockquote
      style={{
        margin: '18px 0 20px',
        paddingLeft: 12,
        borderLeft: `3px solid ${AMBER}`,
      }}
    >
      <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.4, letterSpacing: '-0.015em', color: INK }}>
        {text}
      </div>
      {attribution && (
        <div
          style={{
            marginTop: 6,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: INK_FAINT,
          }}
        >
          {attribution}
        </div>
      )}
    </blockquote>
  );
}

/**
 * The inline board. A FINISHED tournament shows its FINAL board, not an empty
 * live one — the rows are the same stored rows either way, so the only thing
 * status changes is the label above them.
 */
function LeaderboardBlock({ tournamentId }: { tournamentId: string }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data: meta } = useTournamentMeta(tournamentId, { live: true });
  const { data: entries, isLoading } = useTourLeaderboard(tournamentId);

  const status = (meta?.status ?? '').toLowerCase();
  const isLive = status === 'inprogress';
  const currentRound = meta?.current_round ?? null;

  const rows = (entries ?? []) as BoardEntry[];
  const shown = rows.slice(0, INLINE_BOARD_ROWS);
  // Closed events can outlive a stale/null current_round metadata value. The
  // board rows already carry the authoritative completed rounds, so derive the
  // movement round from those same cached rows rather than issuing a query.
  const latestPlayedRound = rows.reduce((latest, entry) => {
    const rounds = [entry.round_1, entry.round_2, entry.round_3, entry.round_4];
    for (let i = rounds.length - 1; i >= 0; i -= 1) {
      if (rounds[i] != null) return Math.max(latest, i + 1);
    }
    return latest;
  }, 0);
  const boardRound = currentRound ?? (latestPlayedRound > 0 ? latestPlayedRound : null);

  const cutDisplay = resolveCutDisplay({
    status,
    currentRound,
    cutRound: meta?.cut_round ?? null,
    cutline: meta?.cutline ?? null,
    projectedCutline: meta?.projected_cutline ?? null,
  });
  // The inline board is a TRUNCATED view, so it never prints the cut sentence —
  // a cut line drawn across ten rows would be a lie about the field.
  const cutState: CutState = { kind: 'none', cutline: null, extraCount: 0 };
  void cutDisplay;

  if (isLoading) {
    return <Skeleton style={{ height: 220, width: '100%', margin: '18px 0', borderRadius: 12 }} />;
  }
  if (shown.length === 0) return null;

  return (
    <section
      style={{
        margin: '18px 0 20px',
        background: EMBED_BG,
        border: `1px solid ${HAIRLINE_INK_10}`,
        borderRadius: 14,
        overflow: 'hidden',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '11px 16px 0',
        }}
      >
        {isLive && (
          <span aria-hidden style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
        )}
        <span
          style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: isLive ? '#10B981' : INK_FAINT,
          }}
        >
          {isLive
            ? currentRound
              ? t('news.liveRound', { defaultValue: 'LIVE \u00b7 ROUND {{n}}', n: currentRound })
              : t('news.live', 'LIVE')
            : t('news.finalBoard', 'FINAL')}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: INK, marginLeft: 4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {meta?.name ?? ''}
        </span>
      </div>

      <BoardTable
        entries={shown}
        movementEntries={rows}
        cutState={cutState}
        /* A FINISHED board has no current round to highlight — the amber column
           header would claim a round is still being played. */
        currentRound={boardRound}
        surface={EMBED_BG}
        onRowClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
      />

      {rows.length > shown.length && (
        <button
          type="button"
          onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            width: '100%', padding: '11px 16px', cursor: 'pointer',
            background: 'none', border: 'none', borderTop: `1px solid ${HAIRLINE_INK_10}`,
            fontFamily: FONT, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em',
            textTransform: 'uppercase', color: INK,
          }}
        >
          {t('news.fullBoard', 'FULL LEADERBOARD')}
          <ChevronRight size={13} strokeWidth={2.4} aria-hidden />
        </button>
      )}
    </section>
  );
}

function PlayerBlock({ playerId }: { playerId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data } = useQuery({
    queryKey: ['tour-stories', 'player-embed', playerId],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data: p } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
        .eq('id', playerId)
        .maybeSingle();
      if (!p) return null;
      const { data: r } = await supabase
        .from('sr_world_rankings')
        .select('rank')
        .eq('player_id', playerId)
        .order('rank', { ascending: true })
        .limit(1)
        .maybeSingle();
      return { player: p as any, rank: (r as any)?.rank ?? null };
    },
  });

  if (!data?.player) return null;
  const p = data.player;
  const name =
    p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || '';
  const primaryTour = p.tour_codes?.[0]?.toLowerCase() ?? null;
  const tour = primaryTour ? (PLAYER_TOUR_LABEL[primaryTour] ?? primaryTour.toUpperCase()) : null;
  const rank = typeof data.rank === 'number' && data.rank > 0 ? `World No. ${data.rank}` : null;
  const subline = [tour, rank].filter(Boolean).join(' \u00b7 ');
  const avatarCandidates = resolvePlayerAvatarCandidates({
    name,
    photoUrl: p.photo_url ?? null,
    tourSlug: primaryTour,
  });

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${p.id}`)}
      className="active:scale-[0.99]"
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        margin: '18px 0 20px',
        padding: '14px 12px',
        background: EMBED_BG,
        border: `1px solid ${HAIRLINE_INK_10}`,
        borderRadius: 14,
        cursor: 'pointer',
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: INK_FAINT,
        }}
      >
        {t('news.player', 'PLAYER')}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <SquircleAvatar
          size={40}
          srcCandidates={avatarCandidates}
          alt={name}
          userId={p.id}
          hairlineRing
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span
              style={{
                fontSize: 14.5,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {name}
            </span>
            <CountryFlag country={p.country ?? p.country_code ?? null} size="sm" />
          </div>
          {subline && (
            <div style={{ marginTop: 3, fontSize: 12, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
              {subline}
            </div>
          )}
        </div>
        <ChevronRight size={16} color={INK_FAINT} strokeWidth={2.2} aria-hidden />
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ *
 * The two stat blocks
 * ------------------------------------------------------------------ */

/** A figure and its label. `value` null means the figure is OMITTED entirely. */
interface Figure { label: string; value: string | null }

/**
 * The figure rail both stat blocks share: three per row, hairline gutters, no
 * placeholders. A null figure is dropped BEFORE layout, so four figures lay out
 * as four and never as four and a dash (S1.5).
 */
function FigureGrid({ figures }: { figures: Figure[] }) {
  const shown = figures.filter((f) => f.value !== null);
  if (shown.length === 0) return null;
  return (
    <div
      style={{
        marginTop: 12,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: '12px 8px',
      }}
    >
      {shown.map((f) => (
        <div key={f.label} style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_FAINT,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {f.label}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 17,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            {f.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Header row shared by both blocks: avatar, name, flag, kicker and a subline. */
function StatHeader({
  player,
  kicker,
  subline,
}: {
  player: any;
  kicker: string;
  subline: string | null;
}) {
  const name = player.full_name || [player.first_name, player.last_name].filter(Boolean).join(' ') || '';
  const primaryTour = player.tour_codes?.[0]?.toLowerCase() ?? null;
  const candidates = resolvePlayerAvatarCandidates({
    name,
    photoUrl: player.photo_url ?? null,
    tourSlug: primaryTour,
  });
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <SquircleAvatar size={40} srcCandidates={candidates} alt={name} userId={player.id} hairlineRing />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK_FAINT }}>
          {kicker}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14.5, fontWeight: 700, color: INK, lineHeight: 1.25,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <CountryFlag country={player.country ?? player.country_code ?? null} size="sm" />
        </div>
        {subline && (
          <div style={{ marginTop: 2, fontSize: 11, color: INK_MUTE, fontVariantNumeric: 'tabular-nums' }}>
            {subline}
          </div>
        )}
      </div>
    </div>
  );
}

const CARD: React.CSSProperties = {
  margin: '18px 0 20px',
  padding: '14px 12px',
  background: EMBED_BG,
  border: `1px solid ${HAIRLINE_INK_10}`,
  borderRadius: 14,
  fontFamily: FONT,
};

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};
const dec = (v: unknown, places: number): string | null => {
  const n = num(v);
  return n === null ? null : n.toFixed(places);
};
const pct = (v: unknown): string | null => {
  const n = num(v);
  return n === null ? null : `${n.toFixed(1)}%`;
};
/** Strokes gained is signed and uses a TRUE minus, never a hyphen. */
const signed = (v: unknown, places: number): string | null => {
  const n = num(v);
  if (n === null) return null;
  if (n === 0) return (0).toFixed(places);
  return n > 0 ? `+${n.toFixed(places)}` : `\u2212${Math.abs(n).toFixed(places)}`;
};

/**
 * [stat:...] — a player's SEASON card, read live from sr_player_statistics.
 *
 * A player can hold a row per season, so the LATEST season wins. Nothing is
 * frozen at parse time: only the player id is stored (S3.6).
 */
function StatBlock({ playerId }: { playerId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data } = useQuery({
    queryKey: ['tour-stories', 'stat-embed', playerId],
    staleTime: 10 * 60_000,
    enabled: !!playerId,
    queryFn: async () => {
      const { data: p } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
        .eq('id', playerId)
        .maybeSingle();
      if (!p) return null;

      const { data: rows } = await supabase
        .from('sr_player_statistics')
        .select(
          'season_id, scoring_average, driving_distance, driving_accuracy, greens_in_reg, strokes_gained_putting, fedex_rank',
        )
        .eq('player_id', playerId);
      const stats = (rows ?? []) as any[];
      if (stats.length === 0) return null;

      // Pick the newest season. sr_player_statistics carries no year of its own.
      let stat = stats[0];
      if (stats.length > 1) {
        const ids = stats.map((r) => r.season_id).filter(Boolean);
        const { data: seasons } = await supabase.from('sr_seasons').select('id, year').in('id', ids);
        const yearOf = new Map((seasons ?? []).map((s: any) => [s.id, s.year ?? 0]));
        stat = stats.reduce((best, r) =>
          (yearOf.get(r.season_id) ?? 0) > (yearOf.get(best.season_id) ?? 0) ? r : best,
        );
      }

      const { data: r } = await supabase
        .from('sr_world_rankings')
        .select('rank')
        .eq('player_id', playerId)
        .order('rank', { ascending: true })
        .limit(1)
        .maybeSingle();

      return { player: p as any, stat, worldRank: (r as any)?.rank ?? null };
    },
  });

  if (!data?.stat) return null;
  const { player, stat } = data;

  const fedex = num(stat.fedex_rank);
  const world = num(data.worldRank);
  const subline =
    fedex && fedex > 0
      ? t('news.fedexRank', { defaultValue: 'FedExCup No. {{n}}', n: fedex })
      : world && world > 0
        ? t('news.worldRank', { defaultValue: 'World No. {{n}}', n: world })
        : null;

  const figures: Figure[] = [
    { label: t('news.fig.scoringAvg', 'SCORING AVG'), value: dec(stat.scoring_average, 2) },
    { label: t('news.fig.drivingDist', 'DRIVING DIST'), value: dec(stat.driving_distance, 1) },
    { label: t('news.fig.drivingAcc', 'DRIVING ACC'), value: pct(stat.driving_accuracy) },
    { label: t('news.fig.greensInReg', 'GREENS IN REG'), value: pct(stat.greens_in_reg) },
    { label: t('news.fig.sgPutting', 'SG PUTTING'), value: signed(stat.strokes_gained_putting, 2) },
  ];

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/player/${player.id}`)}
      className="active:scale-[0.99]"
      style={{ ...CARD, display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
    >
      <StatHeader player={player} kicker={t('news.season', 'THE SEASON')} subline={subline} />
      <FigureGrid figures={figures} />
    </button>
  );
}

/**
 * [round:...] — what a player did at ONE tournament, read live from
 * sr_scorecards.
 *
 * THE HOLE-1 QUIRK, and it is not a bug: sr_scorecards holds one row per hole,
 * but the ROUND-level summary counts — birdies, pars, bogeys, eagles,
 * round_strokes, round_score — are written ONLY on the hole_number = 1 row of
 * each round. Holes 2-18 carry nulls in those columns. Reading every hole row
 * and summing would therefore return the same totals with 18x the payload;
 * reading hole 7 would return nothing at all and look like missing data. So the
 * query filters hole_number = 1 and each returned row IS one round.
 */
function RoundBlock({ playerId, tournamentId }: { playerId: string; tournamentId: string }) {
  const navigate = useNavigate();
  const { t } = useTranslation('tourhub');
  const { data } = useQuery({
    queryKey: ['tour-stories', 'round-embed', playerId, tournamentId],
    staleTime: 2 * 60_000,
    enabled: !!playerId && !!tournamentId,
    queryFn: async () => {
      const { data: p } = await supabase
        .from('sr_players')
        .select('id, full_name, first_name, last_name, country, country_code, photo_url, tour_codes')
        .eq('id', playerId)
        .maybeSingle();
      if (!p) return null;

      // hole_number = 1 ONLY — see the block comment above.
      const { data: rows } = await supabase
        .from('sr_scorecards')
        .select('round_number, birdies, eagles, pars, bogeys, round_strokes, round_score')
        .eq('player_id', playerId)
        .eq('tournament_id', tournamentId)
        .eq('hole_number', 1)
        .order('round_number', { ascending: true });
      const rounds = (rows ?? []) as any[];
      if (rounds.length === 0) return null;

      const { data: meta } = await supabase
        .from('sr_tournaments')
        .select('name')
        .eq('id', tournamentId)
        .maybeSingle();

      const sum = (key: string) =>
        rounds.reduce<number | null>((acc, r) => {
          const n = num(r[key]);
          return n === null ? acc : (acc ?? 0) + n;
        }, null);

      const strokes = rounds.map((r) => num(r.round_strokes)).filter((n): n is number => n !== null);

      return {
        player: p as any,
        tournamentName: (meta as any)?.name ?? null,
        birdies: sum('birdies'),
        eagles: sum('eagles'),
        pars: sum('pars'),
        bogeys: sum('bogeys'),
        roundCount: rounds.length,
        bestRound: strokes.length > 0 ? Math.min(...strokes) : null,
      };
    },
  });

  if (!data) return null;

  const figures: Figure[] = [
    { label: t('news.fig.birdies', 'BIRDIES'), value: data.birdies === null ? null : String(data.birdies) },
    { label: t('news.fig.eagles', 'EAGLES'), value: data.eagles === null ? null : String(data.eagles) },
    { label: t('news.fig.rounds', 'ROUNDS'), value: String(data.roundCount) },
    { label: t('news.fig.bestRound', 'BEST ROUND'), value: data.bestRound === null ? null : String(data.bestRound) },
    { label: t('news.fig.pars', 'PARS'), value: data.pars === null ? null : String(data.pars) },
    { label: t('news.fig.bogeys', 'BOGEYS'), value: data.bogeys === null ? null : String(data.bogeys) },
  ];

  return (
    <button
      type="button"
      onClick={() => navigate(`/tourhub/tournament/${tournamentId}`)}
      className="active:scale-[0.99]"
      style={{ ...CARD, display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer' }}
    >
      <StatHeader
        player={data.player}
        kicker={t('news.theWeek', 'THE WEEK')}
        subline={data.tournamentName}
      />
      <FigureGrid figures={figures} />
    </button>
  );
}


  return (
    <div style={{ fontFamily: FONT }}>
      {blocks.map((b, i) => {
        switch (b.type) {
          case 'paragraph':
            return <Paragraph key={i} text={b.text} />;
          case 'heading':
            return <Heading key={i} text={b.text} />;
          case 'image':
            return <ImageBlock key={i} url={b.url} caption={b.caption} credit={b.credit} />;
          case 'quote':
            return <Quote key={i} text={b.text} attribution={b.attribution} />;
          case 'leaderboard':
            return <LeaderboardBlock key={i} tournamentId={b.tournament_id} />;
          case 'player':
            return <PlayerBlock key={i} playerId={b.player_id} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
