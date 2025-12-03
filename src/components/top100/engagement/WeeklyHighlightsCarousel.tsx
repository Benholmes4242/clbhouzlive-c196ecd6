import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Squircle } from '@/components/ui/squircle';
import { TrendingUp, TrendingDown, Star, Trophy } from 'lucide-react';

interface Highlight {
  id: string;
  user_id: string;
  type: 'big_jump' | 'lost_rank' | 'new_region_top10' | 'most_active';
  value: number;
  details: {
    old_rank?: number;
    new_rank?: number;
    region?: string;
    list?: string;
    display_name?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface WeeklyHighlightsCarouselProps {
  currentUserId?: string;
}

const HIGHLIGHT_ICONS = {
  big_jump: TrendingUp,
  lost_rank: TrendingDown,
  new_region_top10: Star,
  most_active: Trophy,
};

const HIGHLIGHT_COLORS = {
  big_jump: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  lost_rank: 'bg-rose-50 border-rose-200 text-rose-700',
  new_region_top10: 'bg-amber-50 border-amber-200 text-amber-700',
  most_active: 'bg-blue-50 border-blue-200 text-blue-700',
};

export function WeeklyHighlightsCarousel({ currentUserId }: WeeklyHighlightsCarouselProps) {
  const { data: highlights = [] } = useQuery({
    queryKey: ['leaderboard-highlights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leaderboard_highlights')
        .select('*')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;

      // Fetch user profiles for highlights
      const userIds = [...new Set((data || []).map(h => h.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, display_name, profile_photo_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return (data || []).map(h => {
        const details = (h.details || {}) as Record<string, unknown>;
        return {
          id: h.id,
          user_id: h.user_id,
          type: h.type as Highlight['type'],
          value: h.value || 0,
          created_at: h.created_at,
          details: {
            ...details,
            display_name: profileMap.get(h.user_id)?.display_name || 'Golfer',
            avatar_url: profileMap.get(h.user_id)?.profile_photo_url,
          },
        };
      }) as Highlight[];
    },
    staleTime: 60_000,
  });

  if (highlights.length === 0) return null;

  const getHighlightText = (highlight: Highlight) => {
    const name = highlight.details.display_name || 'A golfer';
    switch (highlight.type) {
      case 'big_jump':
        return `${name} climbed ${highlight.value} places`;
      case 'lost_rank':
        return `${name} dropped ${highlight.value} places`;
      case 'new_region_top10':
        return `${name} entered ${highlight.details.region || 'a region'} Top 10`;
      case 'most_active':
        return `${name} rated ${highlight.value} courses this week`;
      default:
        return `${name} made a move`;
    }
  };

  const getHighlightLabel = (type: Highlight['type']) => {
    switch (type) {
      case 'big_jump':
        return 'Big mover';
      case 'lost_rank':
        return 'Slipped';
      case 'new_region_top10':
        return 'New entry';
      case 'most_active':
        return 'Most active';
      default:
        return 'Update';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[13px] font-medium text-muted-foreground uppercase tracking-[0.5px]">
          Weekly highlights
        </span>
      </div>
      
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {highlights.map((highlight, index) => {
          const Icon = HIGHLIGHT_ICONS[highlight.type];
          const isCurrentUser = highlight.user_id === currentUserId;
          
          return (
            <div
              key={highlight.id}
              className={cn(
                'flex-shrink-0 w-[200px] rounded-2xl border px-3 py-2.5 snap-start',
                'transition-all duration-300 animate-in fade-in slide-in-from-right-4',
                HIGHLIGHT_COLORS[highlight.type],
                isCurrentUser && 'ring-2 ring-amber-400/50'
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0">
                  {highlight.details.avatar_url ? (
                    <Squircle width={32} height={32}>
                      <img
                        src={highlight.details.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </Squircle>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {getHighlightLabel(highlight.type)}
                  </span>
                  <p className="text-xs font-medium leading-tight mt-0.5">
                    {getHighlightText(highlight)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
