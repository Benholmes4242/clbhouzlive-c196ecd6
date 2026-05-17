import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { GAM, LEGEND_CATEGORY_META } from './tokens';
import LegendStatusSheet from './LegendStatusSheet';

interface Props {
  userId: string;
  isOwner: boolean;
  firstName?: string;
}

interface Summary {
  legendCount: number;
  top3Count: number;
  top10Count: number;
  titles: Array<{ category: string; courseName: string; courseId: string }>;
}

function useLegendStatus(userId: string) {
  return useQuery({
    queryKey: ['gam', 'legend-status', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Summary> => {
      const recordRes = await supabase
        .from('gam_user_course_record_view')
        .select('legend_titles, podium_positions, top_10_positions')
        .eq('user_id', userId);

      const titlesRes = await supabase
        .from('gam_course_legends')
        .select('category, course_id, attained_at, golf_courses!inner(name)')
        .eq('user_id', userId)
        .eq('rank', 1)
        .eq('is_current', true)
        .order('attained_at', { ascending: false })
        .limit(3);

      let legendCount = 0;
      let top3Count = 0;
      let top10Count = 0;
      (recordRes.data ?? []).forEach((r: any) => {
        legendCount += r.legend_titles ?? 0;
        top3Count += r.podium_positions ?? 0;
        top10Count += r.top_10_positions ?? 0;
      });
      // podium_positions usually includes legend; subtract for clarity
      const top3Extra = Math.max(0, top3Count - legendCount);
      const top10Extra = Math.max(0, top10Count - top3Count);

      return {
        legendCount,
        top3Count: top3Extra,
        top10Count: top10Extra,
        titles: (titlesRes.data ?? []).map((t: any) => ({
          category: t.category,
          courseName: t.golf_courses?.name ?? 'a course',
          courseId: t.course_id,
        })),
      };
    },
  });
}

const LegendStatusCard: React.FC<Props> = ({ userId, isOwner, firstName }) => {
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useLegendStatus(userId);

  if (isLoading) {
    return (
      <div style={{ padding: '10px 20px' }}>
        <div style={{ height: 110, background: GAM.INK_06, borderRadius: 14 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '10px 20px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${GAM.INK_10}`,
            borderRadius: 14,
            padding: 14,
            fontSize: 13,
            color: GAM.INK_70,
            fontFamily: GAM.FONT_GEIST,
          }}
        >
          Couldn't load Legend status
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { legendCount, top3Count, top10Count, titles } = data;
  const hasAny = legendCount > 0 || top3Count > 0 || top10Count > 0;

  // Empty: no podium/legend but has titles list could still be 0 → hide if no course history
  if (!hasAny && titles.length === 0) return null;

  const ownerLabel = isOwner ? "You're" : `${firstName ?? 'They'}'re`;
  const headline =
    legendCount > 0
      ? `${ownerLabel} Legend at ${legendCount} course${legendCount === 1 ? '' : 's'}`
      : `${isOwner ? "You haven't" : `${firstName ?? 'They'} haven't`} claimed a Legend title yet`;

  const sub: string[] = [];
  if (top3Count > 0) sub.push(`Top 3 at ${top3Count} more`);
  if (top10Count > 0) sub.push(`Top 10 at ${top10Count}`);
  const caption = sub.join(' · ');

  return (
    <>
      <div style={{ padding: '6px 20px 10px' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: '#FFFFFF',
            border: `1px solid ${GAM.INK_10}`,
            borderRadius: 14,
            padding: 14,
            fontFamily: GAM.FONT_GEIST,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: GAM.AMBER_14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Trophy size={20} color={GAM.AMBER} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, color: GAM.INK_55, textTransform: 'uppercase' }}>
              Legend status
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: GAM.INK, marginTop: 2, lineHeight: 1.3 }}>
              {headline}
            </div>
            {caption && (
              <div style={{ fontSize: 12, color: GAM.INK_55, marginTop: 4 }}>{caption}</div>
            )}
            {titles.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {titles.map((t, i) => {
                  const meta = LEGEND_CATEGORY_META[t.category] ?? { emoji: '🏆', label: t.category };
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: GAM.AMBER_06,
                        color: GAM.INK,
                        border: `1px solid ${GAM.AMBER_14}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        maxWidth: 220,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{meta.emoji}</span>
                      <span style={{ textTransform: 'capitalize' }}>{meta.label} · {t.courseName}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          <ChevronRight size={18} color={GAM.INK_40} />
        </button>
      </div>
      <LegendStatusSheet
        open={open}
        onOpenChange={setOpen}
        userId={userId}
        isOwner={isOwner}
        firstName={firstName}
      />
    </>
  );
};

export default LegendStatusCard;
