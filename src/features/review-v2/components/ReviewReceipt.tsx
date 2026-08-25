/**
 * ReviewReceipt - the confirmation screen shown after a review posts.
 * Hero and breakdown render from client state immediately; everything below
 * waits on get_review_receipt and renders nothing until it arrives.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { RV2 } from '../tokens';
import { FIGURE } from '@/lib/tokens/type';
import { bandColorOnDark as bandColor } from '../bandColor';
import { useReviewReceipt } from '../hooks/useReviewReceipt';
import type { CategoryKey, ReviewV2Course } from '../types';

interface Props {
  ratingId: string;
  course: ReviewV2Course;
  overall: number | null;
  scores: Record<CategoryKey, number | null>;
  shareToFeed: boolean;
  onClubhouse: () => void;
  onBack: () => void;
  onNextCourse: (courseId: string) => void;
}

const CAT_ORDER: CategoryKey[] = ['design', 'condition', 'clubhouse', 'facilities'];

export function shortCourseName(name: string): string {
  const idx = name.indexOf('Golf');
  if (idx > 0) return name.slice(0, idx).trim();
  return name;
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  const rem10 = n % 10;
  if (rem10 === 1) return `${n}st`;
  if (rem10 === 2) return `${n}nd`;
  if (rem10 === 3) return `${n}rd`;
  return `${n}th`;
}

function formatPlayedDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'long' })}`;
}

function regionLine(course: ReviewV2Course): string {
  return [course.region, course.sub_country || course.country].filter(Boolean).join(', ');
}

export function ReviewReceipt({
  ratingId,
  course,
  overall,
  scores,
  shareToFeed,
  onClubhouse,
  onBack,
  onNextCourse,
}: Props) {
  const { t } = useTranslation('courses');
  const { data: receipt } = useReviewReceipt(ratingId);
  const heroColor = bandColor(overall);
  const short = shortCourseName(course.name);

  const viewedRef = useRef(false);
  useEffect(() => {
    if (!receipt || viewedRef.current) return;
    viewedRef.current = true;
    // review_receipt_viewed
    analyticsEvents.track('review_receipt_viewed', {
      course_id: course.id,
      unlocked_subscores: !!receipt.unlocked_subscores,
      is_top100: receipt.top100_rank != null,
      unrated_count: receipt.unrated_count ?? 0,
    });
  }, [receipt, course.id]);

  const catLabels: Record<CategoryKey, string> = {
    design: t('review.subscore.design'),
    condition: t('review.subscore.condition'),
    clubhouse: t('review.subscore.clubhouse'),
    facilities: t('review.subscore.facilities'),
  };
  // The overall is NOT derived from the categories - these are five
  // independent columns. This average only makes the divergence legible.
  // With any null category we omit the line rather than average three.
  const catAvg = useMemo(() => {
    const vals = CAT_ORDER.map((k) => scores[k]);
    if (vals.some((v) => v == null)) return null;
    const sum = vals.reduce((a, v) => a + (v as number), 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [scores]);


  // Row list is variable: build the rendered set first so the divider logic
  // never assumes a fixed count.
  const rows = useMemo(() => {
    if (!receipt) return [] as Array<'a' | 'b' | 'c' | 'd'>;
    const list: Array<'a' | 'b' | 'c' | 'd'> = ['a'];
    if (receipt.unlocked_subscores) list.push('b');
    if (receipt.top100_rank != null) list.push('c');
    list.push('d');
    return list;
  }, [receipt]);

  const delta =
    receipt && receipt.avg_before != null && overall != null
      ? Math.round(Math.abs(overall - Number(receipt.avg_before)) * 10) / 10
      : null;
  const showDelta = delta != null && delta >= 0.1;
  const deltaAbove =
    receipt && receipt.avg_before != null && overall != null
      ? overall > Number(receipt.avg_before)
      : false;

  const rowStyle = (i: number): React.CSSProperties => ({
    padding: '13px 0',
    borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${RV2.hairline}`,
  });

  const figure = (color: string): React.CSSProperties => ({ ...FIGURE, color });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: RV2.canvas,
        color: RV2.ink,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{ padding: '34px 20px 22px', textAlign: 'center' }}>
          <div
            style={{
              /* READ floor — a kicker is language. 10 -> 11. */
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: RV2.eyebrow,
              marginBottom: 12,
            }}
          >
            {t('review.wizard.receipt.eyebrow')}
          </div>
          <div
            style={{
              fontSize: 68,
              ...FIGURE,
              lineHeight: 1,
              letterSpacing: '-0.035em',
              color: heroColor,
            }}
          >
            {overall == null ? '--' : overall.toFixed(1)}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em', marginTop: 12 }}>
            {course.name}
          </div>
          <div style={{ fontSize: 12, color: RV2.secondary, marginTop: 2 }}>
            {regionLine(course)}
          </div>
        </div>

        {/* Breakdown card */}
        <div style={{ padding: '0 20px 20px' }}>
          <div
            style={{
              background: RV2.cardBg,
              borderRadius: 18,
              border: `1px solid ${RV2.hairline}`,
              padding: '15px 16px',
              display: 'grid',
              gap: 11,
            }}
          >
            {CAT_ORDER.map((key) => {
              const v = scores[key];
              const c = bandColor(v);
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ fontSize: 12, color: RV2.secondary, width: 66, flexShrink: 0 }}>
                    {catLabels[key]}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 3,
                      background: RV2.track,
                      position: 'relative',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${v == null ? 0 : (v / 10) * 100}%`,
                        background: c,
                      }}
                    />
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      ...FIGURE,
                      letterSpacing: '-0.03em',
                      color: c,
                      width: 26,
                      textAlign: 'right',
                    }}
                  >
                    {v == null ? '--' : v.toFixed(1)}
                  </span>
                </div>
              );
            })}
          </div>
          {catAvg != null && (
            <div
              style={{
                fontSize: 12,
                lineHeight: '17px',
                color: RV2.secondary,
                marginTop: 10,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Trans
                i18nKey="review.wizard.receipt.categoryAverage"
                ns="courses"
                values={{ avg: catAvg.toFixed(1) }}
                components={{
                  avg: (
                    <span
                      style={{
                        fontWeight: 700,
                        color: bandColor(catAvg),
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    />
                  ),
                }}
              />
            </div>
          )}

        </div>


        {receipt && (
          <>
            {/* What your rating did */}
            <div style={{ padding: '0 20px 22px' }}>
              <div
                style={{
                  /* READ floor. 10 -> 11. */
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: RV2.secondary,
                  marginBottom: 10,
                }}
              >
                {t('review.wizard.receipt.didEyebrow')}
              </div>
              <div
                style={{
                  background: RV2.cardBg,
                  borderRadius: 18,
                  border: `1px solid ${RV2.hairline}`,
                  padding: '2px 16px',
                }}
              >
                {rows.map((row, i) => {
                  if (row === 'a') {
                    return (
                      <div key="a" style={rowStyle(i)}>
                        <div style={{ fontSize: 14, color: RV2.ink, lineHeight: 1.45 }}>
                          <Trans
                            i18nKey="review.wizard.receipt.rowA"
                            ns="courses"
                            values={{
                              course: shortCourseName(receipt.course_name || course.name),
                              avg: receipt.community_avg == null ? '--' : Number(receipt.community_avg).toFixed(1),
                              count: receipt.rating_count ?? 0,
                            }}
                            components={{
                              avg: <span style={figure(bandColor(Number(receipt.community_avg)))} />,
                              cnt: <span style={figure(RV2.ink)} />,
                            }}
                          />
                        </div>
                        {showDelta && (
                          <div style={{ fontSize: 12, color: RV2.secondary, marginTop: 4 }}>
                            {deltaAbove
                              ? t('review.wizard.receipt.rowADeltaAbove', { delta: delta!.toFixed(1) })
                              : t('review.wizard.receipt.rowADeltaBelow', { delta: delta!.toFixed(1) })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  if (row === 'b') {
                    return (
                      <div key="b" style={rowStyle(i)}>
                        <div style={{ fontSize: 13, color: RV2.ink, lineHeight: 1.45 }}>
                          {t('review.wizard.receipt.rowB')}
                        </div>
                        <div style={{ fontSize: 11.5, color: RV2.secondary, marginTop: 4 }}>
                          {t('review.wizard.receipt.rowBSub')}
                        </div>
                      </div>
                    );
                  }
                  if (row === 'c') {
                    return (
                      <div
                        key="c"
                        style={{ ...rowStyle(i), display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: RV2.ink }}>
                          <Trans
                            i18nKey="review.wizard.receipt.rowC"
                            ns="courses"
                            values={{
                              rank: receipt.top100_rank ?? 0,
                              list: receipt.top100_list ?? '',
                            }}
                            components={{ b: <span style={{ fontWeight: 700 }} /> }}
                          />
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: RV2.secondary,
                            flexShrink: 0,
                          }}
                        >
                          {t('review.wizard.receipt.rowCRight', {
                            count: receipt.your_rated_in_list ?? 0,
                          })}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key="d"
                      style={{ ...rowStyle(i), display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: RV2.ink }}>
                        <Trans
                          i18nKey="review.wizard.receipt.rowD"
                          ns="courses"
                          values={{ ordinal: ordinal(receipt.your_rank_of_rated ?? 1) }}
                          components={{ b: <span style={{ fontWeight: 700 }} /> }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: RV2.secondary,
                          flexShrink: 0,
                        }}
                      >
                        {t('review.wizard.receipt.rowDRight', {
                          count: receipt.your_total_rated ?? 0,
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The next course */}
            {receipt.next_course_id && (
              <div style={{ padding: '0 20px 22px' }}>
                <div
                  style={{
                    /* READ floor — the unrated-courses kicker. 10 -> 11. */
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: RV2.secondary,
                    marginBottom: 10,
                  }}
                >
                  {t('review.wizard.receipt.nextEyebrow', {
                    count: receipt.unrated_count ?? 0,
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // review_next_course_tapped
                    analyticsEvents.track('review_next_course_tapped', {
                      from_course_id: course.id,
                      to_course_id: receipt.next_course_id,
                    });
                    onNextCourse(receipt.next_course_id!);
                  }}
                  style={{
                    width: '100%',
                    background: RV2.cardBg,
                    borderRadius: 18,
                    border: `1px solid ${RV2.hairline}`,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: RV2.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {receipt.next_course_name}
                    </div>
                    {receipt.next_played_at && (
                      <div style={{ fontSize: 12, color: RV2.secondary }}>
                        {t('review.wizard.receipt.nextPlayed', {
                          date: formatPlayedDate(receipt.next_played_at),
                        })}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '7px 13px',
                      borderRadius: 999,
                      background: RV2.amberSoft,
                      color: RV2.amber,
                      /* CAPS ACTION (§5) — two points down, floor 11. */
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.10em',
                      flexShrink: 0,
                    }}
                  >
                    {t('review.wizard.receipt.nextRate')}
                  </span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          borderTop: `1px solid ${RV2.hairline}`,
          padding: '14px 20px 20px',
        }}
      >
        {shareToFeed ? (
          <>
            <button
              type="button"
              onClick={() => {
                // review_receipt_action
                analyticsEvents.track('review_receipt_action', {
                  course_id: course.id,
                  action: 'clubhouse',
                });
                onClubhouse();
              }}
              style={{
                width: '100%',
                padding: 15,
                borderRadius: 14,
                border: 'none',
                background: RV2.ink,
                color: RV2.canvas,
                /* CAPS ACTION (§5) — two points down, height unchanged. */
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                cursor: 'pointer',
              }}
            >
              {t('review.wizard.receipt.actionClubhouse')}
            </button>
            <button
              type="button"
              onClick={() => {
                analyticsEvents.track('review_receipt_action', {
                  course_id: course.id,
                  action: 'back',
                });
                onBack();
              }}
              style={{
                width: '100%',
                padding: 13,
                marginTop: 9,
                borderRadius: 14,
                border: 'none',
                background: 'transparent',
                color: RV2.secondary,
                /* CAPS ACTION (§5) — two points down, floor 11. */
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.10em',
                cursor: 'pointer',
              }}
            >
              {t('review.wizard.receipt.actionBack', { course: short })}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              analyticsEvents.track('review_receipt_action', {
                course_id: course.id,
                action: 'back',
              });
              onBack();
            }}
            style={{
              width: '100%',
              padding: 15,
              borderRadius: 14,
              border: 'none',
              background: RV2.ink,
              color: RV2.canvas,
              /* CAPS ACTION (§5) — two points down, height unchanged. */
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.10em',
              cursor: 'pointer',
            }}
          >
            {t('review.wizard.receipt.actionBack', { course: short })}
          </button>
        )}
      </div>
    </div>
  );
}
