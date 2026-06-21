import React from 'react';
import { Flame } from 'lucide-react';
import {
  FONT,
  TAB,
  GOLD,
  AMBER,
} from './_shared/tokens';
import { firstName } from './_shared/helpers';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { pickAvatarSrc } from '@/lib/whs/utils/avatarSrc';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import type { RivalryDimension } from '@/lib/whs/utils/useRivalryDimension';

interface Props {
  rivalry: FriendRivalryHydrated;
  dim: RivalryDimension;
  yourAvatarUrl: string | null;
  yourFirstName: string;
  yourFullName: string | null;
  yourHandicap: number | null;
  firstRoundDate: string | null;
  currentStreak: { side: 'you' | 'them' | null; count: number };
  ownerView: boolean;
}

const DARK_BAND = 'linear-gradient(135deg, #1a3c2a, #0f172a)';

export const HeroScoreboard: React.FC<Props> = ({
  rivalry,
  dim,
  yourAvatarUrl,
  yourFullName,
  yourHandicap,
  currentStreak,
  ownerView,
}) => {
  const record =
    dim === 'stableford' ? rivalry.stableford_record : rivalry.gross_record;
  const wins = record?.wins ?? 0;
  const losses = record?.losses ?? 0;
  const ties = record?.ties ?? 0;
  const decided = wins + losses;
  const yourPct = decided > 0 ? Math.round((wins / decided) * 100) : null;
  const theirPct = decided > 0 ? Math.round((losses / decided) * 100) : null;

  const rivalFull = reformatFriendName(rivalry.rival_name) || 'Rival';
  const rivalFirst = firstName(rivalFull);
  const leftLabel = ownerView ? 'You' : firstName(yourFullName);

  const youLead = wins > losses;
  const themLead = losses > wins;

  const streakColor = AMBER;

  const rivalAvatar = pickAvatarSrc(
    rivalry.rival_thumbnail_url,
    (rivalry as any).rival_profile_photo_url,
  );

  const winsStr = String(wins);
  const lossesStr = String(losses);
  const winsSize = winsStr.length >= 3 ? 24 : 38;
  const lossesSize = lossesStr.length >= 3 ? 24 : 38;

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          border: '1px solid var(--hcp-line)',
          fontFamily: FONT,
        }}
      >
        <div style={{ background: DARK_BAND, padding: '16px 16px 14px', color: '#fff' }}>
          <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: GOLD }}>
            HEAD TO HEAD
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            {/* YOU */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ borderRadius: 14, border: `2px solid ${AMBER}`, lineHeight: 0 }}>
                <SquircleAvatar size={48} hideRing src={yourAvatarUrl} alt="" fallback={(leftLabel[0] ?? '?').toUpperCase()} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: youLead ? GOLD : 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>
                {leftLabel.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', ...TAB }}>
                {yourHandicap != null && <span>HCP {Number(yourHandicap).toFixed(1)}</span>}
                {yourHandicap != null && yourPct != null && <span style={{ margin: '0 4px' }}>·</span>}
                {yourPct != null && <span>{yourPct}%</span>}
              </div>
            </div>

            {/* SCORE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 110 }}>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, lineHeight: 1, ...TAB }}>
                <span style={{ color: GOLD, fontSize: winsSize, fontWeight: 800, letterSpacing: '-0.02em' }}>{wins}</span>
                <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 22, fontWeight: 300 }}>–</span>
                <span style={{ color: 'rgba(255,255,255,0.78)', fontSize: lossesSize, fontWeight: 800, letterSpacing: '-0.02em' }}>{losses}</span>
              </div>
              <div style={{ marginTop: 6, fontSize: 8.5, fontWeight: 800, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', ...TAB }}>
                {ties > 0 ? `${ties} ${ties === 1 ? 'TIE' : 'TIES'}` : 'HEAD TO HEAD'}
              </div>
            </div>

            {/* THEM */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ borderRadius: 14, border: '2px solid rgba(255,255,255,0.3)', lineHeight: 0 }}>
                <SquircleAvatar size={48} hideRing src={rivalAvatar} alt="" fallback={(rivalFirst[0] ?? '?').toUpperCase()} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: themLead ? GOLD : 'rgba(255,255,255,0.85)', textTransform: 'uppercase', maxWidth: 90, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {rivalFirst.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', ...TAB }}>
                {rivalry.rival_handicap != null && <span>HCP {Number(rivalry.rival_handicap).toFixed(1)}</span>}
                {rivalry.rival_handicap != null && theirPct != null && <span style={{ margin: '0 4px' }}>·</span>}
                {theirPct != null && <span>{theirPct}%</span>}
              </div>
            </div>
          </div>

          {currentStreak.side && currentStreak.count > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: streakColor, fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', ...TAB }}>
              <Flame size={13} strokeWidth={2.4} />
              {currentStreak.side === 'you' ? 'You' : rivalFirst} · {currentStreak.count} round win streak
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
