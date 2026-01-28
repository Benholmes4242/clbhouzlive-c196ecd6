import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Globe, 
  Edit, 
  ExternalLink, 
  Star,
  Trophy,
  ImageOff,
  AlertTriangle
} from 'lucide-react';
import { GolfCourse } from './types';
import { DataQualityIndicator } from './DataQualityIndicator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CourseDetailDrawerProps {
  course: GolfCourse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (course: GolfCourse) => void;
}

export function CourseDetailDrawer({ 
  course, 
  open, 
  onOpenChange, 
  onEdit 
}: CourseDetailDrawerProps) {
  // Fetch ratings for this course
  const { data: ratings } = useQuery({
    queryKey: ['course-ratings-admin', course?.id],
    queryFn: async () => {
      if (!course?.id) return { ratings: [], average: 0, count: 0 };
      
      const { data, error } = await supabase
        .from('course_ratings')
        .select(`
          id,
          rating,
          review,
          created_at,
          user_id
        `)
        .eq('course_id', course.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const count = data?.length || 0;
      const average = count > 0 
        ? data.reduce((sum, r) => sum + r.rating, 0) / count 
        : 0;

      return { ratings: data || [], average, count };
    },
    enabled: !!course?.id && open,
  });

  if (!course) return null;

  const hasCoordinates = course.latitude && course.longitude;
  const hasImage = !!course.thumbnail_image;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader className="pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg truncate">{course.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {course.sub_country && `${course.sub_country}, `}
                {course.country}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(course)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Course Image */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
              {hasImage ? (
                <img 
                  src={course.thumbnail_image!} 
                  alt={course.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ImageOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No image</p>
                  </div>
                </div>
              )}
            </div>

            {/* Data Quality */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Data Quality:</span>
              <DataQualityIndicator course={course} showLabels />
              {!course.latitude && !course.thumbnail_image && !course.description ? null : (
                course.latitude && course.thumbnail_image && course.description && (
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Complete
                  </Badge>
                )
              )}
            </div>

            {/* Rankings */}
            {(course.global_rank || course.usa_rank || course.regional_rank) && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Rankings
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {course.global_rank && course.global_rank <= 100 && (
                      <Badge variant="default">
                        #{course.global_rank} World
                      </Badge>
                    )}
                    {course.usa_rank && course.usa_rank <= 100 && (
                      <Badge variant="destructive">
                        #{course.usa_rank} USA
                      </Badge>
                    )}
                    {course.regional_rank && course.regional_rank <= 100 && (
                      <Badge variant="secondary">
                        #{course.regional_rank} Regional
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Location */}
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Country</span>
                  <span>{course.country}</span>
                </div>
                {course.sub_country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State/Region</span>
                    <span>{course.sub_country}</span>
                  </div>
                )}
                {course.region && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Area</span>
                    <span>{course.region}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Coordinates</span>
                  {hasCoordinates ? (
                    <span className="font-mono text-xs">
                      {course.latitude?.toFixed(4)}, {course.longitude?.toFixed(4)}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      Missing
                    </span>
                  )}
                </div>
              </div>
              
              {hasCoordinates && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => window.open(
                    `https://www.google.com/maps?q=${course.latitude},${course.longitude}`,
                    '_blank'
                  )}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  View on Map
                </Button>
              )}
            </div>

            {/* Ratings Summary */}
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Ratings & Reviews
              </h4>
              
              {ratings && ratings.count > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold">
                      {ratings.average.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {ratings.count} review{ratings.count !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {ratings.ratings.slice(0, 3).map((rating) => (
                      <div 
                        key={rating.id} 
                        className="p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < rating.rating 
                                    ? 'text-amber-500 fill-amber-500' 
                                    : 'text-muted-foreground'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(rating.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {rating.review && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {rating.review}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No ratings yet</p>
              )}
            </div>

            {/* Website */}
            {course.website_url && (
              <>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(course.website_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Website
                </Button>
              </>
            )}

            {/* Metadata */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Created: {format(new Date(course.created_at), 'MMM d, yyyy')}</div>
              <div>Updated: {format(new Date(course.updated_at), 'MMM d, yyyy')}</div>
              <div className="font-mono">ID: {course.id}</div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
