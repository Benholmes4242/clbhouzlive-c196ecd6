import { useHeroCarouselData } from '../../hooks/useHeroCarouselData';
import { useTourSelection } from '../../context/TourSelectionContext';
import { selectOverviewEventsAbove } from './overviewEventSelection';

/** AlsoThisWeek and ComingUpSlot consume the same slide read and selector. */
export function useOverviewEventsAbove() {
  const { data: slides = [] } = useHeroCarouselData();
  const { viewingTournamentId } = useTourSelection();
  return selectOverviewEventsAbove(slides, viewingTournamentId);
}