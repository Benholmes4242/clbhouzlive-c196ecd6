/**
 * Top100ListProgressSheet — one member's Top 100 list: played, then still to
 * play, in list order. Opened from the Explore Top 100 board and from the
 * trophy room Top 100 detail.
 *
 * EVERY COUNT IS COUNTED FROM THE ROWS RENDERED. No badge counter, progress
 * view or passport figure is read here.
 *
 * THE STANDING IS PASSED IN, NEVER COMPUTED — get_career_leaderboard owns it.
 *
 * NO OVERLAP NOTES. is_viewer_played is read from the RPC but dormant — nothing
 * is computed from it.
 *
 * ROW TAP opens the OWNER's review when one exists (owner_rating_id), else the
 * course page — same two-branch shape as AllCoursesList handleFullReview.
 *
 * Analytics:
 *  - top100_progress_opened  { list_slug }
 *  - top100_progress_segment { list_slug, segment: 'still_to_play' } — the first
 *    time the still-to-play section scrolls into view (sections are stacked now).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, Star } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { RANK_SCOPE_LABEL, type RankListSlug } from '@/features/explore-magazine/useTop100RankIndex';
import { useTop100ListProgress, type Top100CourseProgress } from '@/hooks/gam/useTop100ListProgress';
import { useCanViewTop100 } from '@/hooks/gam/useCanViewTop100';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMemberTapResolver } from '@/components/friend-sheet/useMemberTapResolver';
import { formatOrdinal } from '@/i18n/format';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  open: boolean;
  onClose: () => void;
  listSlug: RankListSlug;
  ownerUserId: string;
  ownerName: string;
  ownerPhotoUrl?: string | null;
  standing?: { place: number; fieldSize: number } | null;
}

const TNUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"tnum" 1' };
const CAPS: React.CSSProperties = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};
const ELLIPSIS: React.CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const B = (n: React.ReactNode) => <span style={{ color: A.INK, fontWeight: 700 }}>{n}</span>;

export const Top100ListProgressSheet: React.FC<Props> = ({
  open,
  onClose,
  listSlug,
  ownerUserId,
  ownerName,
  ownerPhotoUrl,
  standing,
}) => {
  const { user } = useSupabaseSession();
  const viewerUserId = user?.id;
  const isOwn = !!viewerUserId && viewerUserId === ownerUserId;
  const { resolve } = useMemberTapResolver();
  const navigate = useNavigate();

  const access = useCanViewTop100(open ? ownerUserId : undefined, viewerUserId);
  const progress = useTop100ListProgress(open ? listSlug : undefined, ownerUserId, viewerUserId);

  useEffect(() => {
    if (open) analyticsEvents.track('top100_progress_opened', { list_slug: listSlug });
  }, [open, listSlug]);

  const rows = useMemo(
    () => [...(progress.data ?? [])].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999)),
    [progress.data],
  );
  const played = rows.filter((r) => r.is_owner_played);
  const toPlay = rows.filter((r) => !r.is_owner_played);
  const pct = rows.length > 0 ? (played.length / rows.length) * 100 : 0;

  /* segment event: first sight of the still-to-play section */
  const toPlayRef = useRef<HTMLDivElement | null>(null);
  const segmentSent = useRef(false);
  useEffect(() => {
    if (!open) { segmentSent.current = false; return; }
    const el = toPlayRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (!segmentSent.current && entries.some((e) => e.isIntersecting)) {
        segmentSent.current = true;
        analyticsEvents.track('top100_progress_segment', { list_slug: listSlug, segment: 'still_to_play' });
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [open, listSlug, progress.isSuccess, access.isSuccess]);

  const firstName = ownerName.trim().split(/\s+/)[0] || ownerName;
  const settled = access.isSuccess && (access.data === false || progress.isSuccess);
  const gated = access.isSuccess && access.data === false;

  const head = (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px 13px',
        borderBottom: `1px solid ${A.BORDER}`,
      }}
    >
      {!isOwn ? (
        <SquircleAvatar
          src={ownerPhotoUrl ?? null}
          alt={ownerName}
          userId={ownerUserId}
          fallback={getInitialsFromName(ownerName).slice(0, 2)}
          size={30}
          hairlineRing
        />
      ) : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...ELLIPSIS, fontSize: 14.5, fontWeight: 700, color: A.INK }}>{ownerName}</div>
        <div style={{ ...CAPS, color: A.DIM }}>{`Top 100 ${RANK_SCOPE_LABEL[listSlug]}`}</div>
      </div>
      {isOwn ? (
        <button type="button" onClick={onClose} style={{ ...CAPS, color: A.INK, background: 'transparent', flex: 'none' }}>
          Done
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            onClose();
            void resolve({ targetUserId: ownerUserId });
          }}
          style={{
            flex: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 28,
            padding: '0 10px',
            borderRadius: 999,
            border: `1px solid ${A.BORDER}`,
            background: A.SOFT,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            color: A.INK,
          }}
        >
          Profile
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );

  const heroLine = (() => {
    if (isOwn) {
      const first = toPlay[0];
      if (!first) return <>You have played every course on this list.</>;
      return (
        <>
          Highest you haven't played is {B(first.rank != null ? `#${first.rank}` : null)} {B(first.course_name)}.
        </>
      );
    }
    if (!standing) return null;
    return (
      <>
        {B(formatOrdinal(standing.place))} of {B(standing.fieldSize)} members on this list.
      </>
    );
  })();

  const sectionHead = (lead: string, n: number, right?: string) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '11px 16px 7px',
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: A.DIM,
      }}
    >
      <span>
        <span style={{ color: A.INK }}>{lead}</span> · <span style={TNUM}>{n}</span>
      </span>
      {right ? <span>{right}</span> : null}
    </div>
  );

  const courseRow = (r: Top100CourseProgress, isPlayed: boolean) => {
    const meta: string[] = [];
    if (r.rank != null) meta.push(`${RANK_SCOPE_LABEL[listSlug]} #${r.rank}`);
    if (listSlug !== 'global' && r.global_rank != null) meta.push(`#${r.global_rank} worldwide`);
    const onPress = () => {
      onClose();
      if (r.owner_rating_id) navigate(`/courses/${r.course_id}?tab=reviews&review=${r.owner_rating_id}`);
      else navigate(`/courses/${r.course_id}`);
    };
    return (
      <button
        type="button"
        key={r.course_id}
        onClick={onPress}
        className="transition-opacity active:opacity-60"
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '9px 16px',
          borderTop: `1px solid ${A.BORDER}`,
        }}
      >
        {r.thumbnail_image ? (
          <img
            src={r.thumbnail_image}
            alt=""
            loading="lazy"
            style={{ width: 38, height: 38, borderRadius: 9, objectFit: 'cover', flex: 'none', opacity: isPlayed ? 1 : 0.5 }}
          />
        ) : (
          <div style={{ width: 38, height: 38, borderRadius: 9, background: A.TRACK, flex: 'none', opacity: isPlayed ? 1 : 0.5 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...ELLIPSIS, fontSize: 13, fontWeight: 600, color: isPlayed ? A.INK : A.MUTE }}>{r.course_name}</div>
          {meta.length > 0 ? (
            <div style={{ ...ELLIPSIS, fontSize: 10.5, color: A.DIM }}>
              {meta.join(' · ')}
            </div>
          ) : null}
        </div>
        <div style={{ flex: 'none' }}>
          {isPlayed ? (
            <span
              style={{
                ...TNUM,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                height: 24,
                minWidth: 40,
                padding: '0 8px',
                borderRadius: 7,
                background: r.owner_rating != null ? 'rgba(247,147,30,0.14)' : 'rgba(255,255,255,0.07)',
                color: r.owner_rating != null ? A.AMBER : A.DIM,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {r.owner_rating != null ? (
                <>
                  <Star size={10} fill="currentColor" strokeWidth={0} />
                  {r.owner_rating.toFixed(1)}
                </>
              ) : (
                '—'
              )}
            </span>
          ) : (
            <span
              aria-hidden
              style={{ display: 'block', width: 24, height: 24, borderRadius: 999, border: '1px dashed rgba(255,255,255,0.18)' }}
            />
          )}
        </div>
      </button>
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      maxHeight="85dvh"
      style={{ height: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
    >
      {head}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 32 }}>
        {!settled ? null : gated ? (
          <div style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                background: A.SOFT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={17} color={A.DIM} />
            </div>
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 600, color: A.INK }}>
              {`${firstName} keeps their Top 100 lists private`}
            </div>
            <div style={{ marginTop: 6, maxWidth: 250, fontSize: 11.5, lineHeight: 1.5, color: A.DIM }}>
              They still count on the board — you just can't see which courses.
            </div>
          </div>
        ) : (
          <>
            <div style={{ padding: '15px 16px 14px', borderBottom: `1px solid ${A.BORDER}` }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ ...TNUM, fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', color: A.INK }}>
                  {played.length}
                </span>
                <span style={{ fontSize: 12.5, color: A.MUTE }}>{`of ${rows.length} played`}</span>
              </div>
              <div style={{ marginTop: 8, height: 5, borderRadius: 99, background: A.TRACK, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: A.AMBER }} />
              </div>
              {heroLine ? <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.45, color: A.MUTE }}>{heroLine}</div> : null}
            </div>
            {played.length > 0 ? (
              <>
                {sectionHead('Played', played.length, 'Rating')}
                {played.map((r) => courseRow(r, true))}
              </>
            ) : null}
            {toPlay.length > 0 ? (
              <div ref={toPlayRef}>
                {sectionHead('Still to play', toPlay.length)}
                {toPlay.map((r) => courseRow(r, false))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </BottomSheet>
  );
};

export default Top100ListProgressSheet;
