import { useTourHubDataStatus, useTourSeason } from '../hooks/useTourHubData';

export function TourHubHeader() {
  const { data: season } = useTourSeason();
  const { data: status } = useTourHubDataStatus();
  
  return (
    <header className="pt-6 pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tour Hub</h1>
        <p className="text-muted-foreground mt-0.5">
          {season?.tour_name || 'PGA Tour'} • {season?.year || new Date().getFullYear()} Season
        </p>
      </div>
      
      {status && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Tournaments: {status.tournaments}
          </span>
          <span className="text-border">•</span>
          <span>Players: {status.players}</span>
          <span className="text-border">•</span>
          <span>Stats: {status.playerStats}</span>
        </div>
      )}
    </header>
  );
}
