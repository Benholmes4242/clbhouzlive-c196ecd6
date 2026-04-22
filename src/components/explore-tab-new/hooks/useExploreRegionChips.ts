import { useExploreRegionsWithImages, type ExploreRegionFull } from './useExploreRegionsWithImages';

interface RegionChip {
  slug: string | null;
  title: string;
}

/**
 * Returns the region chip projection (slug + title) used by the Explore header.
 * Reads from the same React Query cache as `useExploreRegionsWithImages` so
 * we issue a single network request for both surfaces.
 */
export function useExploreRegionChips() {
  const query = useExploreRegionsWithImages();

  const regions: RegionChip[] = [
    { slug: null, title: 'All' },
    ...((query.data ?? []) as ExploreRegionFull[]).map(r => ({ slug: r.slug, title: r.title })),
  ];

  return {
    regions,
    isLoading: query.isLoading,
  };
}
