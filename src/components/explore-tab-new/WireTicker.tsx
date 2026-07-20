import { useMemo } from 'react';
import { useWireActivity, type WireActivityRow, type WireFeatType } from './hooks/useWireActivity';
import { useScorecardOpener } from './useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { TickerShell } from '@/components/shared/wire/TickerShell';
import { WIRE_BG, WIRE_HEIGHT, WIRE_ITEM_GAP } from '@/components/shared/wire/tokens';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

const CHIP_LABEL: Record<WireFeatType, string> = {
  ace: 'ACE',
  albatross: 'ALBATROSS',
  eagle: 'EAGLE',
  birdie_haul: 'HAUL',
  under_par: 'UNDER PAR',
  pb_gross: 'RECORD',
  pb_stableford: 'RECORD',
  stableford: 'RECORD',
};

function formatFriendName(raw: string): string {
  const s = (raw ?? '').trim();
  if (!s) return 'A friend';
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    if (first && last) return `${first} ${last}`;
  }
  return s;
}

function achievementPhrase(row: WireActivityRow): string {
  const t = row.feat_type;
  if (t === 'ace') return 'made an ace';
  if (t === 'albatross') return 'made an albatross';
  if (t === 'eagle') return 'made an eagle';
  if (t === 'birdie_haul') return 'racked up a birdie haul';
  if (t === 'under_par') return 'went under par';
  if (t === 'pb_gross') return 'set a personal best';
  if (t === 'pb_stableford') return 'set a personal best';
  if (t === 'stableford') return 'posted a stableford';
  return 'set a mark';
}

export function WireTicker() {
  const { data } = useWireActivity();
  const { target, openByScore, close } = useScorecardOpener();

  const rows = useMemo(() => (data ?? []).slice(0, 20), [data]);

  const items = useMemo(
    () =>
      rows.map((r, i) => {
        const friend = formatFriendName(r.friend_name);
        const chipLabel = CHIP_LABEL[r.feat_type] ?? 'HIGHLIGHT';
        const detail = (r.feat_value ?? '').trim();
        const phrase = achievementPhrase(r);
        const text = `${friend} · ${phrase} at ${r.course_name}${detail ? ` · ${detail}` : ''}`;
        return (
          <button
            key={`${r.score_id}-${i}`}
            type="button"
            onClick={() => openByScore(r.score_id, r.connection_id, r.friend_user_id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: 0,
              paddingBlock: 12,
              marginBlock: -12,
              cursor: 'pointer',
              fontFamily: FONT,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: 4,
                background: '#FBBC2E',
                color: '#0F172A',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.06em',
                lineHeight: 1.3,
                flexShrink: 0,
              }}
            >
              {chipLabel}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.72)',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}
            >
              {text}
            </span>
          </button>
        );
      }),
    [rows, openByScore],
  );

  if (items.length === 0) return null;

  return (
    <>
      <TickerShell
        items={items}
        background={WIRE_BG}
        height={WIRE_HEIGHT}
        gap={WIRE_ITEM_GAP}
        ariaLabel="Live achievements wire"
      />
      <RoundDetailSheet
        open={!!target}
        onClose={close}
        scoreId={target?.scoreId ?? null}
        connectionId={target?.connectionId ?? null}
        profileUserId={target?.profileUserId ?? null}
      />
    </>
  );
}

export default WireTicker;
