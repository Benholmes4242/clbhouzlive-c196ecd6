
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  name: string;
  country: string;
  region: string;
  description: string;
  global_rank?: number;
  regional_rank?: number;
  usa_rank?: number;
  played?: boolean;
  played_date?: string;
}

interface Top100CoursesModalProps {
  region: string;
  regionName: string;
  userId: string;
  isOwnProfile: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Top100CoursesModal: React.FC<Top100CoursesModalProps> = ({
  region,
  regionName,
  userId,
  isOwnProfile,
  isOpen,
  onClose
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('golf_courses')
        .select(`
          id,
          name,
          country,
          region,
          description,
          global_rank,
          regional_rank,
          usa_rank,
          user_top100_courses!left (
            played,
            played_date,
            user_id
          )
        `);

      // Apply filters based on region
      switch (region) {
        case 'global':
          query = query.not('global_rank', 'is', null).order('global_rank');
          break;
        case 'britain-ireland':
          query = query
            .in('country', ['United Kingdom', 'Ireland', 'Isle of Man'])
            .not('regional_rank', 'is', null)
            .order('regional_rank');
          break;
        case 'usa':
          query = query
            .eq('country', 'United States')
            .not('usa_rank', 'is', null)
            .order('usa_rank');
          break;
        case 'europe':
          query = query
            .eq('continent', 'Europe')
            .not('country', 'in', '("United Kingdom","Ireland","Isle of Man")')
            .not('global_rank', 'is', null)
            .order('global_rank');
          break;
        default:
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching courses:', error);
        return;
      }

      const coursesWithPlayedStatus = data?.map(course => ({
        id: course.id,
        name: course.name,
        country: course.country,
        region: course.region,
        description: course.description,
        global_rank: course.global_rank,
        regional_rank: course.regional_rank,
        usa_rank: course.usa_rank,
        played: course.user_top100_courses?.some(utc => utc.user_id === userId && utc.played) || false,
        played_date: course.user_top100_courses?.find(utc => utc.user_id === userId)?.played_date
      })) || [];

      setCourses(coursesWithPlayedStatus);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlayed = async (courseId: string, played: boolean, playedDate?: string) => {
    if (!isOwnProfile) return;

    try {
      if (played) {
        const { error } = await supabase
          .from('user_top100_courses')
          .upsert({
            user_id: userId,
            course_id: courseId,
            played: true,
            played_date: playedDate || new Date().toISOString().split('T')[0]
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_top100_courses')
          .delete()
          .eq('user_id', userId)
          .eq('course_id', courseId);
        
        if (error) throw error;
      }

      // Update local state
      setCourses(prev => prev.map(course => 
        course.id === courseId 
          ? { ...course, played, played_date: played ? playedDate : undefined }
          : course
      ));
    } catch (error) {
      console.error('Error updating course played status:', error);
    }
  };

  useEffect(() => {
    if (isOpen && region) {
      fetchCourses();
    }
  }, [isOpen, region, userId]);

  const getRankDisplay = (course: Course) => {
    if (region === 'britain-ireland') {
      // For GB&I, show regional rank first, then global rank if available
      const regionalRank = course.regional_rank ? `#${course.regional_rank}` : '';
      const globalRank = course.global_rank ? ` (#${course.global_rank} World)` : '';
      return regionalRank + globalRank;
    } else if (region === 'usa') {
      // For USA, show USA rank first, then global rank if available
      const usaRank = course.usa_rank ? `#${course.usa_rank}` : '';
      const globalRank = course.global_rank ? ` (#${course.global_rank} World)` : '';
      return usaRank + globalRank;
    } else if (region === 'global') {
      return course.global_rank ? `#${course.global_rank}` : '';
    } else {
      return course.global_rank ? `#${course.global_rank}` : '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{regionName}</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-lg">{getRankDisplay(course)}</span>
                      <h3 className="font-semibold text-lg">{course.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{course.region}, {course.country}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{course.description}</p>
                  </div>
                  
                  {isOwnProfile && (
                    <div className="flex items-center space-x-2 ml-4">
                      <Checkbox
                        checked={course.played}
                        onCheckedChange={(checked) => 
                          handleTogglePlayed(course.id, !!checked)
                        }
                      />
                      <span className="text-sm">Played</span>
                    </div>
                  )}
                </div>
                
                {course.played && course.played_date && (
                  <div className="text-sm text-muted-foreground">
                    Played on: {format(new Date(course.played_date), 'PPP')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default Top100CoursesModal;
