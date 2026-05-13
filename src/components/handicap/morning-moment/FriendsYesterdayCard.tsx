/**
 * FriendsYesterdayCard — rich two-tier section showing yesterday's
 * standout friend (hero card) and the rest of the group (horizontal
 * scroll of 250px mini cards). Tap-through navigates to Friends sub-tab.
 */
import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Sparkles, RefreshCw, Send, Bell, ChevronRight, Check } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { FriendsYesterdayResult, FriendYesterday } from '@/lib/handicap/useFriendsYesterday';
import { callCreateInvite } from '@/lib/whs/api';
import { sendWhsConnectionNudge, hasRecentlyNudged } from '@/lib/whs/nudge';
import { useFriendRoundDetail } from '@/lib/whs/hooks';
import { RoundCardBody, type HoleRow } from '@/components/profile/handicap/whs/sections/round-card';
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
// Branches into 4 states based on friend's clbhouz / EG state:
//   enriched: full stat layout
//   syncing : clbhouz + EG, enrichment pending → narrative + grey strip
//   invite  : not on clbhouz → narrative + amber Invite CTA
//   nudge   : on clbhouz, no EG connection → narrative + green Nudge CTA

type HeroState = 'enriched' | 'syncing' | 'invite' | 'nudge';

function deriveHeroState(data: FriendYesterday): HeroState {
  const enriched =
    data.stableford !== null && data.differential !== null && hasBreakdown(data);
  if (enriched) return 'enriched';
  if (!data.is_clbhouz_user) return 'invite';
  if (data.user_id && data.friend_connection_id) return 'syncing';
  return 'nudge';
}

const bannerContextLine = (data: FriendYesterday): string => {
  const parts: string[] = ['YESTERDAY'];
  parts.push(data.is_counter ? 'COUNTER' : 'NON COUNTER');
  return parts.join(' · ');
};

const HeroHeader: React.FC<{ data: FriendYesterday; onClick: () => void }> = ({ data, onClick }) => (
  <div
    onClick={onClick}
    style={{
      position: 'relative', width: '100%', aspectRatio: '16 / 4', cursor: 'pointer',
      background: data.course_thumbnail_image
        ? `url(${data.course_thumbnail_image}) center/cover`
        : `linear-gradient(135deg, #1f2937, #0f172a)`,
    }}
  >
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.10) 50%, rgba(0,0,0,0.35) 100%)',
    }} />
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
          {[data.name, data.course_name].filter(Boolean).join(' · ')}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.78)',
          marginTop: 3, letterSpacing: '0.10em', textTransform: 'uppercase',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {bannerContextLine(data)}
        </div>
      </div>
    </div>
  </div>
);

const firstNameOf = (name: string): string =>
  name.split(',').slice(-1)[0].trim().split(' ')[0] || 'friend';

const NarrativeSubtitle: React.FC<{ data: FriendYesterday }> = ({ data }) => {
  const bits: string[] = [];
  bits.push(data.is_counter ? 'Counter' : 'Non counter');
  if (data.friend_handicap_index !== null) {
    bits.push(`handicap index ${data.friend_handicap_index.toFixed(1)}`);
  }
  return (
    <div style={{ fontSize: 12, color: T.ink55, fontWeight: 600 }}>
      {bits.join(' · ')}
    </div>
  );
};

const NarrativeTop: React.FC<{ data: FriendYesterday; onClick: () => void }> = ({ data, onClick }) => (
  <div
    onClick={onClick}
    style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 4 }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 14, color: T.ink70, fontWeight: 600 }}>Shot a</span>
      <span style={{
        fontSize: 22, fontWeight: 800, color: T.ink, lineHeight: 1,
        fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums',
      }}>
        {data.score}
      </span>
      <span style={{ fontSize: 14, color: T.ink70, fontWeight: 600 }}>yesterday</span>
    </div>
    <NarrativeSubtitle data={data} />
  </div>
);

const SyncingStrip: React.FC = () => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 12px', borderRadius: 10,
    background: T.ink04, color: T.ink55,
    fontSize: 11.5, fontWeight: 600,
  }}>
    <RefreshCw size={13} strokeWidth={2.2} />
    <span style={{ flex: 1 }}>
      Hole-by-hole stats syncing — usually arrives within a few hours.
    </span>
  </div>
);

const CtaTile: React.FC<{
  tone: 'amber' | 'green';
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  showChevron: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ tone, icon, title, subtitle, showChevron, onClick, disabled }) => {
  const palette = tone === 'amber'
    ? { bg: 'rgba(247,147,30,0.10)', border: 'rgba(247,147,30,0.35)', icon: T.amber }
    : { bg: T.greenSoft, border: 'rgba(34,197,94,0.35)', icon: T.greenDeep };
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); if (!disabled) onClick?.(); }}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', padding: '12px 14px', borderRadius: 12,
        background: palette.bg, border: `0.5px solid ${palette.border}`,
        textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        fontFamily: FONT,
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fff', color: palette.icon,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: T.ink, lineHeight: 1.25 }}>
          {title}
        </div>
        <div style={{ fontSize: 11, color: T.ink55, marginTop: 2, fontWeight: 600, lineHeight: 1.3 }}>
          {subtitle}
        </div>
      </div>
      {showChevron && <ChevronRight size={16} color={T.ink40} strokeWidth={2.2} />}
    </button>
  );
};

