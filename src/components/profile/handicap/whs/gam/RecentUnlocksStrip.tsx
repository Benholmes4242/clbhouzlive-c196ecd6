import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Flame, Crown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GAM, RARITY_PILL, relativeDays } from './tokens';

interface Unlock {
  id: string;
  kind: 'badge' | 'legend' | 'streak';
  title: string;
  description: string;
  rarity: string;
  earnedAt: string;
  seen: boolean;
  onTapTo: { type: 'achievement' | 'streak' | 'course'; ref: string };
}

interface Props {
  userId: string;
  readOnly?: boolean;
}

function useRecentUnlocks(userId: string) {
  return useQuery({
    queryKey: ['gam', 'recent-unlocks', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Unlock[]> => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();

      const [badgesRes, legendsRes] = await Promise.all([
        supabase
          .from('gam_user_badges')
          .select('id, badge_id, earned_at, seen_by_user, gam_badge_catalogue!inner(title, description, rarity)')
          .eq('user_id', userId)
          .gte('earned_at', since)
          .order('earned_at', { ascending: false })
          .limit(8),
        supabase
          .from('gam_course_legends')
          .select('id, category, course_id, attained_at, rank, golf_courses!inner(name)')
          .eq('user_id', userId)
          .eq('rank', 1)
          .gte('attained_at', since)
          .order('attained_at', { ascending: false })
          .limit(8),
      ]);

      const unlocks: Unlock[] = [];

      (badgesRes.data ?? []).forEach((b: any) => {
        unlocks.push({
          id: `b-${b.id}`,
          kind: 'badge',
          title: b.gam_badge_catalogue?.title ?? 'Badge unlocked',
          description: b.gam_badge_catalogue?.description ?? '',
          rarity: b.gam_badge_catalogue?.rarity ?? 'common',
          earnedAt: b.earned_at,
          seen: b.seen_by_user,
          onTapTo: { type: 'achievement', ref: b.badge_id },
        });
      });

      (legendsRes.data ?? []).forEach((l: any) => {
        unlocks.push({
          id: `l-${l.id}`,
          kind: 'legend',
          title: `${l.category.replace(/_/g, ' ')} at ${l.golf_courses?.name ?? 'a course'}`,
          description: 'You took the top spot.',
          rarity: 'epic',
          earnedAt: l.attained_at,
          seen: true,
          onTapTo: { type: 'course', ref: l.course_id },
        });
      });

      return unlocks
        .sort((a, b) => +new Date(b.earnedAt) - +new Date(a.earnedAt))
        .slice(0, 6);
    },
  });
}

const Card: React.FC<{ u: Unlock; readOnly?: boolean }> = ({ u, readOnly }) => {
  const rarity = RARITY_PILL[u.rarity] ?? RARITY_PILL.common;
  const showStripe = u.rarity === 'epic' || u.rarity === 'legendary';
  const Icon = u.kind === 'streak' ? Flame : u.kind === 'legend' ? Crown : Trophy;

  const onClick = () => {
    if (u.onTapTo.type === 'course') {
      window.location.href = `/courses/${u.onTapTo.ref}`;
    } else if (u.onTapTo.type === 'achievement') {
      window.dispatchEvent(new CustomEvent('handicap:open-achievements', { detail: { badgeId: u.onTapTo.ref } }));
    } else if (u.onTapTo.type === 'streak') {
      window.dispatchEvent(new CustomEvent('handicap:open-streaks', { detail: { streak: u.onTapTo.ref } }));
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left flex-shrink-0"
      style={{
        width: 192,
        background: '#FFFFFF',
        border: `1px solid ${GAM.INK_10}`,
        borderRadius: 12,
        padding: 12,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      {showStripe && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${GAM.AMBER} 0%, ${GAM.GOLD} 100%)`,
          }}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: GAM.AMBER_14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <Icon size={16} color={GAM.AMBER} strokeWidth={2.4} />
          {!u.seen && !readOnly && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: GAM.AMBER,
                border: '1.5px solid #FFFFFF',
              }}
            />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GAM.INK_55, letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {relativeDays(u.earnedAt)}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: GAM.INK,
              marginTop: 2,
              lineHeight: 1.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              textTransform: u.kind === 'legend' ? 'capitalize' : undefined,
            }}
          >
            {u.title}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 4,
            background: rarity.bg,
            color: rarity.fg,
            letterSpacing: 0.3,
            textTransform: 'uppercase',
          }}
        >
          {rarity.label}
        </span>
        <span style={{ fontSize: 11, color: GAM.INK_55, lineHeight: 1.2, textAlign: 'right', flex: 1, marginLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {u.description}
        </span>
      </div>
    </button>
  );
};

const RecentUnlocksStrip: React.FC<Props> = ({ userId, readOnly }) => {
  const { data, isLoading, error } = useRecentUnlocks(userId);

  if (isLoading) {
    return (
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', gap: 10, overflow: 'hidden' }}>
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 192,
                height: 96,
                background: GAM.INK_06,
                borderRadius: 12,
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '12px 20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${GAM.INK_10}`,
            borderRadius: 12,
            padding: 12,
            fontSize: 13,
            color: GAM.INK_70,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          Couldn't load recent unlocks
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  return (
    <div style={{ padding: '14px 0 6px' }}>
      <div style={{ padding: '0 20px 8px', fontSize: 11, fontWeight: 700, color: GAM.INK_55, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: GAM.FONT_GEIST }}>
        Recent unlocks
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 20px',
          overflowX: 'auto',
          willChange: 'transform',
          scrollbarWidth: 'none',
        }}
        className="hide-scrollbar"
      >
        {data.map(u => (
          <Card key={u.id} u={u} readOnly={readOnly} />
        ))}
      </div>
    </div>
  );
};

export default RecentUnlocksStrip;
