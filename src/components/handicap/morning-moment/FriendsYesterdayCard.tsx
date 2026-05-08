/**
 * FriendsYesterdayCard — rich two-tier section showing yesterday's
 * standout friend (hero card) and the rest of the group (horizontal
 * scroll of 250px mini cards). Tap-through navigates to Friends sub-tab.
 */
import React from 'react';
import { Trophy, Crown, Sparkles } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { FriendsYesterdayResult, FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { analyticsEvents } from '@/utils/analyticsEvents';

const T = {
  ink: '#0F172A',
  ink70: '#475569',
  ink55: 'rgba(15,23,42,0.55)',
  ink40: 'rgba(15,23,42,0.40)',
  ink10: 'rgba(15,23,42,0.10)',
  ink08: 'rgba(15,23,42,0.08)',
  ink06: 'rgba(15,23,42,0.06)',
  ink04: 'rgba(15,23,42,0.04)',
  amber: '#F7931E',
  gold: '#FBBC2E',
  green: '#22C55E',
  greenDeep: '#15803D',
  greenSoft: 'rgba(34,197,94,0.12)',
  red: '#DC2626',
  redInk: '#991B1B',
  redSoft: 'rgba(220,38,38,0.10)',
  eagleGreen: '#16A34A',
};
const FONT = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

// ── Helpers ──────────────────────────────────────────────────
const fmtDiff = (n: number | null): string => {
  if (n === null || n === undefined) return '—';
  if (n > 0) return `+${n.toFixed(1)}`;
  if (n < 0) return `\u2212${Math.abs(n).toFixed(1)}`;
  return '0.0';
};
const diffColor = (n: number | null): string => {
  if (n === null || n === undefined) return T.ink;
  if (n < 0) return T.greenDeep;
  if (n > 0) return T.redInk;
  return T.ink;
};
const fmtHcpDelta = (delta: number | null) => {
  if (delta === null || Math.abs(delta) < 0.05) return null;
  if (delta < 0) return { sign: '↓', value: Math.abs(delta).toFixed(1), color: T.greenDeep, bg: T.greenSoft };
  return { sign: '↑', value: delta.toFixed(1), color: T.redInk, bg: T.redSoft };
};
const hasBreakdown = (f: FriendYesterday): boolean =>
  f.eagle_plus !== null || f.birdie !== null || f.par_count !== null;

// ── Breakdown chips ──────────────────────────────────────────
interface BreakdownRowProps {
  data: FriendYesterday;
  label?: string | null;
}

const BreakdownRow: React.FC<BreakdownRowProps> = ({ data, label = null }) => {
  const showEagle = (data.eagle_plus ?? 0) > 0;
  const chips: Array<{ color?: string; count: number; isEagle?: boolean }> = [];
  if (showEagle) chips.push({ count: data.eagle_plus ?? 0, isEagle: true });
  chips.push({ color: T.gold, count: data.birdie ?? 0 });
  chips.push({ color: T.ink40, count: data.par_count ?? 0 });
  chips.push({ color: T.amber, count: data.bogey ?? 0 });
  chips.push({ color: T.red, count: data.double_plus ?? 0 });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      {label && (
        <div style={{ fontSize: 9, fontWeight: 800, color: T.ink55, letterSpacing: '0.14em' }}>
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
        {data.hole_in_one && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: '2px 6px', borderRadius: 6,
            background: `linear-gradient(135deg, ${T.gold}, ${T.amber})`,
            color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          }}>
            <Sparkles size={9} strokeWidth={2.4} />
            HIO
          </div>
        )}
        {chips.map((s, i) => (
          <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {s.isEagle ? (
              <Crown size={10} color={T.eagleGreen} strokeWidth={2.4} />
            ) : (
              <span style={{
                width: 6, height: 6, borderRadius: '50%', background: s.color,
                display: 'inline-block',
              }} />
            )}
            <span style={{
              fontSize: 11, fontWeight: 700, color: T.ink,
              fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
            }}>
              {s.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Stat cells ──────────────────────────────────────────────
interface StatCellProps {
  label: string;
  value: string | number;
  sub?: string;
  border?: boolean;
  valueColor?: string;
}

const StatCell: React.FC<StatCellProps> = ({ label, value, sub, border, valueColor }) => (
  <div style={{
    flex: 1,
    paddingLeft: border ? 12 : 0,
    borderLeft: border ? `0.5px solid ${T.ink10}` : undefined,
    minWidth: 0,
  }}>
    <div style={{
      fontSize: 9, fontWeight: 800, color: T.ink55,
      letterSpacing: '0.14em', marginBottom: 4,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 22, fontWeight: 800, color: valueColor ?? T.ink,
      lineHeight: 1, fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </div>
    {sub && (
      <div style={{
        fontSize: 10, color: T.ink55, marginTop: 3, fontWeight: 600,
      }}>
        {sub}
      </div>
    )}
  </div>
);

interface MiniStatProps {
  label: string;
  value: string | number;
  border?: boolean;
  valueColor?: string;
}

const MiniStat: React.FC<MiniStatProps> = ({ label, value, border, valueColor }) => (
  <div style={{
    flex: 1,
    paddingLeft: border ? 10 : 0,
    borderLeft: border ? `0.5px solid ${T.ink10}` : undefined,
    minWidth: 0,
  }}>
    <div style={{
      fontSize: 8.5, fontWeight: 800, color: T.ink55,
      letterSpacing: '0.14em', marginBottom: 3,
    }}>
      {label}
    </div>
    <div style={{
      fontSize: 17, fontWeight: 800, color: valueColor ?? T.ink, lineHeight: 1,
      fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
    }}>
      {value}
    </div>
  </div>
);

// ── Hcp footer (shared by hero + mini) ──────────────────────
const HcpRow: React.FC<{ data: FriendYesterday }> = ({ data }) => {
  const before = data.handicap_index_at_time;
  const after = data.friend_handicap_index;
  const delta = (before !== null && after !== null) ? after - before : null;
  const deltaInfo = fmtHcpDelta(delta);

  if (after === null) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontSize: 12, fontWeight: 700, color: T.ink,
      fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
    }}>
      <span>
        {data.is_counter && before !== null
          ? `${before.toFixed(1)} → ${after.toFixed(1)}`
          : after.toFixed(1)}
      </span>
      {data.is_counter ? (
        deltaInfo ? (
          <span style={{
            padding: '2px 7px', borderRadius: 999,
            background: deltaInfo.bg, color: deltaInfo.color,
            fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
          }}>
            {deltaInfo.sign} {deltaInfo.value}
          </span>
        ) : (
          <span style={{
            padding: '2px 7px', borderRadius: 999,
            background: T.ink06, color: T.ink55,
            fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
          }}>
            UNCHANGED
          </span>
        )
      ) : (
        <span style={{
          padding: '2px 7px', borderRadius: 999,
          background: T.ink06, color: T.ink55,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.10em',
        }}>
          NOT COUNTER
        </span>
      )}
    </div>
  );
};

const HcpRowMini: React.FC<{ data: FriendYesterday }> = ({ data }) => {
  const before = data.handicap_index_at_time;
  const after = data.friend_handicap_index;
  const delta = (before !== null && after !== null) ? after - before : null;
  const deltaInfo = fmtHcpDelta(delta);

  if (after === null) return null;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 11, fontWeight: 700, color: T.ink,
      fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
    }}>
      <span>
        {data.is_counter && before !== null
          ? `${before.toFixed(1)} → ${after.toFixed(1)}`
          : after.toFixed(1)}
      </span>
      {data.is_counter && deltaInfo && (
        <span style={{
          padding: '1px 5px', borderRadius: 999,
          background: deltaInfo.bg, color: deltaInfo.color,
          fontSize: 9, fontWeight: 800, letterSpacing: '0.04em',
        }}>
          {deltaInfo.sign}{deltaInfo.value}
        </span>
      )}
      {!data.is_counter && (
        <span style={{
          padding: '1px 5px', borderRadius: 999,
          background: T.ink06, color: T.ink55,
          fontSize: 8.5, fontWeight: 800, letterSpacing: '0.08em',
        }}>
          NON-CTR
        </span>
      )}
    </div>
  );
};

// ── Hero card ───────────────────────────────────────────────
const HeroCard: React.FC<{ data: FriendYesterday; onClick: () => void }> = ({ data, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: 'block', width: '100%', padding: 0, background: '#fff',
      border: `0.5px solid ${T.ink10}`, borderRadius: 14, overflow: 'hidden',
      textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
    }}
  >
    {/* Course image */}
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16 / 4',
      background: data.course_thumbnail_image
        ? `url(${data.course_thumbnail_image}) center/cover`
        : `linear-gradient(135deg, #1f2937, #0f172a)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.35) 100%)',
      }} />

      {/* BEST OF GROUP pill */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 9px', borderRadius: 999,
        background: `linear-gradient(135deg, ${T.gold}, ${T.amber})`,
        color: '#0F172A', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.10em',
      }}>
        <Trophy size={10} strokeWidth={2.5} />
        BEST OF GROUP
      </div>

      {/* Avatar + name */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: data.thumbnail_url
            ? `url(${data.thumbnail_url}) center/cover`
            : 'linear-gradient(135deg, #22C55E, #15803D)',
          border: '1.5px solid rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 800,
        }}>
          {!data.thumbnail_url && data.initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textShadow: '0 1px 4px rgba(0,0,0,0.6)',
          }}>
            {data.name}
          </div>
          {data.course_name && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            }}>
              {data.course_name}
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Body */}
    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <StatCell label="GROSS" value={data.score} sub={data.is_counter ? 'Counter' : '\u00A0'} />
        <StatCell label="STABLEFORD" value={data.stableford ?? '—'} sub={data.stableford !== null ? 'pts' : '\u00A0'} border />
        <StatCell label="DIFFERENTIAL" value={fmtDiff(data.differential)} sub="vs course" border valueColor={diffColor(data.differential)} />
      </div>

      {/* Breakdown row */}
      {hasBreakdown(data) ? (
        <div style={{ paddingTop: 10, borderTop: `0.5px solid ${T.ink10}` }}>
          <BreakdownRow data={data} label="ROUND" />
        </div>
      ) : (
        <div style={{
          paddingTop: 10, borderTop: `0.5px solid ${T.ink10}`,
          fontSize: 11, color: T.ink40, fontStyle: 'italic',
        }}>
          Hole-by-hole not synced
        </div>
      )}

      {/* Hcp row */}
      <div style={{
        paddingTop: 10, borderTop: `0.5px solid ${T.ink10}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, color: T.ink55, letterSpacing: '0.06em',
        }}>
          Handicap index
        </span>
        <HcpRow data={data} />
      </div>
    </div>
  </button>
);

