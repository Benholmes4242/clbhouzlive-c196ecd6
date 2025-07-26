import React from 'react';
import { MapPin, Star, Trophy } from 'lucide-react';

interface CourseGridProps {
  userId: string;
}

const CourseGrid: React.FC<CourseGridProps> = ({ userId }) => {
  // Mock rated courses data
  const ratedCourses = [
    {
      id: '1',
      name: 'Trump Turnberry Resort - Ailsa',
      location: 'Walton Heath Golf Club',
      country: 'Scotland',
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      rating: 9.0,
      image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop'
    },
    {
      id: '2',
      name: 'Old Head Golf Links',
      location: 'Kinsale',
      country: 'Ireland',
      flag: '🇮🇪',
      rating: 10.0,
      image: 'https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=400&h=300&fit=crop'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <h2 className="text-2xl font-bold text-foreground">Top 100 Courses</h2>
      
      {/* Clubhouse Index Badge */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Clubhouse Index</h3>
            <p className="text-sm text-muted-foreground">
              You've contributed 32 ratings to the Clubhouse Index
            </p>
          </div>
        </div>
      </div>
      
      {/* Map Pin View Placeholder */}
      <div className="bg-card rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Course Map</h3>
        <div className="h-48 bg-muted/30 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Interactive map coming soon</p>
            <p className="text-xs">View courses you've rated worldwide</p>
          </div>
        </div>
      </div>
      
      {/* Rated Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ratedCourses.map((course) => (
          <div
            key={course.id}
            className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
          >
            {/* Course Image */}
            <div className="aspect-video relative overflow-hidden">
              <img
                src={course.image}
                alt={course.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Rating Badge */}
              <div className="absolute top-3 right-3 bg-primary border-2 border-white rounded-full px-3 py-1">
                <span className="text-white font-bold text-sm">{course.rating}/10</span>
              </div>
              {/* Country Flag */}
              <div className="absolute top-3 left-3 text-2xl">
                {course.flag}
              </div>
            </div>
            
            {/* Course Info */}
            <div className="p-4">
              <h4 className="font-semibold text-foreground mb-1 line-clamp-2">
                {course.name}
              </h4>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{course.location}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Rated all Top 100 courses
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CourseGrid;