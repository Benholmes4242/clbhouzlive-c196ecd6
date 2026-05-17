import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Share2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { GAM, RARITY_PILL, relativeDays } from './tokens';
import { gamAchievementsBus } from './events';

interface Props { userId: string; viewerUserId?: string }

interface Catalogue {
  id: string;
  name: string;
  description: string | null;
  rarity: string | null;
  icon: string | null;
}

interface UserBadge {
  badge_id: string;
  awarded_at: string;
}

function useCatalogue(enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'badge-catalogue'],
    enabled,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Catalogue[]> => {
      const { data } = await supabase
        .from('gam_badge_catalogue')
        .select('id, title, description, rarity, icon_name')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.title,
        description: r.description,
        rarity: r.rarity,
        icon: r.icon_name,
      }));
    },
  });
}

function useMyBadges(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'my-badges', userId],
    enabled: enabled && !!userId,
    staleTime: 30_000,
    queryFn: async (): Promise<UserBadge[]> => {
      const { data } = await supabase
        .from('gam_user_badges')
        .select('badge_id, earned_at')
        .eq('user_id', userId);
      return (data ?? []).map((r: any) => ({
        badge_id: r.badge_id,
        awarded_at: r.earned_at,
      }));
    },
  });
}

const RarityPill: React.FC<{ rarity: string | null }> = ({ rarity }) => {
  const r = (rarity ?? 'common').toLowerCase();
  const meta = RARITY_PILL[r] ?? RARITY_PILL.common;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: meta.bg,
      color: meta.fg,
    }}>{meta.label}</span>
  );
};

const BadgeRow: React.FC<{ badge: Catalogue; unlocked: UserBadge | null }> = ({ badge, unlocked }) => {
  const isUnlocked = !!unlocked;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 20px', borderBottom: `0.5px solid ${GAM.INK_10}`,
      opacity: isUnlocked ? 1 : 0.55,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: isUnlocked ? GAM.AMBER_14 : GAM.INK_06,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0, filter: isUnlocked ? 'none' : 'grayscale(1)',
      }}>
        <span aria-hidden>{badge.icon ?? '🏅'}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {badge.name}
          </div>
          <RarityPill rarity={badge.rarity} />
        </div>
        <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2, lineHeight: 1.4 }}>
          {badge.description ?? ''}
        </div>
        {isUnlocked && unlocked && (
          <div style={{ fontSize: 10, color: GAM.AMBER, marginTop: 4, fontWeight: 700 }}>
            Unlocked {relativeDays(unlocked.awarded_at)}
          </div>
        )}
      </div>
    </div>
  );
};

const GamAchievementsSheet: React.FC<Props> = ({ userId, viewerUserId }) => {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => gamAchievementsBus.subscribe(() => setOpen(true)), []);

  const { data: catalogue = [], isLoading: loadingCat } = useCatalogue(open);
  const { data: mine = [], isLoading: loadingMine } = useMyBadges(userId, open);

  const mineById = useMemo(() => {
    const m = new Map<string, UserBadge>();
    mine.forEach(b => m.set(b.badge_id, b));
    return m;
  }, [mine]);

  const visible = useMemo(() => {
    return catalogue.filter(b => {
      const has = mineById.has(b.id);
      if (filter === 'unlocked') return has;
      if (filter === 'locked') return !has;
      return true;
    });
  }, [catalogue, mineById, filter]);

  const recent = useMemo(() => {
    return [...mine].sort((a, b) => +new Date(b.awarded_at) - +new Date(a.awarded_at)).slice(0, 5);
  }, [mine]);

  const isViewer = viewerUserId && viewerUserId !== userId;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[92dvh] rounded-t-2xl"
        style={{ background: '#FFFFFF', color: GAM.INK, fontFamily: GAM.FONT_GEIST }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: GAM.INK_10 }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px 10px', borderBottom: `0.5px solid ${GAM.INK_10}`,
        }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>
            {isViewer ? 'Their Achievements' : 'Achievements'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {!isViewer && (
              <button
                type="button"
                aria-label="Share"
                onClick={() => navigator.share?.({ title: 'My achievements' }).catch(() => {})}
                style={{ background: 'transparent', padding: 6 }}
              >
                <Share2 size={18} color={GAM.INK_70} />
              </button>
            )}
            <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: 'transparent', padding: 6 }}>
              <X size={20} color={GAM.INK_70} />
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: `0.5px solid ${GAM.INK_10}` }}>
          {(['all', 'unlocked', 'locked'] as const).map(f => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 12px', borderRadius: 999,
                  background: active ? GAM.INK : GAM.INK_06,
                  color: active ? '#FFFFFF' : GAM.INK_70,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
                  textTransform: 'capitalize',
                }}
              >{f}</button>
            );
          })}
          <div style={{ marginLeft: 'auto', fontSize: 11, color: GAM.INK_55, alignSelf: 'center', ...GAM.TABULAR }}>
            {mine.length} / {catalogue.length}
          </div>
        </div>

        <div style={{ overflowY: 'auto', willChange: 'transform' }}>
          {recent.length > 0 && filter === 'all' && (
            <>
              <div style={{ padding: '14px 20px 6px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: GAM.AMBER, textTransform: 'uppercase' }}>
                Recent Unlocks
              </div>
              {recent.map(b => {
                const cat = catalogue.find(c => c.id === b.badge_id);
                if (!cat) return null;
                return <BadgeRow key={`r-${b.badge_id}`} badge={cat} unlocked={b} />;
              })}
              <div style={{ padding: '14px 20px 6px', fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: GAM.INK_55, textTransform: 'uppercase' }}>
                All Badges
              </div>
            </>
          )}

          {(loadingCat || loadingMine) && (
            <div style={{ padding: 16 }}>
              {[0,1,2,3].map(i => <div key={i} style={{ height: 64, background: GAM.INK_06, borderRadius: 10, marginBottom: 8 }} />)}
            </div>
          )}

          {!loadingCat && visible.map(b => (
            <BadgeRow key={b.id} badge={b} unlocked={mineById.get(b.id) ?? null} />
          ))}
          <div style={{ height: 40 }} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default GamAchievementsSheet;
