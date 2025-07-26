import React from 'react';

interface StatBarProps {
  handicap: number;
  postsCount: number;
  ratedCoursesCount: number;
  averageRating: number;
}

const StatBar: React.FC<StatBarProps> = ({ 
  handicap, 
  postsCount, 
  ratedCoursesCount, 
  averageRating 
}) => {
  return (
    <div className="sticky top-0 z-40 w-full px-4 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black/80 backdrop-blur-sm rounded-full px-6 py-3 flex items-center justify-between text-white/90 text-sm">
          {/* Handicap */}
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏌️</span>
            <span className="font-medium">Handicap: {handicap}</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />
          
          {/* Posts */}
          <div className="flex items-center space-x-2">
            <span className="text-lg">📝</span>
            <span className="font-medium">{postsCount} Posts</span>
          </div>
          
          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />
          
          {/* Rated Courses */}
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏆</span>
            <span className="font-medium">
              Rated {ratedCoursesCount} Courses - Avg: {averageRating}/10
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatBar;