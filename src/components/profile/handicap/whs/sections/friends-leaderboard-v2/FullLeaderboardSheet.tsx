/**
 * FullLeaderboardSheet — the see-all for the handicap page's circle section.
 *
 * THIS SHEET IS THIN. It renders the SAME CircleRow the page renders, from the
 * same cohorts, with the same club resolution (useCircleClubs) — so the amber
 * rule, the single figure column and the viewer's club string cannot drift from
 * the page again. It owns only the sheet chrome, the cohort labels and the
 * inactive expander.
 *
 * NO RANK-MOVEMENT COLUMN and no "30D RANK" header: the chip was empty on held
 * positions, unknown deltas and every stale row, so the label read as a header
 * for the index column beside it. The header now carries the page's meta —
 * "By index" — which is what the list is sorted on.
 *
 * THE INACTIVE COUNT IS THE CONTROL. It used to be a claim in the header with
 * its expander at the foot of a twenty-four-row scroll. The count itself now
 * expands, with a DOWN chevron because it expands rather than navigates.
 *
 * INACTIVE means no posted round within 90 days (STALE_THRESHOLD_DAYS in
 * buildLeaderboardCohorts) — the same definition the page counts, because it is
 * the same computation. The viewing member is always active.
 */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { ChevronDown } from 'lucide-react';
import { CircleRow, CircleFlameLegend, hasFlame } from './CircleRow';
import { useCircleClubs } from './useCircleClubs';
import { buildLeaderboardCohorts } from '@/lib/whs/utils/buildLeaderboardCohorts';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';

interface FullLeaderboardSheetProps {
  open: boolean;
  onClose: () => void;
  cohorts: ReturnType<typeof buildLeaderboardCohorts>;
  onRowClick: (entry: FriendLeaderboardEntry) => void;
  viewMode?: 'owner' | 'friend';
  ownerFirstName?: string | null;
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
// Hardcoded dark tokens — BottomSheet portals outside .hcp-dark scope.
const DIM = 'rgba(242,244,247,0.55)';
const LABEL_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  color: DIM,
  textTransform: 'uppercase',
  margin: 0,
};

export const FullLeaderboardSheet: React.FC<FullLeaderboardSheetProps> = ({
  open,
  onClose,
  cohorts,
  onRowClick,
  viewMode = 'owner',
  ownerFirstName = null,
}) => {
  const { t } = useTranslation(['common']);
  const [showInactive, setShowInactive] = useState(false);
  const isFriend = viewMode === 'friend';
  const possessive = ownerFirstName ? `${ownerFirstName}'s` : 'Their';

  const circleEntries = useMemo(() => cohorts.active.concat(cohorts.inactive), [cohorts]);
  const clubFor = useCircleClubs(circleEntries);

  const flameOnScreen =
    cohorts.active.some((e) => hasFlame(e)) ||
    (showInactive && cohorts.inactive.some((e) => hasFlame(e, true)));

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      ariaLabelledBy="full-leaderboard-title"
      variant="dark"
      surfaceColor="#15171F"
      style={{
        maxHeight: '85dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <SheetHeader
        dark
        eyebrow="LEADERBOARD"
        title={<span id="full-leaderboard-title">{isFriend ? `${possessive} circle` : 'Your circle'}</span>}
        sub={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span>
              {cohorts.totalActive} active &middot; {t('common:handicap.circle.section.meta')}
            </span>
            {cohorts.totalInactive > 0 && (
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                aria-expanded={showInactive}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: 0,
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  font: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: 2,
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {cohorts.totalInactive} inactive
                <ChevronDown
                  size={12}
                  strokeWidth={2}
                  style={{
                    transform: showInactive ? 'rotate(180deg)' : 'none',
                    transition: 'transform 160ms ease',
                  }}
                />
              </button>
            )}
          </span>
        }
        onClose={onClose}
      />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          fontFamily: FONT,
        }}
      >
        <div style={{ padding: '12px 16px 4px' }}>
          <p style={LABEL_STYLE}>ALL ACTIVE &middot; {cohorts.totalActive}</p>
        </div>

        <div style={{ padding: '0 16px' }}>
          {cohorts.active.map((entry, idx) => (
            <CircleRow
              key={entry.is_self ? 'self' : `${entry.friend_user_id ?? ''}-${entry.friend_name}`}
              entry={entry}
              position={idx + 1}
              club={clubFor(entry)}
              selfLabel={t('common:handicap.circle.section.you')}
              isFirst={idx === 0}
              onPress={entry.is_self ? undefined : () => onRowClick(entry)}
            />
          ))}

          {cohorts.totalInactive > 0 && showInactive && (
            <>
              <div style={{ padding: '16px 0 4px' }}>
                <p style={LABEL_STYLE}>INACTIVE &middot; {cohorts.totalInactive}</p>
              </div>
              {cohorts.inactive.map((entry, idx) => (
                <CircleRow
                  key={`inactive-${entry.friend_user_id ?? ''}-${entry.friend_name}`}
                  entry={entry}
                  position={null}
                  club={clubFor(entry)}
                  selfLabel={t('common:handicap.circle.section.you')}
                  isFirst={idx === 0}
                  stale
                  onPress={() => onRowClick(entry)}
                />
              ))}
            </>
          )}

          {flameOnScreen && (
            <CircleFlameLegend label={t('common:handicap.circle.section.flameLegend')} />
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default FullLeaderboardSheet;
