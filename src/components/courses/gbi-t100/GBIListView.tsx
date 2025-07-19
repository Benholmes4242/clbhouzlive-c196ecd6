import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Course {
  id: string;
  name: string;
  regional_rank: number;
  country: string;
  region?: string;
  images?: string[];
  description?: string;
  par?: number;
  yards?: number;
}

interface GBIListViewProps {
  courses: Course[];
  onCourseClick: (index: number) => void;
}

const GBIListView: React.FC<GBIListViewProps> = ({ courses, onCourseClick }) => {
  // Mock community rank calculation
  const getCommunityRank = (officialRank: number) => {
    return Math.max(1, officialRank + Math.floor(Math.random() * 10 - 5));
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        <div className="grid gap-4">
          {courses.map((course, index) => {
            const communityRank = getCommunityRank(course.regional_rank);
            const courseImage = course.images?.[0] || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop';

            return (
              <div
                key={course.id}
                className="bg-card rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onCourseClick(index)}
              >
                <div className="flex h-32">
                  {/* Course Image */}
                  <div className="w-48 flex-shrink-0">
                    <img
                      src={courseImage}
                      alt={course.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=250&fit=crop';
                      }}
                    />
                  </div>

                  {/* Course Details */}
                  <div className="flex-1 p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg leading-tight">{course.name}</h3>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">#{course.regional_rank}</div>
                            <div className="text-xs text-muted-foreground">Official</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">#{communityRank}</div>
                            <div className="text-xs text-muted-foreground">Community</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{course.region || course.country}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {course.par && <span>Par {course.par}</span>}
                        {course.yards && <span>{course.yards?.toLocaleString()} yards</span>}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-primary hover:text-primary-foreground"
                      >
                        View Course
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
};

export default GBIListView;