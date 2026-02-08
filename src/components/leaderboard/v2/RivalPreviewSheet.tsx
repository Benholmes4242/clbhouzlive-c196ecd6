/**
 * RivalPreviewSheet - Bottom sheet showing rival player details
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight, Award, MapPin, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { getRingColorForTotalPlayed } from '@/lib/globalAchievementMilestoneSystem';
import { getTop100Club } from '@/lib/top100Club';
import { Button } from '@/components/ui/button';
import type { LeaderboardPlayerEntry } from './LeaderboardPlayerCard';

interface RivalPreviewSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: LeaderboardPlayerEntry | null;
  recentActivity?: Array<{
    course_name: string;
    date: string;
    rating?: number;
  }>;
}

export function RivalPreviewSheet({
  open,
  onOpenChange,
  player,
  recentActivity = [],
}: RivalPreviewSheetProps) {
  const navigate = useNavigate();

  if (!player) return null;

  const club = getTop100Club(player.total_top100_played);
  const ringColor = getRingColorForTotalPlayed(player.total_top100_played);

  const initials = player.display_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleViewProfile = () => {
    onOpenChange(false);
    navigate(`/profile/${player.user_id}?tab=top100`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <SquircleAvatar
              size={64}
              src={player.avatar_url}
              alt={player.display_name}
              fallback={initials}
              ringColor={ringColor}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-left text-lg">
                {player.display_name}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                #{player.rank} · {player.total_top100_played} Top 100s
              </p>
              {club.tierName && (
                <span 
                  className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${ringColor}20`,
                    color: ringColor,
                  }}
                >
                  {club.tierName}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Progress summary */}
        <div className="grid grid-cols-3 gap-3 py-4 border-t border-b border-border/40">
          <div className="text-center">
            <p className="text-xl font-bold">{player.total_top100_played}</p>
            <p className="text-xs text-muted-foreground">Top 100s</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">#{player.rank}</p>
            <p className="text-xs text-muted-foreground">Global Rank</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{player.badges?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Badges</p>
          </div>
        </div>

        {/* Badges row */}
        {player.badges && player.badges.length > 0 && (
          <div className="py-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Achievements
            </h4>
            <div className="flex flex-wrap gap-2">
              {player.badges.map((badge, i) => (
                <div 
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60"
                >
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="py-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Recent Top 100 Activity
          </h4>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((activity, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.course_name}</p>
                    <p className="text-xs text-muted-foreground">{activity.date}</p>
                  </div>
                  {activity.rating && (
                    <span className="text-sm font-medium">{activity.rating}/10</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 rounded-lg bg-muted/20">
              <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent Top 100 activity yet
              </p>
            </div>
          )}
        </div>

        {/* View Profile CTA */}
        <Button 
          onClick={handleViewProfile}
          className="w-full mt-2"
        >
          View Profile
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </SheetContent>
    </Sheet>
  );
}
