import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Flame, Snowflake, Activity, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { GAM } from './tokens';
import { allStreaksBus } from './events';

interface Props {
  userId: string;
}

const STREAK_ORDER = [
  'round_played',
  'no_up',
  'cutting',
  'counter',
  'sub_80',
  'sub_par',
  'birdie_round',
];

const STREAK_META: Record<string, { label: string; unit: string; emoji: string }> = {
  round_played: { label: 'Weekly Round', unit: 'weeks', emoji: '🏌️' },
  no_up: { label: 'No-Up', unit: 'rounds', emoji: '⛔' },
  cutting: { label: 'Cutting', unit: 'rounds', emoji: '✂️' },
  counter: { label: 'Counter Round', unit: 'rounds', emoji: '⭐' },
  sub_80: { label: 'Sub-80', unit: 'rounds', emoji: '8️⃣' },
  sub_par: { label: 'Sub-Par', unit: 'rounds', emoji: '🎯' },
  birdie_round: { label: 'Birdie Round', unit: 'rounds', emoji: '🐦' },
};

interface StreakRow {
  streak_type: string;
  current_count: number;
  best_count: number;
  is_active: boolean;
  freeze_credits: number;
  freeze_refill_at: string | null;
}

function useGamStreaks(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'streaks', userId],
    enabled: enabled && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<StreakRow[]> => {
      const { data } = await supabase
        .from('gam_streaks')
        .select('streak_type, current_count, best_count, is_active, freeze_credits, freeze_refill_at')
        .eq('user_id', userId);
      return (data ?? []) as StreakRow[];
    },
  });
}

const Row: React.FC<{ row: StreakRow | null; type: string }> = ({ row, type }) => {
  const meta = STREAK_META[type] ?? { label: type, unit: 'rounds', emoji: '•' };
  const active = !!row?.is_active && (row?.current_count ?? 0) > 0;
  const count = row?.current_count ?? 0;
  const best = row?.best_count ?? 0;
  const freeze = row?.freeze_credits ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 20px',
        borderBottom: `0.5px solid ${GAM.INK_10}`,
        opacity: active ? 1 : 0.65,
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 11,
          background: active ? GAM.AMBER_14 : GAM.INK_06,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <span aria-hidden>{meta.emoji}</span>
        {freeze > 0 && (
          <span
            aria-label="Freeze available"
            title="Freeze available — keeps streak alive if you miss a week"
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#DBEAFE',
              border: '2px solid #FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Snowflake size={10} color="#1D4ED8" strokeWidth={3} />
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK }}>{meta.label}</div>
        <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2, ...GAM.TABULAR }}>
          {active ? `${count} ${meta.unit} active` : best > 0 ? `Best: ${best} · Restart today` : 'Dormant'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: GAM.INK, ...GAM.TABULAR }}>{count}</div>
        {best > count && (
          <div style={{ fontSize: 10, color: GAM.INK_55, marginTop: 2, ...GAM.TABULAR }}>PB · {best}</div>
        )}
      </div>
    </div>
  );
};

const StreaksSheet: React.FC<Props> = ({ userId }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => allStreaksBus.subscribe(() => setOpen(true)), []);

  const { data, isLoading, error } = useGamStreaks(userId, open);

  const byType = new Map<string, StreakRow>();
  (data ?? []).forEach(r => byType.set(r.streak_type, r));

  const activeCount = (data ?? []).filter(r => r.is_active && r.current_count > 0).length;
  const dormantCount = STREAK_ORDER.length - activeCount;
  const totalFreezes = (data ?? []).reduce((acc, r) => acc + (r.freeze_credits ?? 0), 0);

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px 10px',
            borderBottom: `0.5px solid ${GAM.INK_10}`,
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 700 }}>All Streaks</div>
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} style={{ background: 'transparent', padding: 4 }}>
            <X size={20} color={GAM.INK_70} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 28, willChange: 'transform' }}>
          {!isLoading && !error && (
            <div style={{ padding: '12px 20px', fontSize: 12, color: GAM.INK_55 }}>
              {activeCount} active · {dormantCount} dormant · {totalFreezes} freezes available
            </div>
          )}

          {totalFreezes > 0 && (
            <div style={{ margin: '0 20px 12px', padding: 12, borderRadius: 12, background: '#EFF6FF', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Snowflake size={18} color="#1D4ED8" />
              <div style={{ fontSize: 12, color: '#1E3A8A', lineHeight: 1.4 }}>
                <strong>{totalFreezes} Streak Freeze{totalFreezes === 1 ? '' : 's'} available</strong> · Auto-applied if you miss a week.
              </div>
            </div>
          )}

          {isLoading && (
            <div style={{ padding: '8px 20px' }}>
              {STREAK_ORDER.map((t, i) => (
                <div key={i} style={{ height: 56, background: GAM.INK_06, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          )}

          {error && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: GAM.INK_70 }}>
              Couldn't load streaks
            </div>
          )}

          {!isLoading && !error && STREAK_ORDER.map(type => (
            <Row key={type} type={type} row={byType.get(type) ?? null} />
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StreaksSheet;
