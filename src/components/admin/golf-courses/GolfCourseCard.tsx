import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Flag, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { GolfCourse, Top100ListKey } from './types';

interface GolfCourseCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
  activeTop100Filter?: Top100ListKey | null;
}

// Helper function to format description text with line breaks
const formatDescription = (description: string) => {
  return description
    .split('\n')
    .map((line, index, array) => (
      <span key={`desc-line-${index}`}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
};

// Helper function to format location display
const formatLocation = (course: GolfCourse) => {
  const parts = [];
  
  // Always start with country
  parts.push(course.country);
  
  // Add sub_country if it exists
  if (course.sub_country) {
    parts.push(course.sub_country);
  }
  
  // Add region if it exists and is different from country
  if (course.region && course.region !== course.country) {
    parts.push(course.region);
  }
  
  return parts.join(', ');
};

// Helper function to get rank badges
const getRankBadges = (course: GolfCourse, activeFilter?: Top100ListKey | null) => {
  const badges = [];
  
  // If a specific Top 100 filter is active, show only that rank prominently
  if (activeFilter) {
    let rank = null;
    let label = '';
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    
    switch (activeFilter) {
      case 'worldwide':
        rank = course.global_rank;
        label = 'Global';
        variant = 'default';
        break;
      case 'usa':
        rank = course.usa_rank;
        label = 'USA';
        variant = 'destructive';
        break;
      case 'britain-ireland':
        rank = course.regional_rank;
        label = 'GB&I';
        variant = 'secondary';
        break;
      case 'europe':
        rank = course.regional_rank;
        label = 'Europe';
        variant = 'outline';
        break;
    }
    
    if (rank && rank <= 100) {
      badges.push(
        <Badge key={activeFilter} variant={variant} className="font-bold">
          <Trophy className="h-3 w-3 mr-1" />
          #{rank} {label}
        </Badge>
      );
    }
  } else {
    // Show all available ranks when no specific filter is active
    if (course.global_rank && course.global_rank <= 100) {
      badges.push(
        <Badge key="global" variant="default" className="text-xs">
          <Trophy className="h-3 w-3 mr-1" />
          #{course.global_rank} Global
        </Badge>
      );
    }
    
    if (course.usa_rank && course.usa_rank <= 100) {
      badges.push(
        <Badge key="usa" variant="destructive" className="text-xs">
          <Trophy className="h-3 w-3 mr-1" />
          #{course.usa_rank} USA
        </Badge>
      );
    }
    
    if (course.regional_rank && course.regional_rank <= 100) {
      const isGB = course.country === 'Britain & Ireland';
      const isEurope = course.country === 'Continental Europe';
      
      if (isGB) {
        badges.push(
          <Badge key="regional-gb" variant="secondary" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            #{course.regional_rank} GB&I
          </Badge>
        );
      } else if (isEurope) {
        badges.push(
          <Badge key="regional-europe" variant="outline" className="text-xs">
            <Trophy className="h-3 w-3 mr-1" />
            #{course.regional_rank} Europe
          </Badge>
        );
      }
    }
  }
  
  return badges;
};

const GolfCourseCard: React.FC<GolfCourseCardProps> = ({ course, onEdit, activeTop100Filter }) => {
  const handleCardClick = () => {
    onEdit(course);
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            {course.thumbnail_image ? (
              <img
                src={course.thumbnail_image}
                alt={course.name}
                className="w-48 h-36 rounded-lg object-cover border shadow-sm"
              />
            ) : (
              <div className="w-48 h-36 rounded-lg bg-muted flex items-center justify-center border">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-lg">{course.name}</h3>
              <div className="flex flex-wrap gap-1 ml-4">
                {getRankBadges(course, activeTop100Filter)}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Flag className="h-4 w-4" />
              <span>{formatLocation(course)}</span>
            </div>
            {course.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {formatDescription(course.description)}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GolfCourseCard;