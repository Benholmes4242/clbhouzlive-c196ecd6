import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import type { FriendRecentActivity } from '@/hooks/useTop100FriendRecentActivity';

interface Props {
  items: FriendRecentActivity[];
}

export function Top100FriendCoursesStrip({ items }: Props) {
  const navigate = useNavigate();

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-2 md:mt-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Recently played by your circle
        </h3>
      </div>

      <div className="-mx-4 md:mx-0">
        <div className="flex gap-3 overflow-x-auto px-4 md:px-0 pb-2 scrollbar-hide snap-x snap-mandatory">
          {items.map((item) => (
            <button
              key={`${item.course_id}-${item.friend_id}-${item.played_at}`}
              type="button"
              onClick={() => navigate(`/courses/${item.course_id}`)}
              className="snap-start flex-shrink-0 w-40 md:w-44 rounded-2xl bg-card/90 border border-border/70 overflow-hidden text-left hover:bg-muted/60 transition-colors"
            >
              {/* Image */}
              {item.thumbnail_url && (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.thumbnail_url}
                    alt={item.course_name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="pointer-events-none absolute bottom-2 left-2 right-2">
                    <p className="text-[11px] font-medium text-white truncate">
                      {item.course_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="px-2.5 py-2.5 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  {item.friend_avatar_url && (
                    <img 
                      src={item.friend_avatar_url} 
                      alt="" 
                      className="h-4 w-4 rounded-full object-cover"
                    />
                  )}
                  <p className="text-[11px] font-medium truncate">
                    {item.friend_name}
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {formatDistanceToNow(new Date(item.played_at), {
                    addSuffix: true,
                  })}
                </p>
                {item.rating != null && (
                  <p className="text-[11px] text-muted-foreground">
                    Gave it <span className="font-semibold">{item.rating.toFixed(1)}</span>
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
