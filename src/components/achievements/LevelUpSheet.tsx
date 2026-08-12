/**
 * LevelUpSheet -- full-screen dark scoreboard celebration.
 *
 * Presented at most once per event: seen_at is stamped on mount (not on
 * dismiss). CTA routes to /handicap and opens the Trophy Room sheet.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TierGlyph, TIER_COLOR_DARK } from '@/components/shared/TierGlyph';
import { levelForMedals } from '@/components/profile/handicap/whs/gam/trophy-room/_shared/levels';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/bodyScrollLock';

const FONT = "'SF Pro', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
const GOLD = '#FBBC2E';

interface Props {
  eventId: string;
  label: string;
  medals: number;
  onClose: () => void;
}

export function LevelUpSheet({ eventId, label, medals, onClose }: Props) {
  const { t } = useTranslation('achievements');
  const navigate = useNavigate();

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await supabase
          .from('gam_user_level_events')
          .update({ seen_at: new Date().toISOString() })
          .eq('id', eventId)
          .is('seen_at', null);
      } catch {
        /* best-effort */
      }
    })();
  }, [eventId]);

  const onOpenRoom = () => {
    onClose();
    navigate('/handicap');
    setTimeout(() => openGamAchievements(), 0);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483000,
        background:
          'radial-gradient(120% 90% at 50% 10%, rgba(251,188,46,0.12) 0%, rgba(0,0,0,0.85) 55%, #050608 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        fontFamily: FONT,
        color: '#fff',
      }}
    >
      {(() => {
        const lvl = levelForMedals(medals);
        const color = lvl?.key === 'the_goat' ? TIER_COLOR_DARK.goat : GOLD;
        return (
          <div style={{ marginBottom: 24 }}>
            <TierGlyph tierKey={lvl?.key ?? 'new_recruit'} color={color} size={72} strokeWidth={1.5} />
          </div>
        );
      })()}
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
          marginBottom: 10,
        }}
      >
        {t('levelUp.youReached')}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          lineHeight: 1.1,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 14,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {t('levelUp.medals', { count: medals })}
      </div>

      <button
        type="button"
        onClick={onOpenRoom}
        style={{
          marginTop: 40,
          height: 48,
          padding: '0 22px',
          borderRadius: 999,
          background: GOLD,
          color: '#0F172A',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {t('levelUp.viewTrophyRoom')}
      </button>
      <button
        type="button"
        onClick={onClose}
        style={{
          marginTop: 14,
          background: 'transparent',
          color: 'rgba(255,255,255,0.55)',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {t('levelUp.keepPlaying')}
      </button>
    </div>,
    document.body,
  );
}

export default LevelUpSheet;
