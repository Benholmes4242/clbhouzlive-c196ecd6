// Phase L3 - "The course card" block on the course Holes tab.
// Renders NOTHING (null) when the RPC returns [] or is loading/error - the
// tab must look pixel-identical to today for courses with no synced rounds.
// No skeleton for this block.
//
// gender_scope is NEVER rendered as text. It drives the default selection
// only. Tee names ('Red', 'Ladies Red') come from real marker data.
//
// ASCII only. No em dashes in comments (house rule per Phase L2).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProfileData } from '@/hooks/useProfileData';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import { useCourseTeeSets, type TeeSet } from '../../hooks/useCourseTeeSets';
import { AMBER, INK, INK_MUTE, INK_FAINT, HAIRLINE_INK_8 } from '../../_shared/tokens';
import { FONT } from './_constants';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface Props {
  courseId: string | undefined;
}

const NUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  fontFeatureSettings: '"tnum" 1, "kern" 1',
};

function storageKey(courseId: string) {
  return `tee-card:${courseId}`;
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '-';
  return Math.round(n).toLocaleString('en-US');
}

function fmtRating(n: number): string {
  return Number.isFinite(n) ? n.toFixed(1) : '-';
}

// -----------------------------------------------------------------------------
// Default tee resolution order (per brief):
//   1) localStorage 'tee-card:{courseId}' if it matches a returned tee_label
//   2) profile gender 'female': first tee with gender_scope='ladies';
//      if none, the SHORTEST colour tee (last colour entry)
//   3) otherwise: first colour tee (longest)
//   4) no colour tees at all: first entry
// -----------------------------------------------------------------------------
function resolveDefaultTee(
  tees: TeeSet[],
  courseId: string,
  gender: string | null | undefined,
): string {
  if (tees.length === 0) return '';
  let stored: string | null = null;
  try {
    stored = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(courseId)) : null;
  } catch {
    stored = null;
  }
  if (stored && tees.some((t) => t.tee_label === stored)) return stored;

  const colours = tees.filter((t) => t.label_kind === 'colour');

  if (gender === 'female') {
    const ladies = tees.find((t) => t.gender_scope === 'ladies');
    if (ladies) return ladies.tee_label;
    if (colours.length > 0) return colours[colours.length - 1].tee_label;
  }

  if (colours.length > 0) return colours[0].tee_label;
  return tees[0].tee_label;
}