const InviteCTA: React.FC<{ data: FriendYesterday }> = ({ data }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fname = firstNameOf(data.name);

  const handleInvite = async () => {
    if (sending || sent) return;
    if (data.friend_passport_id === null) {
      toast.error("Can't invite without an England Golf member ID");
      return;
    }
    setSending(true);
    const res = await callCreateInvite(data.friend_passport_id, 'best_of_group_card');
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Invite sent to ${fname}`);
    } else {
      toast.error(res.message || 'Could not send invite');
    }
  };

  return (
    <CtaTile
      tone={sent ? 'green' : 'amber'}
      icon={sent ? <Check size={16} strokeWidth={2.6} /> : <Send size={15} strokeWidth={2.4} />}
      title={sent ? 'Invite sent' : `Invite ${fname} to clbhouz`}
      subtitle={sent ? "We'll let you know if they join." : 'See their hole-by-hole stats, Stableford and form.'}
      showChevron={!sent}
      onClick={handleInvite}
      disabled={sending || sent}
    />
  );
};

const NudgeCTA: React.FC<{ data: FriendYesterday }> = ({ data }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const fname = firstNameOf(data.name);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!data.user_id) return;
      const recent = await hasRecentlyNudged(data.user_id);
      if (!cancelled && recent) setSent(true);
    })();
    return () => { cancelled = true; };
  }, [data.user_id]);

  const handleNudge = async () => {
    if (sending || sent) return;
    if (!data.user_id) {
      toast.error("Can't send a nudge without a clbhouz user ID");
      return;
    }
    setSending(true);
    const res = await sendWhsConnectionNudge(data.user_id);
    setSending(false);
    if (res.ok) {
      setSent(true);
      toast.success(`Nudge sent to ${fname}`);
    } else if (res.reason === 'rate_limited') {
      setSent(true);
      toast.message('Already nudged in the last 7 days');
    } else {
      toast.error('Could not send nudge');
    }
  };

  return (
    <CtaTile
      tone="green"
      icon={sent ? <Check size={16} strokeWidth={2.6} /> : <Bell size={15} strokeWidth={2.4} />}
      title={sent ? 'Nudge sent' : `Nudge ${fname} to connect EG`}
      subtitle={sent
        ? `We'll remind ${fname} again in a week if needed.`
        : `${fname} is on clbhouz — see hole-by-hole stats once connected.`}
      showChevron={!sent}
      onClick={handleNudge}
      disabled={sending || sent}
    />
  );
};

const EnrichedBody: React.FC<{ data: FriendYesterday; onTapStats: () => void }> = ({ data, onTapStats }) => {
  const { data: roundDetail } = useFriendRoundDetail(
    data.last_round_score_id,
    !!data.last_round_score_id,
  );

  const par = React.useMemo<number | null>(() => {
    if (!roundDetail?.holes || !roundDetail.hole_by_hole_fetched) return null;
    let total = 0;
    let any = false;
    for (const h of roundDetail.holes) {
      if (h.par != null) { total += h.par; any = true; }
    }
    return any ? total : null;
  }, [roundDetail]);

  const handicapDelta =
    data.handicap_index_at_time != null && data.friend_handicap_index != null
      ? data.friend_handicap_index - data.handicap_index_at_time
      : null;

  const contextLine = [
    'YESTERDAY',
    par != null ? `PAR ${par}` : null,
    data.is_counter ? 'COUNTER' : 'NON COUNTER',
  ]
    .filter(Boolean)
    .join(' · ');

  const holes: HoleRow[] | null =
    roundDetail?.holes && roundDetail.hole_by_hole_fetched
      ? roundDetail.holes.map((h) => ({
          hole_no: h.hole_no,
          par: h.par,
          actual_gross: h.actual_gross,
          adjusted_gross: h.adjusted_gross,
          played: h.played,
          hole_alias: h.hole_alias,
        }))
      : null;

  return (
    <RoundCardBody
      contextLine={contextLine}
      gross={data.score}
      differential={data.differential}
      stableford={data.stableford}
      handicapDelta={handicapDelta}
      holes={holes}
      onClick={onTapStats}
    />
  );
};

const UnenrichedBody: React.FC<{
  data: FriendYesterday;
  state: 'syncing' | 'invite' | 'nudge';
  onTapStats: () => void;
}> = ({ data, state, onTapStats }) => (
  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
    <NarrativeTop data={data} onClick={onTapStats} />
    {state === 'syncing' && <SyncingStrip />}
    {state === 'invite' && <InviteCTA data={data} />}
    {state === 'nudge' && <NudgeCTA data={data} />}
  </div>
);

const HeroCard: React.FC<{ data: FriendYesterday; onClick: () => void }> = ({ data, onClick }) => {
  const state = deriveHeroState(data);
  return (
    <div style={{
      width: '100%', background: '#fff',
      border: `0.5px solid ${T.ink10}`, borderRadius: 14, overflow: 'hidden',
      fontFamily: FONT,
    }}>
      <HeroHeader data={data} onClick={onClick} />
      {state === 'enriched'
        ? <EnrichedBody data={data} onTapStats={onClick} />
        : <UnenrichedBody data={data} state={state} onTapStats={onClick} />}
    </div>
  );
};

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
