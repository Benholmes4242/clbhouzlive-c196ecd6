import React, { useMemo, useState } from 'react';
import { useLastRound, useRoundDetail, useAllScores } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import {
  CinemaCard,
  CinemaCardSkeleton,
} from './last-round-card';

interface Props {
  connectionId: string;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK_55 = 'rgba(15,23,42,0.55)';

const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ marginBottom: 6, padding: '0 16px 12px' }}>
    <span
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: '#64748B',
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        fontFamily: FONT_GEIST,
      }}
    >
      {label}
    </span>
  </div>
);

export const LastRoundCard: React.FC<Props> = ({ connectionId }) => {
  const { data: lastRound, isLoading } = useLastRound(connectionId);
  const { data: roundDetail } = useRoundDetail(lastRound?.id, !!lastRound?.id);
  const { data: allScores } = useAllScores(connectionId);
  const [sheetOpen, setSheetOpen] = useState(false);

  const par = useMemo<number | null>(() => {
    if (!roundDetail?.holes || !roundDetail.hole_by_hole_fetched) return null;
    let total = 0;
    let any = false;
    for (const h of roundDetail.holes) {
      if (h.par != null) {
        total += h.par;
        any = true;
      }
    }
    return any ? total : null;
  }, [roundDetail]);

  const counterRank = useMemo<number | null>(() => {
    if (!lastRound || !lastRound.is_counter || !allScores) return null;
    const last20 = allScores.slice(0, 20);
    const sorted = [...last20]
      .filter((s) => s.handicap_differential != null)
      .sort((a, b) => a.handicap_differential! - b.handicap_differential!);
    const idx = sorted.findIndex((s) => s.id === lastRound.id);
    if (idx === -1) return null;
    return Math.min(idx + 1, 8);
  }, [lastRound, allScores]);

  const footerCopy = useMemo(() => {
    if (!lastRound) return null;
    return buildLastRoundFooter({
      gross: lastRound.adjusted_gross ?? null,
      par,
      courseHandicap: roundDetail?.course_handicap ?? null,
      handicapDelta: lastRound.handicap_delta ?? null,
      handicapIndexAtTime: lastRound.handicap_index_at_time ?? null,
      isCounter: lastRound.is_counter ?? false,
    });
  }, [lastRound, par, roundDetail]);

  if (isLoading) {
    return (
      <section style={{ marginTop: 32 }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <CinemaCardSkeleton />
        </div>
      </section>
    );
  }

  if (!lastRound) {
    return (
      <section style={{ marginTop: 32 }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 14, color: INK_55, fontFamily: FONT_GEIST }}>
            Your rounds will appear here as soon as you start posting scores in MyEG.
          </p>
        </div>
      </section>
    );
  }

  const holes =
    roundDetail?.holes && roundDetail.hole_by_hole_fetched ? roundDetail.holes : null;

  return (
    <>
      <section style={{ marginTop: 32, fontFamily: FONT_GEIST }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <CinemaCard
            imageUrl={lastRound.course_thumbnail_image}
            playDate={lastRound.play_date}
            isCounter={lastRound.is_counter ?? false}
            counterRank={counterRank}
            courseName={lastRound.course?.name ?? 'Unknown course'}
            par={par}
            slope={lastRound.slope_rating ?? null}
            gross={lastRound.adjusted_gross ?? null}
            stableford={lastRound.stableford_points ?? null}
            differential={lastRound.handicap_differential ?? null}
            holes={holes}
            handicapDelta={lastRound.handicap_delta ?? null}
            onClick={() => setSheetOpen(true)}
          />
        </div>
      </section>

      <RoundDetailSheet
        variant="user"
        scoreId={lastRound.id}
        connectionId={connectionId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={lastRound.handicap_delta ?? null}
      />
    </>
  );
};

export default LastRoundCard;
