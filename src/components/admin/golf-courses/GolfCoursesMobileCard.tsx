import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin, Trophy, Edit, MoreVertical, ExternalLink, Globe, Eye } from 'lucide-react';
import { GolfCourse, Top100ListKey } from './types';
import { DataQualityIndicator } from './DataQualityIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface GolfCoursesMobileCardProps {
  course: GolfCourse;
  onEdit: (course: GolfCourse) => void;
  onViewDetails?: (course: GolfCourse) => void;
  activeTop100Filter?: Top100ListKey | null;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (courseId: string) => void;
}

// Helper function to format location display
const formatLocation = (course: GolfCourse) => {
  const parts = [];
  if (course.sub_country) parts.push(course.sub_country);
  if (course.region && course.region !== course.country) parts.push(course.region);
  return parts.join(', ') || course.country;
};

// Helper function to get rank badges with limit
const getRankBadges = (course: GolfCourse, activeFilter?: Top100ListKey | null) => {
  const badges: { rank: number; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; key: string }[] = [];
  
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
      badges.push({ rank, label, variant, key: activeFilter });
    }
  } else {
    if (course.global_rank && course.global_rank <= 100) {
      badges.push({ rank: course.global_rank, label: 'Global', variant: 'default', key: 'global' });
    }
    if (course.usa_rank && course.usa_rank <= 100 && badges.length < 2) {
      badges.push({ rank: course.usa_rank, label: 'USA', variant: 'destructive', key: 'usa' });
    }
  }
  
  return badges.slice(0, 2);
};

const GolfCoursesMobileCard: React.FC<GolfCoursesMobileCardProps> = ({ 
  course, 
  onEdit,
  onViewDetails,
  activeTop100Filter,
  isSelectMode = false,
  isSelected = false,
  onToggleSelection,
}) => {
  const rankBadges = getRankBadges(course, activeTop100Filter);
  const updatedDate = new Date(course.updated_at);
  const hasCoordinates = course.latitude && course.longitude;

  const handleClick = () => {
    if (isSelectMode && onToggleSelection) {
      onToggleSelection(course.id);
    } else if (onViewDetails) {
      onViewDetails(course);
    } else {
      onEdit(course);
    }
  };

  return (
    <div 
      className={`bg-card border rounded-sq-sm p-3 cursor-pointer active:bg-muted/50 transition-colors ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onClick={handleClick}
    >
      {/* Row 1: Checkbox (if select mode) + Thumbnail + Name + Actions */}
      <div className="flex items-start gap-3">
        {isSelectMode && (
          <div className="shrink-0 pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection?.(course.id)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
        
        <div className="shrink-0">
          {course.thumbnail_image ? (
            <img
              src={course.thumbnail_image}
              alt={course.name}
              className="w-12 h-12 rounded-sq-xs object-cover border"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-sq-xs bg-muted flex items-center justify-center border">
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{course.name}</h3>
            <DataQualityIndicator course={course} />
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {formatLocation(course)}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border z-50">
            {onViewDetails && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(course); }}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(course); }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {hasCoordinates && (
              <DropdownMenuItem onClick={(e) => { 
                e.stopPropagation(); 
                window.open(`https://www.google.com/maps?q=${course.latitude},${course.longitude}`, '_blank'); 
              }}>
                <Globe className="h-4 w-4 mr-2" />
                View on Map
              </DropdownMenuItem>
            )}
            {course.website_url && (
              <DropdownMenuItem onClick={(e) => { 
                e.stopPropagation(); 
                window.open(course.website_url, '_blank'); 
              }}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Website
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Row 2: Region badges + Country */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        {rankBadges.map((badge) => (
          <Badge 
            key={badge.key} 
            variant={badge.variant} 
            className="text-xs px-1.5 py-0.5 flex items-center gap-1"
          >
            <Trophy className="h-2.5 w-2.5" />
            #{badge.rank} {badge.label}
          </Badge>
        ))}
        <span className="text-xs text-muted-foreground">
          {course.country}
        </span>
      </div>

      {/* Row 3: Updated date */}
      <p className="text-xs text-muted-foreground mt-2">
        Updated {updatedDate.toLocaleDateString('en-US', { 
          day: 'numeric',
          month: 'short', 
          year: 'numeric'
        })}
      </p>
    </div>
  );
};

export default GolfCoursesMobileCard;
