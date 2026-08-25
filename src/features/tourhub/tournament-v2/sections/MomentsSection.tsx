/**
 * MomentsSection — TD1 event moments horizontal rail.
 * 108x148 rounded cards with member avatar + handle overlay.
 * 'All moments >' opens a full sheet listing everything.
 * Self-hides on empty.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SectionEyebrow } from './SectionEyebrow';
import { useEventMoments, MOMENT_TYPE_CONFIG, type MomentType } from '../../hooks/useEventMoments';
import { PlayerAvatar } from '../../components/PlayerAvatar';
import {
  FONT, INK, INK_MUTE, INK_FAINT, SURFACE, SLATE_50, HAIRLINE_INK_8,
} from '../../_shared/tokens';
import { A, KICKER } from '@/features/courses/components/holes/analytical/tokens';

interface Props {
  tournamentId: string;
  tourCode: string;
}

export function MomentsSection({ tournamentId, tourCode }: Props) {
  const { t } = useTranslation('tourhub');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: moments, isLoading } = useEventMoments(tournamentId);

  // Loading: skeleton — never flash the empty panel before data arrives.
  if (isLoading) {
    return (
      <>
        <SectionEyebrow kicker={t('tournament.moments.eyebrow')} />
        <div style={{ padding: '0 16px 8px', display: 'flex', gap: 12, fontFamily: FONT }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{
              minWidth: 108, width: 108, height: 148, flexShrink: 0,
              borderRadius: 12, background: HAIRLINE_INK_8,
            }} />
          ))}
        </div>
      </>
    );
  }

  const list = moments ?? [];

  // Empty: invite panel — the one section where emptiness invites.
  if (list.length === 0) {
    return (
      <>
        <SectionEyebrow kicker={t('tournament.moments.eyebrow')} />
        <div style={{ padding: '0 16px 8px', fontFamily: FONT }}>
          <div style={{
            background: SURFACE, border: `0.5px solid ${HAIRLINE_INK_8}`,
            borderRadius: 16, padding: 16,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 12.5, fontWeight: 600, color: INK_MUTE, lineHeight: 1.45,
            }}>
              {t('tournament.moments.emptyBody')}
            </div>
            <button
              type="button"
              onClick={() => navigate('/post-v2')}
              style={{
                background: INK, color: SLATE_50,
                fontSize: 12, fontWeight: 700, fontFamily: FONT,
                border: 'none', borderRadius: 14,
                padding: '10px 16px', cursor: 'pointer',
              }}
              className="active:opacity-80 transition-opacity"
            >
              {t('tournament.moments.shareCta')}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionEyebrow
        kicker={t('tournament.moments.eyebrow')}
        actionLabel={list.length > 4 ? t('tournament.moments.allAction') : undefined}
        onAction={list.length > 4 ? () => setOpen(true) : undefined}
      />
      <div
        style={{
          display: 'flex', gap: 12, overflowX: 'auto',
          padding: '0 16px 8px', scrollSnapType: 'x mandatory',
          fontFamily: FONT,
        }}
      >
        {list.map((m) => (
          <MomentCard key={m.id} moment={m} tourCode={tourCode} />
        ))}
      </div>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        variant="light"
        surfaceColor={A.PANEL}
        ariaLabelledBy="tournament-moments-sheet-title"
        style={{ height: 'auto', maxHeight: '85dvh' }}
      >
        <div style={{ background: A.PANEL, fontFamily: FONT, height: 'auto', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0 16px 12px' }}>
            <div style={KICKER}>{t('tournament.moments.eyebrow')}</div>
            <h2
              id="tournament-moments-sheet-title"
              style={{ margin: '3px 0 0', fontSize: 17, fontWeight: 700, color: A.INK, letterSpacing: '-0.01em' }}
            >
              {t('tournament.moments.sheetTitle')}
            </h2>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, minHeight: 0, background: SURFACE, borderTop: `1px solid ${HAIRLINE_INK_8}`, borderBottom: `1px solid ${HAIRLINE_INK_8}` }}>
            {list.map((m, i) => {
              const cfg = MOMENT_TYPE_CONFIG[m.moment_type as MomentType] ?? MOMENT_TYPE_CONFIG.highlight;
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '12px 16px',
                    borderBottom: i === list.length - 1 ? 'none' : `0.5px solid ${HAIRLINE_INK_8}`,
                  }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>
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
  const player = (moment as unknown as { player?: { id?: string; full_name?: string | null; photo_url?: string | null } | null }).player;
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
        />
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: INK, lineHeight: 1.25, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        {moment!.headline}
      </div>
      {player && (
        <div style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT, marginTop: 'auto', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player.full_name}
        </div>
      )}
    </button>
  );
}
