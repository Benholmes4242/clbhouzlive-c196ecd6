import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getInitialsFromName } from '@/lib/avatarFallback';
import {
  A,
  FIGS,
  LABEL,
  NUM,
  SANS,
} from '@/features/courses/components/holes/analytical/tokens';
import {
  ACTION_DEFAULTS,
  UNIT_DEFAULTS,
  wireWhen,
  type WireEvent,
} from '../hooks/useDiscoverWire';

/**
 * WireRow — one row per event, whatever the kind. To a member a record, a
 * crown, an ace, an eagle and a birdie haul are one thing: somebody did
 * something notable somewhere.
 *
 * Three lines, one fact each: who, what, where. The course gets its own line
 * because it is what the event is about and a club name cut halfway through is
 * worse than a taller row.
 */

/** Body ink for line 2. Between INK and MUTE on the analytical scale. */
const BODY = '#3D4550';

const WIRE_GRID = '34px 1fr auto';

const NAME: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

interface Props {
  event: WireEvent;
  onPress?: () => void;
}

export function WireRow({ event: e, onPress }: Props) {
  const { t } = useTranslation('courses');

  const action = t(e.actionKey, {
    defaultValue: ACTION_DEFAULTS[e.actionKey] ?? '',
    ...(e.actionParams ?? {}),
  });

  const unit = e.figureSubKey
    ? t(e.figureSubKey, { defaultValue: UNIT_DEFAULTS[e.figureSubKey] ?? '' })
    : '';

  const tagLabel = e.tagKey
    ? e.tagKey === 'ace'
      ? t('discover.wire.tag.ace', 'Hole in one')
      : t('discover.wire.tag.albatross', 'Albatross')
    : '';

  const actorLabel = e.isOwn ? t('discover.wire.you', 'You') : e.actorName;

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        cursor: onPress ? 'pointer' : 'default',
        display: 'grid',
        gridTemplateColumns: WIRE_GRID,
        alignItems: 'center',
        gap: 12,
        padding: '13px 0',
        fontFamily: SANS,
        textAlign: 'left',
        ...FIGS,
      }}
    >
      <SquircleAvatar
        size={34}
        src={e.actorAvatar}
        alt={actorLabel}
        userId={e.userId}
        fallback={getInitialsFromName(e.actorName)}
        ringColor={e.isOwn ? A.AMBER : undefined}
        hairlineRing={!e.isOwn}
      />

      <span style={{ minWidth: 0, alignSelf: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0 }}>
          {/* Amber means the viewing member. The only amber in the wire. */}
          <span style={{ ...NAME, color: e.isOwn ? A.AMBER_DEEP : A.INK }}>{actorLabel}</span>
          <span style={{ ...LABEL, fontSize: 8.5, flex: 'none' }}>{wireWhen(e.at)}</span>
        </span>

        {action && (
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: BODY,
              marginTop: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {action}
          </span>
        )}

        {e.courseName && (
          <span
            style={{
              display: 'block',
              fontSize: 12.5,
              color: A.MUTE,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {e.courseName}
          </span>
        )}
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
        {/* Tags are solid ink, never amber: rarity is carried by weight so
            amber stays reserved for the viewing member. */}
        {tagLabel && (
          <span
            style={{
              fontSize: 8.5,
              fontWeight: 800,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              borderRadius: 999,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              flex: 'none',
              background: A.INK,
              color: '#FFFFFF',
            }}
          >
            {tagLabel}
          </span>
        )}

        {/* Centred, not right-aligned: the unit belongs directly beneath its
            own number, so "71" sits centred above "GROSS". */}
        {e.figure != null && (
          <span style={{ textAlign: 'center', minWidth: 46 }}>
            <span style={{ ...NUM, fontSize: 16, color: e.figureTone ?? A.INK, display: 'block' }}>
              {e.figure}
            </span>
            {unit && (
              <span style={{ ...LABEL, fontSize: 8, display: 'block', marginTop: 1 }}>{unit}</span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}

export default WireRow;
