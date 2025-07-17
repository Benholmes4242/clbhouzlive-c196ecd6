
import { GolfCourse, RegionKey, RegionalFilter } from './types';

export const filterCoursesByRegion = (
  courses: GolfCourse[], 
  regionalFilter: RegionalFilter,
  searchTerm: string
): GolfCourse[] => {
  if (!courses) return [];
  
  let filtered = courses;

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

  return filtered;
};
