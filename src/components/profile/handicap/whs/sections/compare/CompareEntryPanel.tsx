/**
 * CompareEntryPanel - the way into the compare sheet from Circle.
 *
 * It SHOWS PEOPLE rather than describing the feature. Up to three of the
 * members the owner played with most recently, each row opening the sheet
 * ALREADY SET to that person - one tap, not two - then a search row beneath
 * for anyone else. The three rows are the near door; the search row is the
 * wide one.
 *
 * The list comes from useCompareRecent, the SAME definition the sheet's list
 * state uses, so the panel and the sheet can never disagree about who
 * "recent" is or in what order.
 *
 * STATES: no shared rounds with a listed person renders recency ALONE (a
 * "0 rounds together" line is a reason not to tap); fewer than three members
 * renders what exists and never pads; no clbhouz friends at all collapses the
 * rows and leaves heading plus search row, which is still a working entry.
 *
 * FRIEND VIEW (readOnly): heading and search row only. Three faces from the
 * VIEWER'S recent list would be wrong on the owner's tab.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Search } from 'lucide-react';
import { getInitialsFromName, getAvatarFallbackGradient } from '@/lib/avatarFallback';
import { formatRelativeAgo } from '@/i18n/format';
import { CHART, CHART_FONT } from '../../charts';
import { DARK_ROW_TITLE } from '../../sections/_shared/darkAtoms';
import { openCompare } from './events';
import { useCompareRecent, type CompareRecentEntry } from './useCompareRecent';
import { useSharedRoundCounts } from '@/lib/whs/hooks';

const PANEL_LIMIT = 3;

const KICKER: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.19em',
  textTransform: 'uppercase',
  color: CHART.MUTE,
};

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: CHART.MUTE,
};

/** Plus-handicap format unchanged: -2.1 reads +2.1. */
const formatIndex = (v: number | null): string =>
  v == null ? '' : v < 0 ? `+${Math.abs(v).toFixed(1)}` : v.toFixed(1);

interface Props {
  /** The viewing member - owner of the tab when not readOnly. */
  viewerUserId?: string;
  readOnly?: boolean;
}

const PersonRow: React.FC<{
  person: CompareRecentEntry;
  sharedCount: number;
}> = ({ person, sharedCount }) => {
  const { t } = useTranslation('common');
  const fbBg = getAvatarFallbackGradient(person.userId);
  const when = person.lastPlayedAt
    ? formatRelativeAgo(person.lastPlayedAt, { yesterday: true })
    : null;

  /**
   * A zero count is not rendered. Recency alone stands in its place, because
   * "0 rounds together" argues against the tap the row exists to invite.
   */
  const sub =
    sharedCount > 0
      ? [t('handicap.compare.roundsTogether', { count: sharedCount }), when]
          .filter(Boolean)
          .join(' \u00B7 ')
      : when
        ? t('handicap.compare.playedAgo', { when })
        : null;

  return (
    <button
      type="button"
      onClick={() => openCompare('circle', person.userId)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 0',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: CHART_FONT,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 34,
          height: 34,
          borderRadius: 11,
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
            borderRadius: 11,
            border: `1px solid ${CHART.FAINT}`,
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...DARK_ROW_TITLE, color: CHART.INK, overflowWrap: 'anywhere' }}>
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
        {sub && <div style={{ ...LABEL, marginTop: 4 }}>{sub}</div>}
      </div>

      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: '-0.03em',
          color: CHART.INK,
          fontVariantNumeric: 'tabular-nums lining-nums',
          flexShrink: 0,
        }}
      >
        {formatIndex(person.index)}
      </span>
      <ChevronRight size={15} strokeWidth={2.2} color={CHART.DIM} style={{ flexShrink: 0 }} />
    </button>
  );
};

export const CompareEntryPanel: React.FC<Props> = ({
  viewerUserId,
  readOnly = false,
}) => {
  const { t } = useTranslation('common');
  const showPeople = !readOnly && !!viewerUserId;

  const recent = useCompareRecent(viewerUserId, PANEL_LIMIT, showPeople);
  const ids = React.useMemo(() => recent.map((p) => p.userId), [recent]);
  const { data: sharedCounts } = useSharedRoundCounts(
    viewerUserId as string,
    ids,
    showPeople && ids.length > 0,
  );

  const people = showPeople ? recent : [];

  return (
    <section style={{ marginTop: 32, fontFamily: CHART_FONT }}>
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <div style={KICKER}>{t('handicap.compare.kicker')}</div>
        <div
          style={{
            marginTop: 5,
            fontSize: 21,
            fontWeight: 700,
            letterSpacing: '-0.035em',
            color: CHART.INK,
          }}
        >
          {t('handicap.compare.title')}
        </div>
      </div>

      <div
        style={{
          margin: '0 16px',
          background: CHART.PANEL,
          border: `1px solid ${CHART.BORDER}`,
          borderRadius: 16,
          padding: '4px 14px 14px',
        }}
      >
        {/* No rule between rows. Absent people simply collapse - no empty state. */}
        {people.map((p) => (
          <PersonRow
            key={p.userId}
            person={p}
            sharedCount={sharedCounts?.[p.userId] ?? 0}
          />
        ))}

        <button
          type="button"
          onClick={() => openCompare('circle')}
          style={{
            marginTop: people.length > 0 ? 4 : 10,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'var(--hcp-bg-2)',
            border: '1px solid var(--hcp-line)',
            borderRadius: 11,
            padding: '11px 13px',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: CHART_FONT,
          }}
        >
          <Search size={14} strokeWidth={2.2} color={CHART.MUTE} style={{ flexShrink: 0 }} />
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 13.5,
              fontWeight: 400,
              color: CHART.INK,
            }}
          >
            {t('handicap.compare.anyone')}
          </span>
          <ChevronRight size={15} strokeWidth={2.2} color={CHART.DIM} style={{ flexShrink: 0 }} />
        </button>
      </div>
    </section>
  );
};

export default CompareEntryPanel;
