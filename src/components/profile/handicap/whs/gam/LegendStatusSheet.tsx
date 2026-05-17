import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { GAM, LEGEND_CATEGORY_META } from './tokens';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
  isOwner: boolean;
  firstName?: string;
}

interface Entry {
  id: string;
  category: string;
  rank: number;
  value: number;
  courseId: string;
  courseName: string;
}

function useLegendEntries(userId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['gam', 'legend-entries', userId],
    enabled: enabled && !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Entry[]> => {
      const { data } = await supabase
        .from('gam_course_legends')
        .select('id, category, rank, value, course_id, golf_courses!inner(name)')
        .eq('user_id', userId)
        .eq('is_current', true)
        .lte('rank', 10)
        .order('rank', { ascending: true });
      return (data ?? []).map((r: any) => ({
        id: r.id,
        category: r.category,
        rank: r.rank,
        value: r.value,
        courseId: r.course_id,
        courseName: r.golf_courses?.name ?? 'a course',
      }));
    },
  });
}

const Row: React.FC<{ e: Entry; onTap: () => void }> = ({ e, onTap }) => {
  const meta = LEGEND_CATEGORY_META[e.category] ?? { emoji: '🏆', label: e.category };
  const rankLabel =
    e.rank === 1 ? '🏆' : e.rank === 2 ? '🥈' : e.rank === 3 ? '🥉' : `#${e.rank}`;
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderBottom: `0.5px solid ${GAM.INK_10}`,
        background: 'transparent',
        textAlign: 'left',
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{rankLabel}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {e.courseName}
        </div>
        <div style={{ fontSize: 11, color: GAM.INK_55, marginTop: 2, textTransform: 'capitalize' }}>
          {meta.emoji} {meta.label}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, ...GAM.TABULAR }}>
        {Number.isFinite(e.value) ? e.value : '—'}
      </div>
    </button>
  );
};

const Group: React.FC<{ title: string; entries: Entry[]; onTap: (id: string) => void }> = ({ title, entries, onTap }) => {
  if (entries.length === 0) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          padding: '8px 20px',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: GAM.INK_55,
          fontFamily: GAM.FONT_GEIST,
        }}
      >
        {title} ({entries.length})
      </div>
      {entries.map(e => (
        <Row key={e.id} e={e} onTap={() => onTap(e.courseId)} />
      ))}
    </div>
  );
};

const LegendStatusSheet: React.FC<Props> = ({ open, onOpenChange, userId, isOwner, firstName }) => {
  const { data, isLoading, error } = useLegendEntries(userId, open);

  const goCourse = (id: string) => {
    onOpenChange(false);
    setTimeout(() => {
      window.location.href = `/courses/${id}`;
    }, 100);
  };

  const legends = (data ?? []).filter(e => e.rank === 1);
  const top3 = (data ?? []).filter(e => e.rank === 2 || e.rank === 3);
  const top10 = (data ?? []).filter(e => e.rank >= 4 && e.rank <= 10);
  const isEmpty = !isLoading && !error && (data?.length ?? 0) === 0;
  const titleSubject = isOwner ? 'Your' : `${firstName ?? 'Their'}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideCloseButton
        className="p-0 max-h-[88dvh] rounded-t-2xl"
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
          <div style={{ fontSize: 17, fontWeight: 700, color: GAM.INK }}>
            {titleSubject} Legend Status
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            style={{ background: 'transparent', padding: 4 }}
          >
            <X size={20} color={GAM.INK_70} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 24, willChange: 'transform' }}>
          {isLoading && (
            <div style={{ padding: '12px 20px' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} style={{ height: 44, background: GAM.INK_06, borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          )}
          {error && (
            <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: GAM.INK_70 }}>
              Couldn't load Legend Status
            </div>
          )}
          {isEmpty && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <Trophy size={48} color={GAM.AMBER} style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: 17, fontWeight: 700, color: GAM.INK }}>No titles yet</div>
              <div style={{ fontSize: 13, color: GAM.INK_55, marginTop: 8, maxWidth: 280, margin: '8px auto 0', lineHeight: 1.5 }}>
                Play more rounds at the same course to climb the legend tables.
              </div>
            </div>
          )}
          {!isLoading && !error && (data?.length ?? 0) > 0 && (
            <>
              <Group title="🏆 Legend" entries={legends} onTap={goCourse} />
              <Group title="🥈 Top 3" entries={top3} onTap={goCourse} />
              <Group title="Top 10" entries={top10} onTap={goCourse} />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LegendStatusSheet;