// ── Mini card (250px) ───────────────────────────────────────
const MiniCard: React.FC<{ data: FriendYesterday; onClick: () => void }> = ({ data, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: '0 0 auto', width: 250, padding: 12, background: '#fff',
      border: `0.5px solid ${T.ink10}`, borderRadius: 12, scrollSnapAlign: 'start',
      display: 'flex', flexDirection: 'column', gap: 10,
      textAlign: 'left', cursor: 'pointer', fontFamily: FONT,
    }}
  >
    {/* Header */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: data.thumbnail_url
          ? `url(${data.thumbnail_url}) center/cover`
          : 'linear-gradient(135deg, #22C55E, #15803D)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 12, fontWeight: 800,
      }}>
        {!data.thumbnail_url && data.initial}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {data.name}
        </div>
        {data.course_name && (
          <div style={{
            fontSize: 10.5, color: T.ink55, marginTop: 2,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {data.course_name}
          </div>
        )}
      </div>
    </div>

    {/* 3-stat row */}
    <div style={{
      display: 'flex', alignItems: 'flex-start',
      paddingTop: 9, borderTop: `0.5px solid ${T.ink10}`,
    }}>
      <MiniStat label="GROSS" value={data.score} />
      <MiniStat label="POINTS" value={data.stableford ?? '—'} border />
      <MiniStat label="DIFF" value={fmtDiff(data.differential)} border valueColor={diffColor(data.differential)} />
    </div>

    {/* Breakdown row */}
    {hasBreakdown(data) ? (
      <div style={{ paddingTop: 9, borderTop: `0.5px solid ${T.ink10}` }}>
        <BreakdownRow data={data} />
      </div>
    ) : (
      <div style={{
        paddingTop: 9, borderTop: `0.5px solid ${T.ink10}`,
        fontSize: 10.5, color: T.ink40, fontStyle: 'italic',
      }}>
        Hole-by-hole not synced
      </div>
    )}

    {/* Hcp footer */}
    <div style={{
      paddingTop: 9, borderTop: `0.5px solid ${T.ink10}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: T.ink55, letterSpacing: '0.08em',
      }}>
        HCP
      </span>
      <HcpRowMini data={data} />
    </div>
  </button>
);

// ── Empty state ─────────────────────────────────────────────
const EmptyState: React.FC<{ reason: string }> = ({ reason }) => {
  let copy = '';
  if (reason === 'no_whs_friends') {
    copy = 'No friends connected yet.';
  } else if (reason === 'no_friends_played') {
    copy = 'No friends played yesterday.';
  } else {
    copy = 'No friend rounds available.';
  }
  return (
    <div style={{
      padding: '14px 16px', background: '#fff',
      border: `0.5px solid ${T.ink10}`, borderRadius: 12,
      fontSize: 12, color: T.ink55, fontFamily: FONT, textAlign: 'center',
    }}>
      {copy}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────
interface Props {
  data: FriendsYesterdayResult;
  userId: string;
}

const FriendsYesterdayCard: React.FC<Props> = ({ data, userId }) => {
  const { friends, count, absenceReason } = data;
  const [searchParams, setSearchParams] = useSearchParams();

  const handleTap = () => {
    analyticsEvents.track('morning_moment_friends_tapped', {
      user_id: userId,
      friends_count: count,
    });
    const params = new URLSearchParams(searchParams);
    params.set('subtab', 'friends');
    setSearchParams(params, { replace: false });
  };

  if (absenceReason && friends.length === 0) {
    return <EmptyState reason={absenceReason} />;
  }

  if (friends.length === 0) return null;

  const best = friends[0];
  const others = friends.slice(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: FONT }}>
      {/* Eyebrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: T.green,
          display: 'inline-block',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 800, color: T.ink55, letterSpacing: '0.16em',
        }}>
          FRIENDS YESTERDAY · {count} PLAYED
        </span>
      </div>

      {/* Hero */}
      <HeroCard data={best} onClick={handleTap} />

      {/* Mini cards strip */}
      {others.length > 0 && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: T.ink55, letterSpacing: '0.16em',
            }}>
              {others.length} MORE PLAYED
            </span>
            {others.length > 1 && (
              <span style={{
                fontSize: 10, fontWeight: 600, color: T.ink40, letterSpacing: '0.08em',
              }}>
                ← swipe →
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex', gap: 10,
              overflowX: 'auto', overflowY: 'hidden',
              marginLeft: -16, marginRight: -16,
              paddingLeft: 16, paddingRight: 16,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
            // Hide WebKit scrollbar
            ref={(el) => {
              if (el) (el.style as unknown as { msOverflowStyle: string }).msOverflowStyle = 'none';
            }}
          >
            <style>{`.fyc-scroll::-webkit-scrollbar{display:none}`}</style>
            {others.map((f, i) => (
              <MiniCard key={`${f.user_id ?? 'x'}-${i}`} data={f} onClick={handleTap} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsYesterdayCard;
