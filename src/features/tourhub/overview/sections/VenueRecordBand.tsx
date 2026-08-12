/**
 * VenueRecordBand — the clubhouse record for the venue currently in view on
 * the hero. Sits inside the hero cohesion unit, under the live rail.
 *
 * Anatomy (analytical panel): kicker "THE RECORD BOOK", venue name + place,
 * then a centred three-up stat row — clubhouse rating, review count, Top 100
 * placement. Whole panel deep-links to the course page.
 *
 * Self-hides when the tournament has no linked course or no community rating.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { A, KICKER, LABEL, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { SPACE } from '@/lib/spacing';
import { useTournamentVenueRecord } from '../data/useTournamentVenueRecord';
import { formatNumber } from '@/i18n/format';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <span style={{ fontSize: 17, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em', ...FIGS }}>
        {value}
      </span>
      <span style={{ ...LABEL, color: A.DIM }}>{label}</span>
    </div>
  );
}

export function VenueRecordBand({ tournamentId }: { tournamentId: string | undefined }) {
  const { t } = useTranslation('tourhub');
  const navigate = useNavigate();
  const { data } = useTournamentVenueRecord(tournamentId);

  if (!data) return null;
  const hasRating = data.rating != null;
  const hasRank = data.listRank != null;
  if (!hasRating && !hasRank) return null;

  return (
    <div style={{ padding: `0 ${SPACE.pagePadX}px` }}>
      <button
        type="button"
        onClick={() => navigate(`/course/${data.courseId}`)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: A.PANEL,
          border: `1px solid ${A.BORDER}`,
          borderRadius: 16,
          padding: '12px 14px 14px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={KICKER}>{t('overview.venueRecord.kicker')}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}>
            {data.courseName}
          </span>
          {data.coursePlace ? (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: A.MUTE }}>{data.coursePlace}</span>
          ) : null}
        </div>

        <div style={{ height: 1, background: A.BORDER }} />

        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {hasRating ? (
            <Stat
              label={t('overview.venueRecord.clubhouseRating')}
              value={Number(data.rating).toFixed(1)}
            />
          ) : null}
          {data.reviewCount != null ? (
            <Stat
              label={t('overview.venueRecord.reviews')}
              value={formatNumber(data.reviewCount)}
            />
          ) : null}
          {hasRank ? (
            <Stat
              label={data.listLabel ?? t('overview.venueRecord.top100')}
              value={`#${data.listRank}`}
            />
          ) : null}
        </div>
      </button>
    </div>
  );
}

export default VenueRecordBand;
