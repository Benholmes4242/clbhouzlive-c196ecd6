
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
    filtered = filtered.filter(course => {
      const nameMatch = course.name.toLowerCase().includes(searchTerm.toLowerCase());
      const countryMatch = course.country.toLowerCase().includes(searchTerm.toLowerCase());
      const subCountryMatch = course.sub_country && course.sub_country.toLowerCase().includes(searchTerm.toLowerCase());
      const regionMatch = course.region && course.region.toLowerCase().includes(searchTerm.toLowerCase());
      
      return nameMatch || countryMatch || subCountryMatch || regionMatch;
    });
  }

  // Apply sorting based on selected sort option
  if (regionalFilter.sortBy) {
    filtered = [...filtered].sort((a, b) => {
      switch (regionalFilter.sortBy) {
        case 'rank-asc': {
          // Best to worst rank (1, 2, 3... 100)
          let rankA: number | null = null;
          let rankB: number | null = null;
          
          if (regionalFilter.top100List && regionalFilter.top100List !== 'all') {
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
          } else {
            // Use the best available rank when no specific filter
            rankA = a.global_rank || a.regional_rank || a.usa_rank;
            rankB = b.global_rank || b.regional_rank || b.usa_rank;
          }
          
          if (rankA === null && rankB === null) return 0;
          if (rankA === null) return 1;
          if (rankB === null) return -1;
          return rankA - rankB;
        }
        
        case 'rank-desc': {
          // Worst to best rank (100, 99... 3, 2, 1)
          let rankA: number | null = null;
          let rankB: number | null = null;
          
          if (regionalFilter.top100List && regionalFilter.top100List !== 'all') {
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
          } else {
            rankA = a.global_rank || a.regional_rank || a.usa_rank;
            rankB = b.global_rank || b.regional_rank || b.usa_rank;
          }
          
          if (rankA === null && rankB === null) return 0;
          if (rankA === null) return -1;
          if (rankB === null) return 1;
          return rankB - rankA;
        }
        
        case 'name-asc':
          return a.name.localeCompare(b.name);
          
        case 'name-desc':
          return b.name.localeCompare(a.name);
          
        case 'recent-added':
          // Most recently added (assuming we don't have created_at, use id as proxy)
          return b.id.localeCompare(a.id);
          
        default:
          return 0;
      }
    });
  }

  return filtered;
};
