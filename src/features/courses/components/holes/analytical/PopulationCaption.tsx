/**
 * FIELD_EXCLUDES_VIEWER_B (R4) — names the population of course-describing
 * blocks (score-spread bars, stroke-index ladder) that count EVERY round,
 * including the reader's, when they sit beside "Field" figures that exclude
 * the reader. Label only; it never changes a figure.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A, SANS } from './tokens';

export const PopulationCaption: React.FC<{ includesYou: boolean; style?: React.CSSProperties }> = ({ includesYou, style }) => {
  const { t } = useTranslation('courses');
  return (
    <div style={{ fontFamily: SANS, fontSize: 11.5, lineHeight: 1.45, color: A.DIM, ...style }}>
      {includesYou ? t('courseDetail.populations.everyRoundWithYours') : t('courseDetail.populations.everyRound')}
    </div>
  );
};
