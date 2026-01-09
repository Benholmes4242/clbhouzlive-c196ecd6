import { useTourHubDataStatus, useTourSeason } from '../hooks/useTourHubData';

export function TourHubHeader() {
  const { data: season } = useTourSeason();
  
  return (
    <header className="pt-4 pb-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {season?.tour_name || 'PGA Tour'}
      </h1>
      <p className="text-muted-foreground text-base mt-1">
        {season?.year || new Date().getFullYear()} Season
      </p>
    </header>
  );
}
