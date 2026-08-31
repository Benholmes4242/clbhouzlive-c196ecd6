/**
 * StoryBody — walks a story's body_blocks IN ORDER and renders each by type.
 *
 * The embeds are the point of the format. The leaderboard block REUSES the
 * existing BoardTable (the same component the Leaderboard tab paints) rather
 * than a cut-down copy, and the player block reuses RankedPlayerRow. Neither is
 * re-implemented here — this file only positions them and feeds them data.
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
import { BoardTable, type BoardEntry, type CutState } from '../leaderboard/BoardTable';
import { useTournamentMeta } from '../leaderboard/useTournamentMeta';
import { useTourLeaderboard } from '../hooks/useTourHubData';
import { resolveCutDisplay } from '../_shared/cutDisplay';
import { RankedPlayerRow } from '../players-v2/RankedPlayerRow';
import type { StoryBlock } from './blocks';
import { FONT, HAIRLINE_INK_10, INK, INK_FAINT, INK_MUTE, SLATE_100, AMBER } from '../_shared/tokens';

/** Inline embeds sit on the panel wash, not the page canvas. */
const EMBED_BG = 'rgba(255,255,255,0.04)';

/** How many rows an INLINE board shows before it defers to the full board. */
const INLINE_BOARD_ROWS = 10;

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
        cutState={cutState}
        currentRound={currentRound}
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

  return (
    <div
      style={{
        margin: '18px 0 20px',
        background: EMBED_BG,
        border: `1px solid ${HAIRLINE_INK_10}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <RankedPlayerRow
        rank={data.rank ?? ''}
        player={{
          playerId: p.id,
          name,
          country: p.country ?? null,
          countryCode: p.country_code ?? null,
          photoUrl: p.photo_url ?? null,
          tourCode: p.tour_codes?.[0] ?? 'pga',
        }}
        onClick={() => navigate(`/tourhub/player/${p.id}`)}
      />
    </div>
  );
}

export function StoryBody({ blocks }: { blocks: StoryBlock[] }) {
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
