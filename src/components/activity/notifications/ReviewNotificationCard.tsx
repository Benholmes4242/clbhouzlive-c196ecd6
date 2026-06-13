import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { ActivityNotification } from '@/hooks/useActivityFeed';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  getActorDisplayName,
  getActorAvatarUrl,
} from '@/components/activity/rows/rowHelpers';
import {
  INK, INK_SOFT, INK_SUBTLE,
  BORDER, SURFACE, UNREAD_BG, UNREAD_BORDER,
  REVEAL, CARD_RADIUS,
} from './tokens';

interface Props {
  notification: ActivityNotification;
  onClick: () => void;
}

const COUNTRY_FLAG: Record<string, string> = {
  US: '🇺🇸', USA: '🇺🇸',
  GB: '🇬🇧', UK: '🇬🇧', SCT: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', WAL: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  IE: '🇮🇪', IRL: '🇮🇪',
  CA: '🇨🇦', AU: '🇦🇺', NZ: '🇳🇿', ZA: '🇿🇦',
};

function flagFor(code?: string | null): string | null {
  if (!code) return null;
  return COUNTRY_FLAG[code.toUpperCase()] ?? null;
}

export const ReviewNotificationCard: React.FC<Props> = ({ notification, onClick }) => {
  const actorName = getActorDisplayName(notification);
  const avatarUrl = getActorAvatarUrl(notification);
  const courseName: string | undefined = notification.data?.course_name;
  const courseId: string | undefined = notification.data?.course_id;
  const rating = notification.data?.rating;
  const region: string | undefined =
    notification.data?.course_region ||
    notification.data?.course_location ||
    notification.data?.region;
  const countryCode: string | undefined =
    notification.data?.course_country_code ||
    notification.data?.country_code;
  const flag = flagFor(countryCode);

  const [hero, setHero] = useState<string | null>(null);
  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    supabase
      .from('golf_courses')
      .select('thumbnail_image')
      .eq('id', courseId)
      .single()
      .then(({ data }) => {
        if (!cancelled && data?.thumbnail_image) setHero(data.thumbnail_image);
      });
    return () => { cancelled = true; };
  }, [courseId]);

  return (
    <motion.div
      {...REVEAL}
      onClick={onClick}
      className="cursor-pointer active:scale-[0.985] transition-transform overflow-hidden"
      style={{
        background: notification.is_unread ? UNREAD_BG : SURFACE,
        border: `1px solid ${notification.is_unread ? UNREAD_BORDER : BORDER}`,
        borderRadius: CARD_RADIUS,
      }}
    >
      {/* Hero */}
      <div className="relative" style={{ height: 96 }}>
        {hero ? (
          <img src={hero} alt={courseName || 'Course'} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,#1f2937,#0f172a)' }} />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.10) 55%, rgba(0,0,0,0.20) 100%)' }} />

        {rating != null && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5"
            style={{
              background: 'rgba(10,14,20,0.52)',
              backdropFilter: 'blur(14px) saturate(150%)',
              WebkitBackdropFilter: 'blur(14px) saturate(150%)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: 999,
              padding: '4px 10px',
            }}
          >
            {flag && <span style={{ fontSize: 12, lineHeight: 1 }}>{flag}</span>}
            <span
              className="text-[12px] font-bold text-white"
              style={{ fontFeatureSettings: '"tnum" 1', fontVariantNumeric: 'tabular-nums' }}
            >
              {Number(rating).toFixed(1)}
            </span>
          </div>
        )}

        <span className="absolute bottom-2.5 left-3.5 text-[11px] font-medium text-white/75 tabular-nums">
          {notification.time_ago}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 pt-3 pb-3.5 flex items-start gap-3">
        <div className="relative shrink-0" style={{ marginTop: -22 }}>
          <div style={{ border: '3px solid white', borderRadius: '34%', lineHeight: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
            <SquircleAvatar
              src={avatarUrl}
              alt={actorName || 'User'}
              size={44}
              fallback={actorName?.charAt(0) || '?'}
              hideRing
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          {courseName && (
            <h3
              className="text-[15px] font-bold leading-[1.25] truncate"
              style={{ color: INK, letterSpacing: '-0.01em' }}
            >
              {courseName}
            </h3>
          )}
          <p className="text-[13px] leading-[1.4] mt-0.5" style={{ color: INK_SOFT }}>
            <span className="font-semibold" style={{ color: INK }}>{actorName}</span>{' '}
            reviewed this course
          </p>
          {region && (
            <p className="text-[11.5px] mt-0.5 truncate" style={{ color: INK_SUBTLE }}>
              {region}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