export const CourseTeeCard: React.FC<Props> = ({ courseId }) => {
  const { t } = useTranslation(['courses']);
  const { profile } = useProfileData();
  const { user } = useSupabaseSession();
  const { data: connection } = useWhsConnection(user?.id);
  const { data, isLoading, isError } = useCourseTeeSets(courseId);

  const tees = useMemo<TeeSet[]>(() => data ?? [], [data]);
  const [selected, setSelected] = useState<string>('');
  const [specialOpen, setSpecialOpen] = useState(false);
  const [viewedFired, setViewedFired] = useState(false);
  // Always starts collapsed on mount. Not persisted across sessions.
  const [expanded, setExpanded] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const panelId = React.useId();

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = () => setReducedMotion(mq.matches);
    handler();
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  // Reset collapsed state whenever the course changes.
  useEffect(() => {
    setExpanded(false);
  }, [courseId]);

  // Resolve default once tees are available (or courseId/profile changes).
  useEffect(() => {
    if (!courseId || tees.length === 0) return;
    setSelected((prev) => {
      if (prev && tees.some((t) => t.tee_label === prev)) return prev;
      return resolveDefaultTee(tees, courseId, profile?.gender ?? null);
    });
  }, [courseId, tees, profile?.gender]);

  // Fire tee_card_viewed once per mount when tee sets are non-empty.
  useEffect(() => {
    if (viewedFired) return;
    if (!courseId || tees.length === 0) return;
    setViewedFired(true);
    analyticsEvents.track('tee_card_viewed', {
      course_id: courseId,
      tees: tees.length,
    });
  }, [courseId, tees.length, viewedFired]);

  // Contract: render null for empty / loading / error. Tab must be
  // pixel-identical to today for courses with no synced rounds.
  if (isLoading || isError) return null;
  if (!courseId || tees.length === 0) return null;

  const active = tees.find((t) => t.tee_label === selected) ?? tees[0];
  const colours = tees.filter((t) => t.label_kind === 'colour');
  const specials = tees.filter((t) => t.label_kind === 'special');

  const handlePick = (label: string) => {
    if (label === selected) return;
    setSelected(label);
    try {
      window.localStorage.setItem(storageKey(courseId), label);
    } catch {
      // ignore
    }
    analyticsEvents.track('tee_card_tee_changed', {
      course_id: courseId,
      tee_label: label,
    });
  };

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (next) {
        // Fire on each expand (line: tee_card_expanded event).
        analyticsEvents.track('tee_card_expanded', {
          course_id: courseId,
          tee_label: active.tee_label,
        });
      }
      return next;
    });
  };

  const front9 = active.holes.filter((h) => h.hole_no <= 9);
  const back9 = active.holes.filter((h) => h.hole_no > 9);
  const outYards = front9.reduce((s, h) => s + (h.yards || 0), 0);
  const outPar = front9.reduce((s, h) => s + (h.par || 0), 0);
  const inYards = back9.reduce((s, h) => s + (h.yards || 0), 0);
  const inPar = back9.reduce((s, h) => s + (h.par || 0), 0);
  const totalYards = active.total_yards ?? outYards + inYards;

  const roundsCopy =
    active.rounds_sampled === 1
      ? t('courses:teeCard.reconstructedOne')
      : t('courses:teeCard.reconstructedMany', { count: active.rounds_sampled });

  const subhead = t('courses:teeCard.subhead', {
    tee: active.tee_label,
    yards: fmtInt(totalYards),
  });

  return (
    <section
      style={{
        padding: '20px 16px 8px',
        fontFamily: FONT,
        background: '#FFFFFF',
      }}
      aria-label={t('courses:teeCard.a11yBlock') as string}
    >
      {/* Collapsible header (toggle button) */}
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={t('courses:teeCard.a11yToggle') as string}
        style={{
          display: 'block',
          width: '100%',
          background: 'transparent',
          border: 0,
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
          color: 'inherit',
          font: 'inherit',
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: AMBER,
            marginBottom: 6,
          }}
        >
          {t('courses:teeCard.eyebrow')}
        </div>

        {/* Title + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              fontWeight: 700,
              color: INK,
              ...NUM,
            }}
          >
            {subhead}
          </div>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke={INK_MUTE}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{
              flexShrink: 0,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: reducedMotion ? 'none' : 'transform 220ms ease',
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        {/* Compact stat strip: PAR / CR / SLOPE only (yards is in title) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '10px 12px',
            border: `1px solid ${HAIRLINE_INK_8}`,
            borderRadius: 10,
          }}
        >
          {[
            { k: t('courses:teeCard.stat.par'), v: fmtInt(active.par_total) },
            { k: t('courses:teeCard.stat.cr'), v: fmtRating(active.course_rating) },
            { k: t('courses:teeCard.stat.slope'), v: fmtInt(active.slope_rating) },
          ].map((cell) => (
            <div key={cell.k as string} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>
                {cell.k}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 2, ...NUM }}>
                {cell.v}
              </div>
            </div>
          ))}
        </div>
      </button>

      {/* Collapsible panel */}
      <div
        id={panelId}
        style={{
          display: 'grid',
          gridTemplateRows: expanded ? '1fr' : '0fr',
          transition: reducedMotion ? 'none' : 'grid-template-rows 220ms ease',
          overflow: 'hidden',
        }}
      >
        <div style={{ minHeight: 0 }} aria-hidden={!expanded}>
          <div style={{ height: 12 }} />

          {/* Colour tee pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 4,
              marginBottom: 12,
              WebkitOverflowScrolling: 'touch',
            }}
            role="tablist"
            aria-label={t('courses:teeCard.a11yPills') as string}
          >
            {colours.map((tee) => {
              const isActive = tee.tee_label === active.tee_label;
              return (
                <button
                  key={tee.tee_label}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handlePick(tee.tee_label)}
                  style={{
                    minHeight: 44,
                    padding: '0 14px',
                    borderRadius: 999,
                    border: `1px solid ${isActive ? INK : HAIRLINE_INK_8}`,
                    background: isActive ? INK : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : INK,
                    fontSize: 13,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    ...NUM,
                  }}
                >
                  {tee.tee_label} {fmtInt(tee.total_yards ?? 0)}
                </button>
              );
            })}
          </div>

          {/* Sync prompt for viewers without a WHS connection. */}
          {!connection && (
            <div
              role="note"
              style={{
                background: 'rgba(247,147,30,0.06)',
                border: '1px solid rgba(247,147,30,0.20)',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 12,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: INK, marginBottom: 4 }}>
                {t('courses:teeCard.syncNote.heading')}
              </div>
              <div style={{ fontSize: 12.5, color: INK_MUTE, lineHeight: 1.5 }}>
                {t('courses:teeCard.syncNote.body')}
              </div>
            </div>
          )}

          {/* Special / competition tees disclosure */}
          {specials.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setSpecialOpen((v) => !v)}
                style={{
                  background: 'transparent',
                  border: 0,
                  padding: 0,
                  color: INK_MUTE,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                aria-expanded={specialOpen}
              >
                {t('courses:teeCard.competitionTees', { count: specials.length })}
              </button>
              {specialOpen && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {specials.map((tee) => {
                    const isActive = tee.tee_label === active.tee_label;
                    return (
                      <button
                        key={tee.tee_label}
                        type="button"
                        onClick={() => handlePick(tee.tee_label)}
                        aria-pressed={isActive}
                        style={{
                          minHeight: 44,
                          padding: '0 14px',
                          borderRadius: 999,
                          border: `1px solid ${isActive ? INK : HAIRLINE_INK_8}`,
                          background: isActive ? INK : '#FFFFFF',
                          color: isActive ? '#FFFFFF' : INK,
                          fontSize: 13,
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          ...NUM,
                        }}
                      >
                        {tee.tee_label} {fmtInt(tee.total_yards ?? 0)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Full summary strip (includes yards) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              padding: '10px 12px',
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 10,
              marginBottom: 12,
            }}
          >
            {[
              { k: t('courses:teeCard.stat.par'), v: fmtInt(active.par_total) },
              { k: t('courses:teeCard.stat.cr'), v: fmtRating(active.course_rating) },
              { k: t('courses:teeCard.stat.slope'), v: fmtInt(active.slope_rating) },
              { k: t('courses:teeCard.stat.yards'), v: fmtInt(totalYards) },
            ].map((cell) => (
              <div key={cell.k as string} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>
                  {cell.k}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginTop: 2, ...NUM }}>
                  {cell.v}
                </div>
              </div>
            ))}
          </div>

          {/* Holes table */}
          <div
            role="table"
            aria-label={t('courses:teeCard.a11yTable') as string}
            style={{
              border: `1px solid ${HAIRLINE_INK_8}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              role="row"
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr 1fr 1fr',
                padding: '8px 12px',
                background: '#F8FAFC',
                borderBottom: `1px solid ${HAIRLINE_INK_8}`,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: INK_FAINT,
              }}
            >
              <div>{t('courses:teeCard.col.hole')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.par')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.si')}</div>
              <div style={{ textAlign: 'right' }}>{t('courses:teeCard.col.yards')}</div>
            </div>

            {front9.map((h, idx) => (
              <Row key={h.hole_no} h={h} zebra={idx % 2 === 1} />
            ))}

            <SubtotalRow
              label={t('courses:teeCard.out') as string}
              par={outPar}
              yards={outYards}
            />

            {back9.map((h, idx) => (
              <Row key={h.hole_no} h={h} zebra={idx % 2 === 1} />
            ))}

            <SubtotalRow
              label={t('courses:teeCard.in') as string}
              par={inPar}
              yards={inYards}
            />

            <SubtotalRow
              label={t('courses:teeCard.total') as string}
              par={active.par_total}
              yards={totalYards}
              strong
            />
          </div>

          {/* Honesty caption */}
          <div
            style={{
              fontSize: 12,
              color: INK_MUTE,
              marginTop: 10,
              marginBottom: 4,
            }}
          >
            {roundsCopy}
          </div>
        </div>
      </div>
    </section>
  );
};

const Row: React.FC<{ h: { hole_no: number; par: number; si: number; yards: number }; zebra: boolean }> = ({ h, zebra }) => (
  <div
    role="row"
    style={{
      display: 'grid',
      gridTemplateColumns: '56px 1fr 1fr 1fr',
      padding: '8px 12px',
      background: zebra ? 'rgba(15,23,42,0.02)' : '#FFFFFF',
      fontSize: 13,
      color: INK,
      ...NUM,
    }}
  >
    <div style={{ fontWeight: 700 }}>{h.hole_no}</div>
    <div style={{ textAlign: 'right' }}>{h.par || '-'}</div>
    <div style={{ textAlign: 'right' }}>{h.si || '-'}</div>
    <div style={{ textAlign: 'right' }}>{h.yards ? h.yards.toLocaleString('en-US') : '-'}</div>
  </div>
);

const SubtotalRow: React.FC<{ label: string; par: number; yards: number; strong?: boolean }> = ({ label, par, yards, strong }) => (
  <div
    role="row"
    style={{
      display: 'grid',
      gridTemplateColumns: '56px 1fr 1fr 1fr',
      padding: '8px 12px',
      background: strong ? '#F1F5F9' : '#F8FAFC',
      borderTop: `1px solid ${HAIRLINE_INK_8}`,
      fontSize: 13,
      fontWeight: strong ? 800 : 700,
      color: INK,
      ...NUM,
    }}
  >
    <div style={{ letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
    <div style={{ textAlign: 'right' }}>{par || '-'}</div>
    <div style={{ textAlign: 'right' }} aria-hidden="true"></div>
    <div style={{ textAlign: 'right' }}>{yards ? yards.toLocaleString('en-US') : '-'}</div>
  </div>
);

export default CourseTeeCard;
