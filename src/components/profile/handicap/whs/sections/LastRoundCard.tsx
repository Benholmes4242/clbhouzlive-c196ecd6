import React, { useState } from 'react';
import { format } from 'date-fns';
import { useLastRound, useRoundDetail } from '@/lib/whs/hooks';
import RoundDetailSheet from './round-detail/RoundDetailSheet';
import { RoundCardShell, type HoleRow } from './round-card';

interface Props {
  connectionId: string;
}

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const INK_55 = 'rgba(15,23,42,0.55)';

const relativeDay = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return format(d, 'd MMM');
};

const SectionEyebrow: React.FC<{ label: string }> = ({ label }) => (
  <div style={{ marginBottom: 6, padding: '0 16px 8px' }}>
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
  const [sheetOpen, setSheetOpen] = useState(false);

  const par = React.useMemo<number | null>(() => {
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

  if (isLoading) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <div className="space-y-2 animate-pulse">
            <div className="h-[200px] w-full bg-muted rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (!lastRound) {
    return (
      <section style={{ marginTop: 28 }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <p style={{ fontSize: 14, color: INK_55, fontFamily: FONT_GEIST }}>
            Your rounds will appear here as soon as you start posting scores in MyEG.
          </p>
        </div>
      </section>
    );
  }

  const courseName = lastRound.course?.name ?? 'Unknown course';
  const contextLine = [
    relativeDay(lastRound.play_date).toUpperCase(),
    par != null ? `PAR ${par}` : null,
    lastRound.slope_rating != null ? `SL ${lastRound.slope_rating}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const banner = (
    <div
      style={{
        position: 'absolute',
        left: 12,
        right: 12,
        bottom: 10,
        zIndex: 1,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '-0.01em',
          lineHeight: 1.15,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          fontFamily: FONT_GEIST,
        }}
      >
        {courseName}
      </div>
      {contextLine && (
        <div
          style={{
            marginTop: 3,
            fontSize: 10,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.78)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            fontVariantNumeric: 'tabular-nums',
            fontFamily: FONT_GEIST,
          }}
        >
          {contextLine}
        </div>
      )}
    </div>
  );

  const holes: HoleRow[] | null =
    roundDetail?.holes && roundDetail.hole_by_hole_fetched
      ? roundDetail.holes.map((h) => ({
          hole_no: h.hole_no,
          par: h.par,
          actual_gross: h.actual_gross,
          adjusted_gross: h.adjusted_gross,
          played: h.played,
          hole_alias: h.hole_alias,
        }))
      : null;

  return (
    <>
      <section style={{ marginTop: 28, fontFamily: FONT_GEIST }}>
        <SectionEyebrow label="LAST ROUND" />
        <div style={{ padding: '0 20px' }}>
          <RoundCardShell
            courseThumbnailUrl={lastRound.course_thumbnail_image}
            banner={banner}
            gross={lastRound.adjusted_gross ?? null}
            differential={lastRound.handicap_differential ?? null}
            stableford={lastRound.stableford_points ?? null}
            handicapDelta={lastRound.handicap_delta ?? null}
            isCounter={lastRound.is_counter ?? false}
            holes={holes}
            onClick={() => setSheetOpen(true)}
          />
        </div>
      </section>

      <RoundDetailSheet
        scoreId={lastRound.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        handicapDelta={lastRound.handicap_delta ?? null}
      />
    </>
  );
};

export default LastRoundCard;
