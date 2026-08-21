import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronDown, Trophy } from 'lucide-react';

import { CourseImageFallback } from './CourseImageFallback';
import { useCourseCardMeta } from './hooks/useCourseCardMeta';
import type { MostPlayedPlayer, MostPlayedRow } from './hooks/useMostPlayedThisWeek';
import { A, CARD_SHELL, Eyebrow, InkAction, LABEL, NUMF, SANS } from './tokens';
import { formatNumber } from '@/i18n/format';
import { MostPlayedPanel as MostPlayedPanelShell } from './DiscoverCourseLedSkeleton';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';


/**
 * Section 5 — WHERE THEY PLAYED THIS WEEK
 * (BRIEF_MOST_PLAYED_LEADERBOARD, SUPERSEDES BRIEF_MOST_PLAYED_WHO_PLAYED).
 *
 * FOUR FAULTS THIS FIXES (§S0):
 *   §S0.1 the expanded list was INDENTED under the thumbnail and narrow, with a
 *         lake of white between a name and its number. It is now a FULL-WIDTH
 *         board and nothing is indented.
 *   §S0.2 the RANK NUMBER is gone from the course rows. Live counts were
 *         11 / 2 / 1 / 1 — three effective ties, so the badge was decoration
 *         inviting a member to read a contest into a list of places.
 *   §S0.3 "PLAYED TO" was a grey small-caps caption and is now the row's
 *         HEADLINE FIGURE on the right.
 *   §S0.4 the section stopped being a leaderboard of COURSES when the content is
 *         PLAYERS. Nobody needs to know a course was played eleven times; they
 *         want to know WHO, and how they went.
 *
 * THE ORDERING IS UNCHANGED (§S1.3) — still most rounds first. The count moved
 * into the meta line as CONTEXT, not a score (§S1.4). The movement marker stays
 * in its existing tones: it is the one genuinely comparative thing here (§S1.6).
 *
 * POSITION FIRST, SCORE LAST (§S2.2). That is the order every golfer has read on
 * every board they have ever stood in front of, and it is why the format needs
 * no explaining.
 */

interface Props {
  rows: MostPlayedRow[];
  limit?: number;
  /** TRUE while the rounds aggregate has not settled — shell holds the slot. */
  isPending?: boolean;
  onRowPress: (row: MostPlayedRow) => void;
  onSeeAll?: () => void;
  showEyebrow?: boolean;
}

/** One decimal, TRUE MINUS, "E" at level. */
function formatToPar(v: number): string {
  const r = Math.round(v * 10) / 10;
  if (r === 0) return 'E';
  const n = Math.abs(r).toFixed(1);
  return `${r > 0 ? '+' : '\u2212'}${n}`;
}

/**
 * MOVEMENT — a MOVEMENT, not a score: INDEX_DELTA.light green up / red down.
 * NEW is amber (the absence of a prior week), LEVEL is dim. Absolute figures
 * only; a percentage at this volume would lie (see §5).
 */
function MoveMark({
  row,
  t,
}: {
  row: MostPlayedRow;
  t: (key: string, def: string, opts?: Record<string, unknown>) => string;
}) {
  const base: React.CSSProperties = {
    ...LABEL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    fontSize: 9,
    marginTop: 4,
    fontVariantNumeric: 'tabular-nums lining-nums',
  };
  if (row.move === 'new')
    return <span style={{ ...base, color: A.AMBER }}>{t('discover.mostPlayedNew', 'New')}</span>;
  if (row.move === 'level')
    return <span style={{ ...base, color: A.DIM }}>{t('discover.mostPlayedLevel', 'Level')}</span>;
  const up = row.move === 'up';
  const color = up ? INDEX_DELTA.light.improved : INDEX_DELTA.light.drifted;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span style={{ ...base, color }}>
      <Icon size={9} strokeWidth={2.75} />
      {formatNumber(Math.abs(row.change))}
    </span>
  );
}

/* ─────────────────────────── WHO PLAYED (§S1/§S2) ─────────────────────────
 * NAME INDENT: the face row aligns with the COURSE NAME, not the rank
 * (§S1.1) — rank 13 + gap 11 + thumbnail 52 + gap 11 = 87.
 */
const NAME_INDENT = 87;
/** Six faces, then "+N" (§S1.2). */
const FACE_CAP = 6;
/** Beyond twelve the expansion navigates instead of growing (§S2.5). */
const LIST_CAP = 12;

/* NO VIEWER MARKING IN THIS SECTION. Ben's call (BRIEF_SCORECARD_WIDTH_AND_
 * VIEWER_RING §S2) - the amber ring and the "You" substitution were both removed
 * deliberately. Amber still means the viewing member EVERYWHERE ELSE in the app;
 * this section simply does not mark them. Every face takes the PANEL ring. */

