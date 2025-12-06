import React, { useState } from 'react';
import { mockCollegeTeams, mockCollegePlayers, mockCollegeEvents } from '@/data/tourMock';

type CollegeTab = 'TEAMS' | 'PLAYERS' | 'EVENTS' | 'RANKINGS' | 'MOMENTS';

const COLLEGE_TABS: { id: CollegeTab; label: string }[] = [
  { id: 'TEAMS', label: 'Teams' },
  { id: 'PLAYERS', label: 'Players' },
  { id: 'EVENTS', label: 'Events' },
  { id: 'RANKINGS', label: 'Rankings' },
  { id: 'MOMENTS', label: 'Moments' },
];

export function CollegeGolfView() {
  const [tab, setTab] = useState<CollegeTab>('TEAMS');

  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="rounded-sq-lg border border-indigo-500/40 bg-gradient-to-r from-indigo-900/70 to-blue-900/40 p-4">
        <p className="text-xs uppercase tracking-wide text-indigo-200">College Golf</p>
        <h2 className="text-lg font-semibold text-white">The home of NCAA golf on Clbhouz</h2>
        <p className="mt-1 text-xs text-indigo-100/80">
          Teams, players, schedules and highlights from the best university golfers in the world.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 overflow-x-auto text-xs [-webkit-overflow-scrolling:touch]">
        {COLLEGE_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-sq-pill border px-3 py-1.5 whitespace-nowrap transition-colors ${
              tab === t.id 
                ? 'bg-foreground text-background border-foreground' 
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'TEAMS' && (
        <div className="space-y-3">
          {mockCollegeTeams.map(team => (
            <div
              key={team.id}
              className="flex items-center justify-between rounded-sq-lg border border-border bg-card p-3"
            >
              <div>
                <p className="text-[11px] text-muted-foreground">{team.conference}</p>
                <h3 className="text-sm font-semibold text-foreground">{team.name}</h3>
                {team.lastResult && (
                  <p className="text-[11px] text-muted-foreground">Last result: {team.lastResult}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Rank</p>
                <p className="text-xl font-bold text-foreground">{team.ranking}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'PLAYERS' && (
        <div className="space-y-3">
          {mockCollegePlayers.map(player => (
            <div
              key={player.id}
              className="rounded-sq-lg border border-border bg-card p-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{player.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{player.universityName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Rank</p>
                  <p className="text-lg font-bold text-foreground">{player.ranking}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Avg {player.scoringAverage.toFixed(1)}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-sq-pill bg-muted">
                <div
                  className="h-full rounded-sq-pill bg-indigo-400"
                  style={{ width: `${player.formRating}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Form rating {player.formRating}/100
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'EVENTS' && (
        <div className="space-y-3">
          {mockCollegeEvents.map(event => (
            <div
              key={event.id}
              className="rounded-sq-lg border border-border bg-card p-3"
            >
              <p className="text-[11px] text-muted-foreground">NCAA • {event.courseLocation}</p>
              <h3 className="text-sm font-semibold text-foreground">{event.name}</h3>
              <p className="text-[11px] text-muted-foreground">
                {new Date(event.startDate).toLocaleDateString()} –{' '}
                {new Date(event.endDate).toLocaleDateString()}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">{event.courseName}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'RANKINGS' && (
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>NCAA Team and Player rankings will live here — using the same components as Pro rankings but scoped to college data.</p>
        </div>
      )}

      {tab === 'MOMENTS' && (
        <div className="rounded-sq-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
          College Moments feed will pull in posts tagged with college teams/events, showing short
          clips and highlights.
        </div>
      )}
    </div>
  );
}
