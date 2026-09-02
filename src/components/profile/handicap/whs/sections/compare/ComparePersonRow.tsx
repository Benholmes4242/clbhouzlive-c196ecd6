/**
 * ComparePersonRow - one selectable player in the compare sheet's list state.
 *
 * Takes a MINIMAL shape, not a leaderboard entry, so the recent-players list
 * and the search results render through the same row.
 *
 * Avatar, name, a LABEL context line, the shared-round standing, their index
 * as a FIGURE, then a chevron. The shared-round count is BATCHED by the list
 * (one RPC for every visible id) and passed in - the row itself queries
 * nothing.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { CHART, CHART_FONT, LABEL_STYLE } from '../../charts';

export interface ComparePerson {
  userId: string;
  /**
   * NULL MEANS UNRESOLVED, NOT ABSENT. A clbhouz member's name comes from
   * user_profiles; while that read is in flight the row and the sheet hold a
   * shell rather than substituting a placeholder or a UI string.
   */
  name: string | null;
  avatarUrl: string | null;
  /** Handicap index, when known. */
  index: number | null;
  /** "2 days ago . Sunningdale", or null for search results. */
  contextLine: string | null;
}

interface Props {
  person: ComparePerson;
  /** Shared-round count from the list's batched lookup. */
  sharedCount: number;
  onSelect: (person: ComparePerson, sharedRounds: number) => void;
}

export const ComparePersonRow: React.FC<Props> = ({
  person,
  sharedCount,
  onSelect,
}) => {
  const { t } = useTranslation('common');
  const fbBg = getAvatarFallbackGradient(person.userId);

  return (
    <button
      type="button"
      onClick={() => onSelect(person, sharedCount)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '11px 16px',
        background: 'none',
        border: 'none',
        borderTop: `1px solid ${CHART.BORDER}`,
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: CHART_FONT,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 33,
          height: 33,
          borderRadius: '34%',
          overflow: 'hidden',
          background: person.avatarUrl ? CHART.PANEL_2 : fbBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: CHART.INK,
          flexShrink: 0,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {person.avatarUrl ? (
          <img
            src={person.avatarUrl}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>{person.name ? getInitialsFromName(person.name) || '?' : ''}</span>
        )}
        {/* Canonical traced hairline ring - dark surface token. */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '34%',
            border: `1px solid ${CHART.FAINT}`,
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: CHART.INK,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {person.name ?? (
            <span
              aria-hidden
              style={{
                display: 'inline-block',
                width: 116,
                height: 11,
                borderRadius: 4,
                background: CHART.PANEL_2,
              }}
            />
          )}
        </div>
        {person.contextLine && (
          <div
            style={{
              ...LABEL_STYLE,
              marginTop: 4,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {person.contextLine}
          </div>
        )}
        <div style={{ ...LABEL_STYLE, marginTop: 3, color: CHART.MUTE }}>
          {sharedCount > 0
            ? t('handicap.compare.sharedRounds', { count: sharedCount })
            : t('handicap.compare.neverPlayed')}
        </div>
      </div>

      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: CHART.INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
          flexShrink: 0,
        }}
      >
        {person.index != null ? person.index.toFixed(1) : '-'}
      </span>
      <ChevronRight
        size={15}
        strokeWidth={2.2}
        color={CHART.DIM}
        style={{ flexShrink: 0 }}
      />
    </button>
  );
};

export default ComparePersonRow;