/** A face that opens its member's profile and never toggles the row (§S2.7). */
function MemberFace({
  player,
  size,
  onOpen,
}: {
  player: MostPlayedPlayer;
  size: number;
  onOpen: (userId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        // STOP, OR THE ROW TOGGLES BEHIND THE NAVIGATION (§S2.7).
        e.stopPropagation();
        onOpen(player.userId);
      }}
      aria-label={player.name}
      style={{
        display: 'block',
        padding: 0,
        border: 'none',
        background: 'transparent',
        borderRadius: '34%',
        cursor: 'pointer',
        flex: 'none',
        // THE RING READS THEM APART: 1.5px of the panel colour, on EVERY face.
        boxShadow: `0 0 0 1.5px ${A.PANEL}`,
      }}
    >
      <SquircleAvatar
        size={size}
        src={player.avatarUrl}
        alt={player.name}
        userId={player.userId}
        hairlineRing
      />
    </button>
  );
}

/** §S1 — the collapsed face row, plus "best NN" on the right. */
function FaceRow({
  row,
  onOpenMember,
}: {
  row: MostPlayedRow;
  onOpenMember: (userId: string) => void;
}) {
  const { t } = useTranslation('courses');
  if (row.players.length === 0) return null;
  const faces = row.players.slice(0, FACE_CAP);
  const overflow = row.players.length - faces.length;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: NAME_INDENT,
        paddingBottom: 12,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {faces.map((p, idx) => (
          <span key={p.userId} style={{ marginLeft: idx === 0 ? 0 : -8, display: 'block' }}>
            <MemberFace player={p} size={26} onOpen={onOpenMember} />
          </span>
        ))}
        {/* ONE MEMBER SHOWS ONE FACE — no "+0", no placeholder (§S1.6). */}
        {overflow > 0 && (
          <span
            style={{
              ...LABEL,
              fontSize: 9,
              color: A.MUTE,
              marginLeft: 6,
              fontVariantNumeric: 'tabular-nums lining-nums',
            }}
          >
            +{formatNumber(overflow)}
          </span>
        )}
      </div>
      {row.bestGross != null && (
        <span
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.MUTE,
            marginLeft: 'auto',
            flex: 'none',
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {t('discover.mostPlayedBest', 'best')}{' '}
          <span style={{ color: A.INK }}>{formatNumber(row.bestGross)}</span>
        </span>
      )}
    </div>
  );
}

/**
 * §S2 — the expanded list. NO INTERNAL SCROLL, AND THAT IS DELIBERATE (§S2.4):
 * "No nested scroll. The largest course this week has NINE members, so a
 *  ten-row scroll would never engage — and a scrollable panel inside a
 *  scrolling page is a real fault on a phone: a finger that lands on the list
 *  scrolls the list instead of the page, and a member cannot tell why the page
 *  stopped moving. The expansion is member-initiated, so its height is
 *  consented to."
 */
function MemberList({
  row,
  onOpenMember,
  onSeeAllAtCourse,
}: {
  row: MostPlayedRow;
  onOpenMember: (userId: string) => void;
  onSeeAllAtCourse: () => void;
}) {
  const { t } = useTranslation('courses');
  const listed = row.players.slice(0, LIST_CAP);
  const hidden = row.players.length - listed.length;

  return (
    <div style={{ paddingLeft: NAME_INDENT, paddingBottom: 12, display: 'grid', gap: 8 }}>
      {listed.map((p) => {
        return (
          <div key={p.userId} style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <MemberFace player={p} size={22} onOpen={onOpenMember} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMember(p.userId);
              }}
              style={{
                flex: 1,
                minWidth: 0,
                border: 'none',
                background: 'transparent',
                padding: 0,
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: SANS,
                fontSize: 12,
                // EVERY NAME RENDERS THE SAME - no bold, no amber, no "You".
                fontWeight: 600,
                letterSpacing: '-0.015em',
                color: A.INK,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name}
            </button>
            {p.gross != null && (
              <span
                style={{
                  ...NUMF,
                  fontSize: 12,
                  flex: 'none',
                  color: A.INK,
                }}
              >
                {formatNumber(p.gross)}
              </span>
            )}
          </div>
        );
      })}
      {/* A NAVIGATION, NEVER A SCROLL TRAP (§S2.5). */}
      {hidden > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSeeAllAtCourse();
          }}
          style={{
            ...LABEL,
            fontSize: 9,
            color: A.INK,
            border: 'none',
            background: 'transparent',
            padding: '2px 0',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          {t('discover.mostPlayedSeeAllAtCourse', 'See all at this course')}
        </button>
      )}
    </div>
  );
}


