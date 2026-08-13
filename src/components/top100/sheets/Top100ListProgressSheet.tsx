/**
 * Top100ListProgressSheet — opened from a list row in YOUR PROGRESS.
 *
 * Uses the shared BottomSheet primitive (src/components/ui/BottomSheet.tsx)
 * and the canonical ScopeSegment; no new sheet primitive is introduced.
 *
 * Defaults to "Not played" — a member opening their progress wants to know
 * what is left, not what is done.
 *
 * Analytics callsites:
 *  - top100_progress_opened  { list_slug }
 *  - top100_progress_segment { list_slug, segment }
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ScopeSegment } from '@/components/shared/ScopeSegment';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { useTop100ListProgress } from '@/hooks/gam/useTop100ListProgress';
import { TITLE } from '@/lib/tokens/type';
import {
  AMBER,
  HAIRLINE_INK_8,
  INK,
  INK_MUTE,
  INK_TINT_04,
} from '@/features/courses/_shared/tokens';

/** Numerals stay in the SF Pro stack: monospace faces slash their zeros. */
const MONO = 'inherit';

type Segment = 'all' | 'played' | 'not_played' | 'rated';

interface Props {
  open: boolean;
  onClose: () => void;
  listSlug: string;
  listName: string;
  played: number;
  total: number;
  rated: number;
  userId: string | undefined;
  /** Course ids the viewer has rated — supplied by the batched enrichment. */
  ratedCourseIds: Set<string>;
}

export const Top100ListProgressSheet: React.FC<Props> = ({
  open,
  onClose,
  listSlug,
  listName,
  played,
  total,
  rated,
  userId,
  ratedCourseIds,
}) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [segment, setSegment] = useState<Segment>('not_played');

  const { data: rows = [] } = useTop100ListProgress(
    open ? listSlug : undefined,
    userId,
    userId,
  );

  useEffect(() => {
    if (!open) return;
    setSegment('not_played');
    analyticsEvents.track('top100_progress_opened', { list_slug: listSlug });
  }, [open, listSlug]);

  const filtered = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    switch (segment) {
      case 'played':
        return sorted.filter((r) => r.is_viewer_played);
      case 'not_played':
        return sorted.filter((r) => !r.is_viewer_played);
      case 'rated':
        return sorted.filter((r) => ratedCourseIds.has(r.course_id));
      default:
        return sorted;
    }
  }, [rows, segment, ratedCourseIds]);

  const pct = total > 0 ? Math.min(100, (played / total) * 100) : 0;

  const emptyCopy =
    segment === 'not_played'
      ? t('top100.listSheet.emptyNotPlayed')
      : segment === 'played'
        ? t('top100.listSheet.emptyPlayed')
        : segment === 'rated'
          ? t('top100.listSheet.emptyRated')
          : t('top100.listSheet.emptyAll');

  return (
    <BottomSheet open={open} onClose={onClose} maxHeight="85dvh">
      <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(85dvh - 30px)' }}>
        <div style={{ padding: '4px 16px 12px', borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
          <div style={{ ...TITLE, color: INK }}>
            {listName}
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
              fontFeatureSettings: '"zero" 0, "tnum" 1',
              fontSize: 11.5,
              fontWeight: 700,
              color: INK_MUTE,
              marginTop: 4,
            }}
          >
            {t('top100.listSheet.summary', { played, total, rated })}
          </div>
          <div
            style={{
              marginTop: 8,
              height: 4,
              borderRadius: 999,
              background: 'rgba(15,23,42,0.07)',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: `${pct}%`, height: '100%', background: AMBER }} />
          </div>
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <ScopeSegment
              value={segment}
              ariaLabel={t('top100.listSheet.segmentA11y')}
              onChange={(next) => {
                setSegment(next);
                analyticsEvents.track('top100_progress_segment', {
                  list_slug: listSlug,
                  segment: next,
                });
              }}
              options={[
                { value: 'all', label: t('top100.listSheet.segAll') },
                { value: 'played', label: t('top100.listSheet.segPlayed') },
                { value: 'not_played', label: t('top100.listSheet.segNotPlayed') },
                { value: 'rated', label: t('top100.listSheet.segRated') },
              ]}
            />
          </div>
        </div>

        <div style={{ overflowY: 'auto', WebkitOverflowScrolling: 'touch', flex: 1 }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '32px 24px',
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 500,
                color: INK_MUTE,
              }}
            >
              {emptyCopy}
            </div>
          ) : (
            filtered.map((row, i) => {
              const isRated = ratedCourseIds.has(row.course_id);
              return (
                <button
                  key={row.course_id}
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/courses/${row.course_id}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    textAlign: 'left',
                    padding: '9px 16px',
                    borderTop: i === 0 ? 'none' : `1px solid ${HAIRLINE_INK_8}`,
                    background: 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO,
                      fontVariantNumeric: 'tabular-nums',
                      fontFeatureSettings: '"zero" 0, "tnum" 1',
                      fontSize: 12,
                      fontWeight: 700,
                      color: 'rgba(15,23,42,0.35)',
                      width: 26,
                      flexShrink: 0,
                    }}
                  >
                    {row.rank ?? ''}
                  </span>
                  <div
                    style={{
                      width: 40,
                      height: 30,
                      borderRadius: 6,
                      overflow: 'hidden',
                      flexShrink: 0,
                      background: INK_TINT_04,
                    }}
                  >
                    {row.thumbnail_image && (
                      <img
                        src={row.thumbnail_image}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: INK,
                        letterSpacing: '-0.01em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {row.course_name}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
                      {[row.region, row.country].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  {(row.is_viewer_played || isRated) && (
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 8.5,
                        fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: AMBER,
                      }}
                    >
                      {isRated ? t('top100.pill.rated') : t('top100.pill.played')}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default Top100ListProgressSheet;
