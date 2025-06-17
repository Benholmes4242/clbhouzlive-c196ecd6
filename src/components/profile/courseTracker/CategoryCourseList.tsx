
import React from "react";
import { TabsContent } from "@/components/ui/tabs";
import CourseItem from "./CourseItem";

type Course = {
  id: string;
  name: string;
  country: string;
  region: string;
  global_rank: number;
};

interface CategoryCourseListProps {
  categoryKey: string;
  courses: Course[];
  searchQuery: string;
  isCoursePlayed: (courseId: string) => boolean;
  onCourseToggle: (courseId: string, checked: boolean) => void;
}

const CategoryCourseList: React.FC<CategoryCourseListProps> = ({
  categoryKey,
  courses,
  searchQuery,
  isCoursePlayed,
  onCourseToggle
}) => {
  const courseCategories = [
    { key: 'gbi', label: 'GB & Ireland', regions: ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'] },
    { key: 'europe', label: 'Europe', regions: ['Europe'] },
    { key: 'usa', label: 'USA', regions: ['USA'] },
    { key: 'global', label: 'Global', regions: [] }
  ];

  const getCoursesForCategory = (categoryKey: string) => {
    if (categoryKey === 'global') {
      return courses;
    }
    
    const category = courseCategories.find(cat => cat.key === categoryKey);
    if (!category) return [];
    
    return courses.filter(course => {
      if (categoryKey === 'gbi') {
        return category.regions.some(region => 
          course.country.toLowerCase().includes(region.toLowerCase()) ||
          course.region?.toLowerCase().includes(region.toLowerCase())
        );
      }
      if (categoryKey === 'europe') {
        const gbiRegions = ['England', 'Scotland', 'Wales', 'Northern Ireland', 'Ireland'];
        const isGBI = gbiRegions.some(region => 
          course.country.toLowerCase().includes(region.toLowerCase()) ||
          course.region?.toLowerCase().includes(region.toLowerCase())
        );
        return !isGBI && (
          course.region?.toLowerCase().includes('europe') ||
          course.country.toLowerCase().includes('europe')
        );
      }
      if (categoryKey === 'usa') {
        return course.country.toLowerCase().includes('usa') ||
               course.country.toLowerCase().includes('united states');
      }
      return false;
    });
  };

  const getFilteredCourses = (categoryKey: string) => {
    const categoryCourses = getCoursesForCategory(categoryKey);
    
    if (!searchQuery.trim()) {
      return categoryCourses;
    }
    
    return categoryCourses.filter(course =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredCourses = getFilteredCourses(categoryKey);
  const category = courseCategories.find(cat => cat.key === categoryKey);

  return (
    <TabsContent value={categoryKey} className="mt-4">
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredCourses.map(course => (
          <CourseItem
            key={course.id}
            course={course}
            isPlayed={isCoursePlayed(course.id)}
            onToggle={onCourseToggle}
          />
        ))}
        {filteredCourses.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery.trim() ? `No courses found matching "${searchQuery}"` : `No courses found for ${category?.label}`}
          </div>
        )}
      </div>
    </TabsContent>
  );
};

export default CategoryCourseList;