export function MostPlayedLeaderboard({
  rows,
  limit = 5,
  isPending = false,
  onRowPress,
  onSeeAll,
  showEyebrow = true,
}: Props) {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  /** ONE ROW OPEN AT A TIME (§S2.3) — a single id, never a set. */
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = rows.slice(0, limit);
  const metaQuery = useCourseCardMeta(shown.map((r) => r.courseId));
  const meta = metaQuery.data;
  // DECORATION ONLY (layer 2b): the row already holds its own course_name from
  // gam_round_stats, so only the THUMBNAIL waits — the shimmer sits in that slot
  // while the rest of the row reads straight away.
  const thumbPending = shown.length > 0 && metaQuery.isPending;

  const openMember = (userId: string) => navigate(`/profile/${userId}`);

  if (isPending) return <MostPlayedPanelShell />;
  if (shown.length === 0) return null;


  return (
    <section>
      {showEyebrow && (
        <Eyebrow
          icon={Trophy}
          aside={
            rows.length > shown.length && onSeeAll ? (
              <InkAction onClick={onSeeAll}>{t('discover.seeAll', 'See all')}</InkAction>
            ) : (
              <span style={LABEL}>{t('discover.trackedRounds', 'Tracked rounds')}</span>
            )
          }
        >
          {t('discover.mostPlayed', 'Most played this week')}
        </Eyebrow>
      )}

      <div style={{ ...CARD_SHELL, padding: '4px 14px', fontFamily: SANS }}>
        {shown.map((r, i) => {
          const m = meta?.get(r.courseId);
          const name = m?.name ?? r.courseName ?? t('discover.unknownCourse', 'Course');
          const open = openId === r.courseId;
          const toggle = () => setOpenId(open ? null : r.courseId);
          return (
            <div
              key={r.courseId}
              style={{
                borderBottom: i === shown.length - 1 ? 'none' : `1px solid ${A.BORDER}`,
              }}
            >
              {/* NO BUTTON INSIDE A BUTTON (§S2.8). The row is a div carrying
                  role="button", tabIndex and Enter/Space; the faces, the names
                  and the "see all" action inside it stay REAL buttons, each
                  stopping propagation so a name tap navigates without toggling. */}
              <div
                role="button"
                tabIndex={0}
                aria-expanded={open}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                    e.preventDefault();
                    toggle();
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  width: '100%',
                  padding: '12px 0',
                  background: 'transparent',
                  textAlign: 'left',
                  fontFamily: SANS,
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    ...LABEL,
                    fontSize: 9,
                    color: A.DIM,
                    width: 13,
                    flexShrink: 0,
                    fontVariantNumeric: 'tabular-nums lining-nums',
                  }}
                >
                  {formatNumber(i + 1)}
                </span>
                <CourseImageFallback
                  courseId={r.courseId}
                  courseName={name}
                  imageUrl={m?.imageUrl}
                  initialsSize={13}
                  pending={thumbPending}
                  style={{ width: 52, height: 52, borderRadius: 13, flexShrink: 0 }}
                />
                <span style={{ flex: 1, minWidth: 0 }}>
                  {/* TWO LINES, NOT A TRUNCATION: the parenthetical on a
                      two-course club is the only thing telling the two apart. */}
                  <span
                    style={{
                      display: '-webkit-box',
                      WebkitBoxOrient: 'vertical',
                      WebkitLineClamp: 2,
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: A.INK,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                    }}
                  >
                    {name}
                  </span>
                  {/* REGION on its own line. */}
                  {m?.region && (
                    <span
                      style={{
                        ...LABEL,
                        display: 'block',
                        fontSize: 9,
                        color: A.DIM,
                        marginTop: 3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.region}
                    </span>
                  )}
                  {/* SCORING LINE — a SCORE, not a movement: to-par convention,
                      BODY ink. "BY N MEMBERS" IS GONE (§S3.2): the faces below
                      say who, and the list states the count. The "played to"
                      figure stays. */}
                  {r.avgToPar != null && (
                    <span
                      style={{
                        ...LABEL,
                        display: 'block',
                        fontSize: 9,
                        color: A.BODY,
                        marginTop: 4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: 'tabular-nums lining-nums',
                      }}
                    >
                      {t('discover.mostPlayedAvgToPar', 'Played to {{value}}', {
                        value: formatToPar(r.avgToPar),
                      })}
                    </span>
                  )}
                </span>
                <span style={{ flexShrink: 0, textAlign: 'right', minWidth: 34 }}>
                  <span
                    style={{
                      ...NUMF,
                      display: 'block',
                      fontSize: 20,
                      letterSpacing: '-0.03em',
                      lineHeight: 1,
                      color: A.INK,
                    }}
                  >
                    {formatNumber(r.count)}
                  </span>
                  <MoveMark row={r} t={t} />
                </span>
                {/* WITHOUT IT NOTHING SAYS THE ROW OPENS (§S2.2). */}
                <ChevronDown
                  size={14}
                  strokeWidth={2.4}
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    color: A.DIM,
                    transform: open ? 'rotate(180deg)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </div>

              {open ? (
                <MemberList
                  row={r}
                  onOpenMember={openMember}
                  onSeeAllAtCourse={() => onRowPress(r)}
                />
              ) : (
                <FaceRow row={r} onOpenMember={openMember} />
              )}
            </div>
          );
        })}

      </div>


    </section>
  );
}

export default MostPlayedLeaderboard;
