/**
 * MomentsSection — TD1 event moments horizontal rail.
 * 108x148 rounded cards with member avatar + handle overlay.
 * 'All moments >' opens a full sheet listing everything.
 * Self-hides on empty.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionEyebrow } from './SectionEyebrow';
import { useEventMoments, MOMENT_TYPE_CONFIG, type MomentType } from '../../hooks/useEventMoments';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import { LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, SLATE_50, HAIRLINE_INK_8,
} from '../../_shared/tokens';

interface Props {
  tournamentId: string;
  tourCode: string;
}

export function MomentsSection({ tournamentId, tourCode }: Props) {
  const [open, setOpen] = useState(false);
  const { data: moments = [] } = useEventMoments(tournamentId);
  if (!moments || moments.length === 0) return null;

  return (
    <>
      <SectionEyebrow
        kicker="Moments"
        actionLabel={moments.length > 4 ? 'All moments' : undefined}
        onAction={moments.length > 4 ? () => setOpen(true) : undefined}
      />
      <div
        style={{
          display: 'flex', gap: 10, overflowX: 'auto',
          padding: '0 16px 8px', scrollSnapType: 'x mandatory',
          fontFamily: FONT,
        }}
      >
        {moments.map((m) => (
          <MomentCard key={m.id} moment={m} tourCode={tourCode} />
        ))}
      </div>
      <BottomSheet open={open} onClose={() => setOpen(false)} variant="light" surfaceColor={SLATE_50}>
        <div style={{ background: SLATE_50, fontFamily: FONT, maxHeight: 'calc(90vh - 24px)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '4px 18px 12px' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: INK, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              All Moments
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: SURFACE, borderTop: `1px solid ${HAIRLINE_INK_8}`, borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
            {moments.map((m, i) => {
              const cfg = MOMENT_TYPE_CONFIG[m.moment_type as MomentType] ?? MOMENT_TYPE_CONFIG.highlight;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '11px 18px',
                    borderBottom: i === moments.length - 1 ? 'none' : `0.5px solid ${HAIRLINE_INK_8}`,
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>
                    {cfg.icon ?? '⛳'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {m.player && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>
                        {m.player.full_name}
                      </div>
                    )}
                    <div style={{ fontSize: 12, fontWeight: 600, color: INK, marginTop: 1, lineHeight: 1.4 }}>
                      {m.headline}
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 11, color: INK_MUTE, marginTop: 2, lineHeight: 1.45 }}>
                        {m.description}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>
    </>
  );
}

function MomentCard({ moment, tourCode }: { moment: ReturnType<typeof useEventMoments>['data'] extends (infer T)[] | undefined ? T : never; tourCode: string }) {
  const navigate = useNavigate();
  const cfg = MOMENT_TYPE_CONFIG[moment!.moment_type as MomentType] ?? MOMENT_TYPE_CONFIG.highlight;
  const player = (moment as any).player;
  return (
    <button
      type="button"
      onClick={() => { if (player?.id) navigate(`/tourhub/player/${player.id}`); }}
      disabled={!player?.id}
      style={{
        minWidth: 108, width: 108, height: 148, flexShrink: 0,
        scrollSnapAlign: 'start', border: `0.5px solid ${HAIRLINE_INK_8}`,
        borderRadius: 12, background: SURFACE, padding: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
        cursor: player?.id ? 'pointer' : 'default', textAlign: 'left',
        fontFamily: FONT,
      }}
    >
      <div style={{ fontSize: 20 }}>{cfg.icon}</div>
      {player && (
        <PlayerAvatar
          playerId={player.id}
          playerName={player.full_name}
          tourCode={tourCode}
          size="sm"
          ringColor={LIGHT_HAIRLINE}
        />
      )}
      <div style={{ fontSize: 10.5, fontWeight: 800, color: INK, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        {moment!.headline}
      </div>
      {player && (
        <div style={{ fontSize: 9, fontWeight: 700, color: INK_FAINT, marginTop: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.full_name}
        </div>
      )}
    </button>
  );
}
