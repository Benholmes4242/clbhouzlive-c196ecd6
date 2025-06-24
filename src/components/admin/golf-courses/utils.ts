
import { GolfCourse, RegionKey } from './types';

export const filterCoursesByRegion = (
  courses: GolfCourse[], 
  selectedRegion: RegionKey, 
  searchTerm: string
): GolfCourse[] => {
  if (!courses) return [];
  
  let filtered = courses;

  // Filter by region
  if (selectedRegion !== 'all') {
    filtered = filtered.filter(course => {
      switch (selectedRegion) {
        case 'britain-ireland':
          return course.country === 'United Kingdom' || course.country === 'Ireland';
        case 'europe':
          return course.continent === 'Europe' && course.country !== 'United Kingdom' && course.country !== 'Ireland';
        case 'usa':
          return course.country === 'United States';
        case 'worldwide':
          return course.continent !== 'Europe' && course.country !== 'United States';
        default:
          return true;
      }
    });
  }

  // Filter by search term
  if (searchTerm) {
    filtered = filtered.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return filtered;
};
