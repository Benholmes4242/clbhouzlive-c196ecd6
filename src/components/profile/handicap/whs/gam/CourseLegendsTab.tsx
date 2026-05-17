import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { supabase } from '@/integrations/supabase/client';
import { GAM, LEGEND_CATEGORY_META } from './tokens';

interface Props {
  courseId: string;
}

interface LegendRow {
  category: string;
  rank: number;
  value: number;
  user_id: string;
  attained_at: string;
  full_name: string | null;
  avatar_url: string | null;
}

const CATEGORY_ORDER = ['birdie_legend', 'score_legend', 'visitor_legend', 'gross_record', 'stableford_champ'];

function useCourseLegends(courseId: string) {
  return useQuery({
    queryKey: ['gam', 'course-legends', courseId],
    enabled: !!courseId,
    staleTime: 60_000,
    queryFn: async (): Promise<LegendRow[]> => {
      const { data } = await supabase
        .from('gam_course_legends')
        .select('category, rank, value, user_id, attained_at')
        .eq('course_id', courseId)
        .eq('is_current', true)
        .lte('rank', 10)
        .order('category', { ascending: true })
        .order('rank', { ascending: true });
      if (!data || data.length === 0) return [];

      const userIds = Array.from(new Set(data.map((r: any) => r.user_id)));
      const { data: profiles } = await (supabase as any)
        .from('user_profiles')
        .select('user_id, full_name, profile_photo_url')
        .in('user_id', userIds);
      const byId = new Map<string, any>();
      (profiles ?? []).forEach((p: any) => byId.set(p.user_id, p));

      return data.map((r: any) => ({
        category: r.category,
        rank: r.rank,
        value: r.value,
        user_id: r.user_id,
        attained_at: r.attained_at,
        full_name: byId.get(r.user_id)?.full_name ?? null,
        avatar_url: byId.get(r.user_id)?.profile_photo_url ?? null,
      }));
    },
  });
}

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
  if (rank === 1) return <span aria-label="1st">🥇</span>;
  if (rank === 2) return <span aria-label="2nd">🥈</span>;
  if (rank === 3) return <span aria-label="3rd">🥉</span>;
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: GAM.INK_55, ...GAM.TABULAR, width: 22, display: 'inline-block', textAlign: 'center' }}>
      #{rank}
    </span>
  );
};

const Row: React.FC<{ row: LegendRow; isMe: boolean }> = ({ row, isMe }) => {
  const days = Math.floor((Date.now() - +new Date(row.attained_at)) / 86400000);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: isMe ? GAM.AMBER_06 : 'transparent',
        borderBottom: `0.5px solid ${GAM.INK_10}`,
        fontFamily: GAM.FONT_GEIST,
      }}
    >
      <div style={{ width: 24, textAlign: 'center', fontSize: 14 }}>
        <RankBadge rank={row.rank} />
      </div>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 11,
          background: row.avatar_url ? `url(${row.avatar_url}) center/cover` : GAM.INK_06,
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: isMe ? 700 : 600, color: GAM.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.full_name ?? 'Player'}
        </div>
        <div style={{ fontSize: 10, color: GAM.INK_55, marginTop: 1 }}>
          {days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, ...GAM.TABULAR }}>
        {Number.isFinite(row.value) ? row.value : '—'}
      </div>
    </div>
  );
};

const CategoryCard: React.FC<{ category: string; rows: LegendRow[]; userId?: string }> = ({ category, rows, userId }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = LEGEND_CATEGORY_META[category] ?? { emoji: '🏆', label: category };
  const visible = expanded ? rows : rows.slice(0, 5);

  return (
    <div style={{ borderTop: `0.5px solid ${GAM.INK_10}`, marginTop: 14 }}>
      <div
        style={{
          padding: '14px 16px 6px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: GAM.FONT_GEIST,
        }}
      >
        <span style={{ fontSize: 18 }} aria-hidden>{meta.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: GAM.INK, letterSpacing: 0.4, textTransform: 'uppercase' }}>
          {meta.label}
        </span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '8px 16px 16px', fontSize: 12, color: GAM.INK_55 }}>
          No qualifying rounds in the last 90 days
        </div>
      ) : (
        <>
          {visible.map(r => <Row key={`${r.user_id}-${r.rank}`} row={r} isMe={r.user_id === userId} />)}
          {rows.length > 5 && (
            <button
              type="button"
              onClick={() => setExpanded(e => !e)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'transparent',
                fontSize: 12,
                fontWeight: 700,
                color: GAM.AMBER,
                textAlign: 'center',
                fontFamily: GAM.FONT_GEIST,
                borderBottom: `0.5px solid ${GAM.INK_10}`,
              }}
            >
              {expanded ? 'Show less ←' : `See top ${Math.min(10, rows.length)} →`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

const CourseLegendsTab: React.FC<Props> = ({ courseId }) => {
  const { data, isLoading, error } = useCourseLegends(courseId);
  const { user } = useSupabaseSession();
  const userId = user?.id;

  if (isLoading) {
    return (
      <div style={{ padding: '20px 16px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ height: 160, background: GAM.INK_06, borderRadius: 12, marginBottom: 12 }} />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: GAM.INK_70, fontFamily: GAM.FONT_GEIST }}>
        Couldn't load Legends
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center', fontFamily: GAM.FONT_GEIST }}>
        <div style={{ fontSize: 48 }} aria-hidden>🏆</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: GAM.INK, marginTop: 12 }}>
          Be the first to set a Legend record here
        </div>
        <div style={{ fontSize: 13, color: GAM.INK_55, marginTop: 8, maxWidth: 300, margin: '8px auto 0', lineHeight: 1.5 }}>
          Post a counter round at this course to claim a title.
        </div>
      </div>
    );
  }

  const byCategory = new Map<string, LegendRow[]>();
  data.forEach(r => {
    const arr = byCategory.get(r.category) ?? [];
    arr.push(r);
    byCategory.set(r.category, arr);
  });

  // Where You Stand
  const mine = userId ? data.filter(r => r.user_id === userId) : [];
  const myLegends = mine.filter(r => r.rank === 1).length;
  const myPodium = mine.filter(r => r.rank <= 3).length - myLegends;

  return (
    <div style={{ paddingBottom: 32 }}>
      {CATEGORY_ORDER.map(cat => (
        <CategoryCard key={cat} category={cat} rows={byCategory.get(cat) ?? []} userId={userId} />
      ))}

      {mine.length > 0 && (
        <div
          style={{
            margin: '24px 16px 0',
            padding: 16,
            borderRadius: 12,
            background: GAM.AMBER_06,
            border: `1px solid ${GAM.AMBER_14}`,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.6, color: GAM.AMBER, textTransform: 'uppercase' }}>
            Where you stand
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: GAM.INK, marginTop: 6 }}>
            {myLegends > 0
              ? `You hold ${myLegends} title${myLegends === 1 ? '' : 's'}${myPodium > 0 ? ` · Top 3 in ${myPodium} more` : ''}`
              : `Top ${mine[0]?.rank ?? 10} in ${mine.length} categor${mine.length === 1 ? 'y' : 'ies'}`}
          </div>
          <div style={{ fontSize: 12, color: GAM.INK_70, marginTop: 6, lineHeight: 1.5 }}>
            {mine.slice(0, 5).map(m => {
              const meta = LEGEND_CATEGORY_META[m.category] ?? { label: m.category };
              return `${meta.label} (#${m.rank})`;
            }).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseLegendsTab;
