
import { GolfCourse, ScopeKey, RegionalFilter } from './types';

export const filterCoursesByRegion = (
  courses: GolfCourse[], 
  regionalFilter: RegionalFilter,
  searchTerm: string
): GolfCourse[] => {
  if (!courses) return [];
  
  let filtered = courses;

  // If Top 100 is selected, only apply Top 100 filter and ignore scope
  if (regionalFilter.top100List) {
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
  } else {
    // Only apply scope filter if no Top 100 is selected
    if (regionalFilter.scope !== 'all') {
      filtered = filtered.filter(course => {
        switch (regionalFilter.scope) {
          case 'britain-ireland':
            return course.country === 'Britain & Ireland';
          case 'usa':
            return course.country === 'USA';
          case 'europe':
            return course.country === 'Continental Europe';
          default:
            return true;
        }
      });
    }
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
    // Debug: Show what we're actually looking for
    if (searchTerm.toLowerCase().includes('roy')) {
      console.log('Debugging Royal courses...');
      const allRoyalCourses = courses.filter(course => 
        course.name.toLowerCase().includes('roy')
      );
      console.log('ALL courses with "roy" in name from full dataset:', allRoyalCourses.map(c => c.name));
      
      const countyCourses = courses.filter(course => 
        course.name.toLowerCase().includes('county')
      );
      console.log('ALL courses with "county" in name:', countyCourses.map(c => c.name));
      
      const downCourses = courses.filter(course => 
        course.name.toLowerCase().includes('down')
      );
      console.log('ALL courses with "down" in name:', downCourses.map(c => c.name));
    }
    
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
