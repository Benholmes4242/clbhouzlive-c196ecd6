/**
 * CourseDirectorySheet — search the full course directory from a 75dvh bottom
 * sheet. Replaces the old inline CourseExplorer view swap.
 *
 * Every row carries its location: there are four courses called Paraiso across
 * three continents, so a bare name is not a safe picker.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { analyticsEvents } from '@/utils/analyticsEvents';
import {
  useCourseDirectorySearch,
  DIRECTORY_MIN_QUERY,
  type DirectoryCourseRow,
} from '@/hooks/courses/useCourseDirectorySearch';
import {
  HAIRLINE_INK_8,
  HAIRLINE_INK_10,
  INK,
  INK_MUTE,
  SURFACE,
} from '@/features/courses/_shared/tokens';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional country scope, passed straight to p_country. */
  initialCountry?: string | null;
}

function locationLine(row: DirectoryCourseRow): string {
  return [row.sub_country, row.country].filter(Boolean).join(', ');
}

export const CourseDirectorySheet: React.FC<Props> = ({ open, onClose, initialCountry = null }) => {
  const { t } = useTranslation('courses');
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const trackedFor = useRef<string | null>(null);

  const { rows, isLoading, isPaging, hasMore, loadMore, enabled, debounced } =
    useCourseDirectorySearch(term, initialCountry);

  /* Reset the field each time the sheet opens. */
  useEffect(() => {
    if (open) {
      setTerm('');
      trackedFor.current = null;
    }
  }, [open]);

  /* One search event per settled query — length only, never the text. */
  useEffect(() => {
    if (!open || !enabled || isLoading) return;
    if (trackedFor.current === debounced) return;
    trackedFor.current = debounced;
    analyticsEvents.track('course_directory_searched', {
      query_length: debounced.length,
      result_count: rows.length,
    });
  }, [open, enabled, isLoading, debounced, rows.length]);

  /* Infinite scroll inside the sheet body. */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!open || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { root: scrollerRef.current, rootMargin: '200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [open, loadMore, rows.length]);

  const onRowTap = (row: DirectoryCourseRow, index: number) => {
    analyticsEvents.track('course_directory_result_tapped', {
      course_id: row.id,
      position: index + 1,
    });
    onClose();
    navigate(`/courses/${row.id}`);
  };

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      variant="light"
      maxHeight="75dvh"
      ariaLabelledBy="course-directory-title"
      style={{
        height: '75dvh',
        maxHeight: '75dvh',
        display: 'flex',
        flexDirection: 'column',
        background: SURFACE,
      }}
    >
      <div className="px-4 pb-2" style={{ borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
        <h2
          id="course-directory-title"
          style={{ fontSize: 16, fontWeight: 800, color: INK, marginBottom: 10 }}
        >
          {t('statBrowse.directory.title')}
        </h2>

        <div
          className="flex items-center gap-2 h-11 rounded-xl px-3"
          style={{ background: '#FFFFFF', border: `1px solid ${HAIRLINE_INK_10}` }}
        >
          <Search className="h-4 w-4 shrink-0" style={{ color: INK_MUTE }} aria-hidden="true" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder={t('directorySheet.placeholder')}
            aria-label={t('directorySheet.placeholder')}
            className="flex-1 bg-transparent outline-none text-[14px]"
            style={{ color: INK }}
          />
          {term.length > 0 && (
            <button
              type="button"
              onClick={() => setTerm('')}
              aria-label={t('directorySheet.clear')}
            >
              <X className="h-4 w-4" style={{ color: INK_MUTE }} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto overscroll-contain px-4 pb-8">
        {!enabled ? (
          <p style={{ fontSize: 13, color: INK_MUTE, marginTop: 20, lineHeight: 1.5 }}>
            {t('directorySheet.prompt', { count: DIRECTORY_MIN_QUERY })}
          </p>
        ) : isLoading ? (
          <div className="mt-3 space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl animate-pulse"
                style={{ background: 'rgba(15,23,42,0.06)' }}
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p style={{ fontSize: 13, color: INK_MUTE, marginTop: 20, lineHeight: 1.5 }}>
            {t('directorySheet.noResults')}
          </p>
        ) : (
          <div>
            {rows.map((row, i) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onRowTap(row, i)}
                className="w-full text-left py-3 flex items-center gap-3"
                style={{ borderBottom: `1px solid ${HAIRLINE_INK_8}` }}
              >
                {row.thumbnail_image ? (
                  <img
                    src={row.thumbnail_image}
                    alt=""
                    loading="lazy"
                    className="h-11 w-11 object-cover shrink-0"
                    style={{ borderRadius: '34%' }}
                  />
                ) : (
                  <div
                    className="h-11 w-11 shrink-0"
                    style={{ borderRadius: '34%', background: 'rgba(15,23,42,0.06)' }}
                  />
                )}
                <span className="min-w-0">
                  <span
                    className="block truncate"
                    style={{ fontSize: 14, fontWeight: 700, color: INK }}
                  >
                    {row.name}
                  </span>
                  <span
                    className="block truncate"
                    style={{ fontSize: 12, color: INK_MUTE, marginTop: 2 }}
                  >
                    {locationLine(row)}
                  </span>
                </span>
              </button>
            ))}

            {isPaging && (
              <div style={{ fontSize: 12.5, color: INK_MUTE, padding: '12px 0' }}>
                {t('directorySheet.loadingMore')}
              </div>
            )}
            {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};

export default CourseDirectorySheet;
