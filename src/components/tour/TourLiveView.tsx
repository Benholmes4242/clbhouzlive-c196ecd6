import React from 'react';
import { mockEvents, mockLeaderboards } from '@/data/tourMock';
import { Event } from '@/types/tour';

function getPrimaryLiveEvent(): Event | undefined {
  return mockEvents.find(e => e.status === 'LIVE') ?? mockEvents[0];
}

export function TourLiveView() {
  const liveEvent = getPrimaryLiveEvent();
  const liveLeaderboards = mockLeaderboards.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Live hero */}
      {liveEvent && (
        <div className="relative overflow-hidden rounded-sq-lg border border-border bg-gradient-to-br from-muted to-muted/50">
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Featured Event</p>
                <h2 className="text-lg font-semibold text-foreground">{liveEvent.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {liveEvent.courseName} • {liveEvent.courseLocation}
                </p>
              </div>
              {liveEvent.status === 'LIVE' && (
                <span className="px-2.5 py-1 rounded-sq-pill text-xs font-semibold bg-destructive text-destructive-foreground animate-pulse">
                  LIVE
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>
                {new Date(liveEvent.startDate).toLocaleDateString()} –{' '}
                {new Date(liveEvent.endDate).toLocaleDateString()}
              </span>
              {liveEvent.prizePool && (
                <span className="rounded-sq-pill bg-background/60 px-2 py-0.5">
                  Prize Pool ${(liveEvent.prizePool / 1_000_000).toFixed(1)}M
                </span>
              )}
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <button className="rounded-sq-pill bg-foreground px-3 py-1.5 font-medium text-background">
                Follow Event
              </button>
              <button className="rounded-sq-pill border border-border px-3 py-1.5 text-foreground">
                View Leaderboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live leaderboards carousel */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Live Leaderboards</h3>
        <div className="flex gap-3 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {liveLeaderboards.map(board => {
            const event = mockEvents.find(e => e.id === board.eventId);
            if (!event) return null;
            const top3 = board.entries.slice(0, 3);

            return (
              <div
                key={board.eventId}
                className="min-w-[260px] rounded-sq-lg border border-border bg-card p-3"
              >
                <p className="text-xs text-muted-foreground">{event.tour}</p>
                <p className="text-sm font-semibold text-foreground">{event.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Round {board.round} • Cut Line {board.cutLine ?? 'TBC'}
                </p>

                <div className="mt-2 space-y-1">
                  {top3.map(row => (
                    <div key={row.playerName} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {row.position}. {row.playerName}
                      </span>
                      <span className="font-semibold text-foreground">
                        {row.scoreToPar > 0 ? `+${row.scoreToPar}` : row.scoreToPar}
                      </span>
                    </div>
                  ))}
                </div>

                <button className="mt-2 w-full rounded-sq-pill border border-border py-1.5 text-xs text-foreground hover:bg-muted/50 transition-colors">
                  Open Full Leaderboard
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
