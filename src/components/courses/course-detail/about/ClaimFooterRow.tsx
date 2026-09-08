/**
 * BRIEF_COURSE_TAB_REBUILD — THE CLAIM ROW, RULED: option 1, built as a footer.
 *
 * Not a place to explore, so it is not part of §3.11 Keep exploring. It is an
 * administrative offer to a course owner, so it reads as one:
 *
 *  - a hairline above it with generous space, so it sits clearly BELOW Keep
 *    exploring rather than as another of its rows
 *  - DIM rather than the INK used by navigation rows
 *  - "Own or manage this course?" left, "Claim" right with its chevron
 *  - last thing on the tab, beneath everything, above only bottom clearance
 *
 * INTENDED DESTINATION (recorded so it is not rediscovered): when a
 * suggest-an-edit affordance exists, this moves into that one administrative
 * door and this footer row goes. Two administrative offers justify a door; one
 * does not.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';

import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { GUTTER } from './AboutSection';

interface Props {
  /** 'offer' = unclaimed course. 'pending' = this viewer's claim is under review. */
  mode?: 'offer' | 'pending';
  onClaimClick: () => void;
  children?: React.ReactNode;
}

const ClaimFooterRow: React.FC<Props> = ({ mode = 'offer', onClaimClick, children }) => {
  const { t } = useTranslation('courses');

  if (mode === 'pending') {
    // RULED: under review is a message to ONE person about a form they
    // submitted, not a fact about the course. Same audience as the offer, so
    // the same place — the footer, not the content flow.
    return (
      <div style={{ marginTop: 40, padding: `0 ${GUTTER}px`, fontFamily: SANS }}>
        <div style={{ height: 1, background: A.HAIRLINE }} aria-hidden="true" />
        <div style={{ marginTop: 8 }}>{children}</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 40, padding: `0 ${GUTTER}px`, fontFamily: SANS }}>
      <div style={{ height: 1, background: A.HAIRLINE }} aria-hidden="true" />
      <button
        type="button"
        onClick={onClaimClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          minHeight: 44,
          marginTop: 8,
          padding: 0,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: SANS,
        }}
      >
        <span style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700, color: A.DIM }}>
          {t('courseDetail.claim.cta.title')}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: A.DIM }}>
          {t('courseDetail.claim.cta.action')}
        </span>
        {/* Opens the claim sheet — a destination of a kind, and the brief names
            the chevron explicitly here. */}
        <span style={{ fontSize: 13, color: A.DIM, fontWeight: 700 }} aria-hidden="true">
          {'\u203A'}
        </span>
      </button>
    </div>
  );
};

export default ClaimFooterRow;
