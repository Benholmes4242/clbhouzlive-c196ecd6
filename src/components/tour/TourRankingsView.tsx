import React, { useState } from 'react';
import { mockRankings, mockCollegeTeams, mockCollegePlayers } from '@/data/tourMock';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

type RankingsScope = 'PRO' | 'COLLEGE';
type ProRankingType = 'OWGR' | 'FEDEX' | 'RACE_TO_DUBAI' | 'LIV';
type CollegeType = 'TEAM' | 'PLAYER';

export function TourRankingsView() {
  const [scope, setScope] = useState<RankingsScope>('PRO');
  const [proType, setProType] = useState<ProRankingType>('OWGR');
  const [collegeType, setCollegeType] = useState<CollegeType>('TEAM');

  return (
    <div className="space-y-4">
      {/* Scope toggle */}
      <div className="flex gap-1 rounded-sq-md border border-border bg-muted/30 p-1 text-xs">
        {[
          { id: 'PRO', label: 'Pro' },
          { id: 'COLLEGE', label: 'College' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setScope(opt.id as RankingsScope)}
            className={`flex-1 rounded-sq-sm py-1.5 transition-colors ${
              scope === opt.id 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {scope === 'PRO' ? (
        <ProRankingsSection type={proType} setType={setProType} />
      ) : (
        <CollegeRankingsSection type={collegeType} setType={setCollegeType} />
      )}
    </div>
  );
}

function ProRankingsSection({ 
  type, 
  setType 
}: { 
  type: ProRankingType; 
  setType: (t: ProRankingType) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Ranking type selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs [-webkit-overflow-scrolling:touch]">
        {[
          { id: 'OWGR', label: 'OWGR' },
          { id: 'FEDEX', label: 'FedEx Cup' },
          { id: 'RACE_TO_DUBAI', label: 'Race to Dubai' },
          { id: 'LIV', label: 'LIV Golf' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setType(opt.id as ProRankingType)}
            className={`rounded-sq-pill border px-3 py-1.5 whitespace-nowrap transition-colors ${
              type === opt.id 
                ? 'bg-foreground text-background border-foreground' 
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Rankings list */}
      <div className="rounded-sq-lg border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[40px_1fr_80px_60px] gap-2 px-3 py-2 text-[11px] text-muted-foreground border-b border-border bg-muted/30">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Points</span>
          <span className="text-right">Move</span>
        </div>
        {mockRankings.slice(0, 10).map(player => (
          <div 
            key={player.id} 
            className="grid grid-cols-[40px_1fr_80px_60px] gap-2 px-3 py-2.5 text-sm border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
          >
            <span className="font-semibold text-foreground">{player.rank}</span>
            <div>
              <span className="font-medium text-foreground">{player.playerName}</span>
              <span className="ml-2 text-xs text-muted-foreground">{player.countryCode}</span>
            </div>
            <span className="text-right text-muted-foreground">{player.points.toFixed(2)}</span>
            <div className="flex items-center justify-end gap-1">
              {player.movement > 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-xs text-emerald-500">+{player.movement}</span>
                </>
              ) : player.movement < 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive">{player.movement}</span>
                </>
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollegeRankingsSection({ 
  type, 
  setType 
}: { 
  type: CollegeType; 
  setType: (t: CollegeType) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Team/Player toggle */}
      <div className="flex gap-2 text-xs">
        {[
          { id: 'TEAM', label: 'Teams' },
          { id: 'PLAYER', label: 'Players' },
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setType(opt.id as CollegeType)}
            className={`rounded-sq-pill border px-3 py-1.5 transition-colors ${
              type === opt.id 
                ? 'bg-foreground text-background border-foreground' 
                : 'border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {type === 'TEAM' ? (
        <div className="rounded-sq-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_100px] gap-2 px-3 py-2 text-[11px] text-muted-foreground border-b border-border bg-muted/30">
            <span>Rank</span>
            <span>Team</span>
            <span className="text-right">Conference</span>
          </div>
          {mockCollegeTeams.map(team => (
            <div 
              key={team.id} 
              className="grid grid-cols-[40px_1fr_100px] gap-2 px-3 py-2.5 text-sm border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <span className="font-semibold text-foreground">{team.ranking}</span>
              <div>
                <span className="font-medium text-foreground">{team.shortName}</span>
                {team.lastResult && (
                  <p className="text-[11px] text-muted-foreground">{team.lastResult}</p>
                )}
              </div>
              <span className="text-right text-muted-foreground">{team.conference}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-sq-lg border border-border bg-card overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_60px_60px] gap-2 px-3 py-2 text-[11px] text-muted-foreground border-b border-border bg-muted/30">
            <span>Rank</span>
            <span>Player</span>
            <span className="text-right">Avg</span>
            <span className="text-right">Form</span>
          </div>
          {mockCollegePlayers.map(player => (
            <div 
              key={player.id} 
              className="grid grid-cols-[40px_1fr_60px_60px] gap-2 px-3 py-2.5 text-sm border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
            >
              <span className="font-semibold text-foreground">{player.ranking}</span>
              <div>
                <span className="font-medium text-foreground">{player.name}</span>
                <p className="text-[11px] text-muted-foreground">{player.universityName} • {player.year}</p>
              </div>
              <span className="text-right text-muted-foreground">{player.scoringAverage.toFixed(1)}</span>
              <span className="text-right text-foreground">{player.formRating}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
