/**
 * RoundDetailSheet -- handicap round drill-in.
 *
 * Thin wrapper around the canonical CardScorecardSheet ("The Card").
 * Sheet is always LIGHT now (no dark handicap variant). The `variant`
 * prop is kept for back-compat with existing callers but is IGNORED.
 * Consumers (RecentlyPlayedFeed, LastRoundCard, Pattern14Card,
 * RecentRoundsCard, LastRoundHeroCard, RoundsThatCountCard,
 * FriendsYesterdayCard, CircleActivityStrip) compile untouched.
 */

import React, { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CardScorecardSheet } from '@/features/courses/_shared/scorecard/CardScorecardSheet';
import { useRoundDetail, useWhsCourseId } from '@/lib/whs/hooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { WhsScoreHole } from '@/lib/whs/types';

const GEIST = "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const INK = '#0F172A';
const SECONDARY = '#4B5563';
const MUTED = '#94A3B8';
const HAIRLINE = 'rgba(0,0,0,0.08)';
const UNDER = '#D2222D';
const OVER = '#1D5DBF';

interface Props {
  open: boolean;
  onClose: () => void;
  scoreId?: string | null;
  handicapDelta?: number | null;
  connectionId?: string | null;
  /** Owner of this round -- enables avatar/name -> profile nav. */
  profileUserId?: string | null;
  /** IGNORED -- sheet is always light. Kept for back-compat. */
  variant?: 'dark' | 'light';
}

function strokesOf(h: WhsScoreHole): number | null {
  return h.adjusted_gross ?? h.actual_gross ?? null;
}

function fmtDiff(n: number | null): string {
  if (n == null) return '\u2014';
  const r = Math.round(n * 10) / 10;
  return r === 0 ? '0.0' : r > 0 ? `+${r.toFixed(1)}` : `\u2212${Math.abs(r).toFixed(1)}`;
}

function fmtDateEyebrow(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dow = d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
  const day = d.getDate();
  const mon = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  return `${dow}, ${day} ${mon}`;
}

export const RoundDetailSheet: React.FC<Props> = ({
  open, onClose, scoreId, handicapDelta, profileUserId,
}) => {
  const navigate = useNavigate();
  const userQuery = useRoundDetail(scoreId, open);
  const userData = userQuery.data;

  const profileQuery = useUserProfile(profileUserId ?? undefined);
  const profile = profileQuery.data;

  const courseIdQuery = useWhsCourseId(
    userData?.course?.name ?? null,
    (userData?.course as any)?.country_code ?? null,
    open,
  );

  const sortedHoles = useMemo(() => {
    if (!userData?.holes) return [] as WhsScoreHole[];
    return [...userData.holes].sort((a, b) => a.hole_no - b.hole_no);
  }, [userData]);

  const cardHoles = useMemo(
    () => sortedHoles.map((h) => ({
      holeNo: h.hole_no,
      par: h.par ?? null,
      strokes: strokesOf(h),
    })),
    [sortedHoles],
  );

  const dateEyebrow = fmtDateEyebrow(userData?.play_date);
  const courseName = userData?.course?.name ?? '';
  const eyebrowText = [dateEyebrow, courseName].filter(Boolean).join(` ${'\u00B7'} `).toUpperCase();
  const displayName = profile?.display_name ?? profile?.username ?? '';
  const goToProfile = profileUserId ? () => navigate(`/handicap/${profileUserId}`) : undefined;

  const totalPar = sortedHoles.reduce((a, h) => a + (h.par ?? 0), 0);
  const totalStrokes = sortedHoles.reduce((a, h) => a + (strokesOf(h) ?? 0), 0);
  const holesPlayed = sortedHoles.filter((h) => strokesOf(h) != null).length;
  const subLine = holesPlayed > 0
    ? `Gross ${totalStrokes} ${'\u00B7'} Par ${totalPar}`
    : totalPar > 0 ? `Par ${totalPar}` : '';

  const indexMoved = handicapDelta != null && Math.abs(handicapDelta) >= 0.05;
  const deltaColor = handicapDelta == null ? MUTED : handicapDelta < 0 ? UNDER : OVER;
  const arrow = handicapDelta == null ? '' : handicapDelta < 0 ? '\u25BC' : '\u25B2';

  const headerRight = indexMoved && handicapDelta != null ? (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      background: 'rgba(15,23,42,0.04)', border: `1px solid ${HAIRLINE}`,
      fontFamily: GEIST, fontVariantNumeric: 'tabular-nums',
      fontSize: 10.5, fontWeight: 800, color: deltaColor,
    }}>
      <span style={{ fontSize: 8 }}>{arrow}</span>
      {fmtDiff(handicapDelta)}
    </span>
  ) : null;

  const footerExtra = courseIdQuery.data ? (
    <button
      type="button"
      onClick={() => { onClose(); navigate(`/courses/${courseIdQuery.data}`); }}
      style={{
        margin: '0 16px 16px', padding: '12px 14px',
        borderRadius: 12, border: `1px solid ${HAIRLINE}`,
        background: '#FFFFFF',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontFamily: GEIST, fontSize: 13, fontWeight: 700, color: INK,
        cursor: 'pointer', width: 'calc(100% - 32px)',
      }}
    >
      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {courseName || 'View course'}
      </span>
      <ExternalLink size={14} strokeWidth={2.2} color={SECONDARY} />
    </button>
  ) : null;

  return (
    <CardScorecardSheet
      open={open}
      onClose={onClose}
      eyebrowText={eyebrowText}
      name={displayName}
      avatarUrl={profile?.profile_photo_url ?? null}
      onIdentityTap={goToProfile}
      subLine={subLine}
      holes={cardHoles}
      nineHole={!!userData?.is_nine_hole}
      headerRight={headerRight}
      footerExtra={footerExtra}
      emptyMessage={
        userData?.hole_by_hole_fetched
          ? 'No hole-by-hole data for this round.'
          : 'Hole data is still syncing. Check back in a few hours.'
      }
    />
  );
};

export default RoundDetailSheet;
