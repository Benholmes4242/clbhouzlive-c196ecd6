
import { GolfCourse, RegionKey, RegionalFilter } from './types';

export const filterCoursesByRegion = (
  courses: GolfCourse[], 
  regionalFilter: RegionalFilter,
  searchTerm: string
): GolfCourse[] => {
  if (!courses) return [];
  
  let filtered = courses;

  // Filter by Top 100 Lists first (this is the main new filter)
  if (regionalFilter.top100List && regionalFilter.top100List !== 'all') {
    filtered = filtered.filter(course => {
      switch (regionalFilter.top100List) {
        case 'worldwide':
          return course.global_rank !== null && course.global_rank <= 100;
        case 'usa':
          return course.usa_rank !== null && course.usa_rank <= 100;
        case 'britain-ireland':
          return course.regional_rank !== null && course.regional_rank <= 100 && course.country === 'Britain & Ireland';
        case 'europe':
          return course.regional_rank !== null && course.regional_rank <= 100 && course.country === 'Continental Europe';
        default:
          return true;
      }
    });
  }

  // Filter by region
  if (regionalFilter.region !== 'all') {
    filtered = filtered.filter(course => {
      switch (regionalFilter.region) {
        case 'britain-ireland':
          return course.country === 'Britain & Ireland';
        case 'usa':
          return course.country === 'USA';
        case 'europe':
          return course.country === 'Continental Europe';
        case 'worldwide':
          // Show courses with global_rank or courses from worldwide regions
          return course.global_rank !== null || course.country === 'Worldwide';
        default:
          return true;
      }
    });
  }

  // Filter by sub-country (state/country within region)
  if (regionalFilter.subCountry) {
    filtered = filtered.filter(course => 
      course.sub_country === regionalFilter.subCountry
    );
  }

  // Filter by county/region (third level)
  if (regionalFilter.county) {
    filtered = filtered.filter(course => 
      course.region === regionalFilter.county
    );
  }

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.sub_country && course.sub_country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.region && course.region.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // Sort by rank when Top 100 filter is active
  if (regionalFilter.top100List && regionalFilter.top100List !== 'all') {
    filtered = [...filtered].sort((a, b) => {
      let rankA: number | null = null;
      let rankB: number | null = null;
      
      switch (regionalFilter.top100List) {
        case 'worldwide':
          rankA = a.global_rank;
          rankB = b.global_rank;
          break;
        case 'usa':
          rankA = a.usa_rank;
          rankB = b.usa_rank;
          break;
        case 'britain-ireland':
        case 'europe':
          rankA = a.regional_rank;
          rankB = b.regional_rank;
          break;
      }
      
      // Handle null ranks (courses without ranks go to the end)
      if (rankA === null && rankB === null) return 0;
      if (rankA === null) return 1;
      if (rankB === null) return -1;
      
      // Sort ascending (rank 1 first, rank 100 last)
      return rankA - rankB;
    });
  }

  return filtered;
};
