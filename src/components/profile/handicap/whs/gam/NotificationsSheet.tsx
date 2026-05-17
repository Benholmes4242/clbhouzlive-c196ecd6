import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Bell, Award, Flame, Trophy } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { GAM, relativeDays } from './tokens';
import { notificationsBus, openGamAchievements } from './events';

interface Props { userId: string }

interface Item {
  id: string;
  kind: 'badge' | 'legend';
  title: string;
  sub: string;
  iso: string;
  icon: 'badge' | 'legend' | 'streak';
  badgeId?: string;
}

function useFeed(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'notif-feed', userId],
    enabled: enabled && !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<Item[]> => {
      const since = new Date(Date.now() - 30 * 86400000).toISOString();
      const [badges, legends] = await Promise.all([
        supabase
          .from('gam_user_badges')
          .select('id, badge_id, earned_at')
          .eq('user_id', userId)
          .gte('earned_at', since)
          .order('earned_at', { ascending: false })
          .limit(50),
        supabase
          .from('gam_course_legends')
          .select('id, category, rank, attained_at, course_id')
          .eq('user_id', userId)
          .gte('attained_at', since)
          .order('attained_at', { ascending: false })
          .limit(50),
      ]);

      const items: Item[] = [];
      (badges.data ?? []).forEach((b: any) => items.push({
        id: `b-${b.id}`,
        kind: 'badge',
        title: 'Badge unlocked',
        sub: b.badge_id ?? 'New achievement',
        iso: b.earned_at,
        icon: 'badge',
        badgeId: b.badge_id,
      }));
      (legends.data ?? []).forEach((l: any) => items.push({
        id: `l-${l.id}`,
        kind: 'legend',
        title: l.rank === 1 ? 'Legend earned' : `Top ${l.rank} on course`,
        sub: String(l.category ?? '').replace(/_/g, ' '),
        iso: l.attained_at,
        icon: 'legend',
      }));

      items.sort((a, b) => +new Date(b.iso) - +new Date(a.iso));
      return items;
    },
  });
}

const IconBubble: React.FC<{ kind: Item['icon'] }> = ({ kind }) => {
  const Icon = kind === 'badge' ? Award : kind === 'legend' ? Trophy : Flame;
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 11,
      background: GAM.AMBER_14, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} color={GAM.AMBER} strokeWidth={2.2} />
    </div>
  );
};

const NotificationsSheet: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => notificationsBus.subscribe(() => setOpen(true)), []);
  const { data, isLoading } = useFeed(userId, open);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[90dvh] rounded-t-2xl"
        style={{ background: '#FFFFFF', color: GAM.INK, fontFamily: GAM.FONT_GEIST }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GAM.INK_10 }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px', borderBottom: `0.5px solid ${GAM.INK_10}`,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>Updates</div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close" style={{ background: 'transparent', padding: 4 }}>
            <X size={20} color={GAM.INK_70} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', willChange: 'transform' }}>
          {isLoading && (
            <div style={{ padding: 16 }}>
              {[0,1,2].map(i => <div key={i} style={{ height: 56, background: GAM.INK_06, borderRadius: 10, marginBottom: 8 }} />)}
            </div>
          )}
          {!isLoading && (!data || data.length === 0) && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Bell size={28} color={GAM.INK_40} />
              <div style={{ fontSize: 14, fontWeight: 600, color: GAM.INK, marginTop: 12 }}>You're all caught up</div>
              <div style={{ fontSize: 12, color: GAM.INK_55, marginTop: 6 }}>
                Badges, legends, and streak alerts will show up here.
              </div>
            </div>
          )}
          {!isLoading && data?.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.kind === 'badge') {
                  setOpen(false);
                  setTimeout(() => openGamAchievements(item.badgeId), 220);
                }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                padding: '12px 20px', background: 'transparent', textAlign: 'left',
                borderBottom: `0.5px solid ${GAM.INK_10}`, cursor: 'pointer',
              }}
            >
              <IconBubble kind={item.icon} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: GAM.INK }}>{item.title}</div>
                <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2, textTransform: 'capitalize' }}>{item.sub}</div>
              </div>
              <div style={{ fontSize: 10, color: GAM.INK_40, ...GAM.TABULAR, flexShrink: 0 }}>{relativeDays(item.iso)}</div>
            </button>
          ))}
          <div style={{ height: 32 }} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSheet;
