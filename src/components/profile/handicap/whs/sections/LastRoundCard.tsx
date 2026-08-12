import React, { useState } from 'react';
import { useLastRound } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { CinemaCardSkeleton, LastRoundHeroCard } from './last-round-card';
import { DarkSectionHeader } from './_shared/darkAtoms';
import { formatWeekdayDayMonthShortGB } from '@/i18n/format';

interface Props {
  connectionId: string;
  userId: string;
  /** 'owner' (default) shows first-person copy; 'friend' uses third-person + ownerFirstName. */
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Convert an ISO date to a relative time-ago string.
 * Examples: "today", "yesterday", "3d ago", "2w ago", "1mo ago", "1y ago".
 */
function timeAgoFrom(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffMs = Date.now() - t;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

export const LastRoundCard: React.FC<Props> = ({
  connectionId,
  userId,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { data: lastRound, isLoading } = useLastRound(connectionId);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last Round" />
        <div style={{ padding: '0 16px' }}>
          <CinemaCardSkeleton />
        </div>
      </section>
    );
  }

  if (!lastRound) {
    const emptyCopy =
      viewMode === 'friend'
        ? `Rounds will appear here once ${ownerFirstName ?? 'they'} starts posting scores in MyEG.`
        : 'Your rounds will appear here as soon as you start posting scores in MyEG.';
    return (
      <section style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="Last Round" />
        <div style={{ padding: '0 16px' }}>
          <p style={{ fontSize: 14, color: 'var(--hcp-t-60)', fontFamily: FONT_SF }}>
            {emptyCopy}
          </p>
        </div>
      </section>
    );
  }

  const formattedDate = lastRound.play_date
    ? formatWeekdayDayMonthShortGB(lastRound.play_date).toUpperCase()
    : undefined;

  const timeAgo = lastRound.play_date ? timeAgoFrom(lastRound.play_date) : '';

  return (
    <>
      <section style={{ marginTop: 32, fontFamily: FONT_SF }}>
        <DarkSectionHeader eyebrow="Last Round" right={formattedDate} />
        <LastRoundHeroCard
          round={lastRound}
          timeAgo={timeAgo}
          onClick={() => setSheetOpen(true)}
          viewMode={viewMode}
          ownerFirstName={ownerFirstName}
        />
      </section>

      <RoundDetailSheet
        scoreId={lastRound.id}
        connectionId={connectionId}
        profileUserId={userId ?? null}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={lastRound.handicap_delta ?? null}
      />
    </>
  );
};

export default LastRoundCard;
