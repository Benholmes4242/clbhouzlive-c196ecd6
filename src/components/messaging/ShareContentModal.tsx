import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Calendar, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { cn } from '@/lib/utils';
import type { MessageType, SharedCourse, SharedMoment } from '@/types/messaging';

interface ShareContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (
    content: string,
    messageType: MessageType,
    metadata: Record<string, unknown>
  ) => void;
}

interface CourseResult {
  id: string;
  name: string;
  country: string | null;
  region: string | null;
  thumbnail_image: string | null;
}

interface MomentResult {
  id: string;
  content: string | null;
  created_at: string;
  user_id: string;
  user_profile?: {
    display_name: string | null;
    profile_photo_url: string | null;
  };
  post_media?: {
    media_url: string;
    poster_url: string | null;
    media_type: string;
  }[];
}

export function ShareContentModal({ 
  open, 
  onOpenChange,
  onShare 
}: ShareContentModalProps) {
  const { user } = useSupabaseSession();
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<{
    type: MessageType;
    data: CourseResult | MomentResult;
  } | null>(null);

  // Courses state
  const [courses, setCourses] = useState<CourseResult[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  // Moments state
  const [moments, setMoments] = useState<MomentResult[]>([]);
  const [momentsLoading, setMomentsLoading] = useState(false);

  // Search courses
  useEffect(() => {
    if (activeTab !== 'courses') return;

    const searchCourses = async () => {
      setCoursesLoading(true);
      try {
        let query = supabase
          .from('golf_courses')
          .select('id, name, country, region, thumbnail_image')
          .order('name')
          .limit(20);

        if (searchQuery.trim()) {
          query = query.ilike('name', `%${searchQuery.trim()}%`);
        }

        const { data } = await query;
        setCourses(data || []);
      } catch (err) {
        console.error('Error searching courses:', err);
      } finally {
        setCoursesLoading(false);
      }
    };

    const debounce = setTimeout(searchCourses, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, activeTab]);

  // Fetch user's moments
  useEffect(() => {
    if (activeTab !== 'moments' || !user) return;

    const fetchMoments = async () => {
      setMomentsLoading(true);
      try {
        const { data } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            user_id,
            post_media (
              media_url,
              poster_url,
              media_type
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(20);

        // Get user profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, profile_photo_url')
          .eq('id', user.id)
          .single();

        const momentsWithProfile = (data || []).map(moment => ({
          ...moment,
          user_profile: profile || undefined,
        }));

        setMoments(momentsWithProfile);
      } catch (err) {
        console.error('Error fetching moments:', err);
      } finally {
        setMomentsLoading(false);
      }
    };

    fetchMoments();
  }, [activeTab, user]);

  // Handle share
  const handleShare = () => {
    if (!selectedItem) return;

    if (selectedItem.type === 'course_share') {
      const course = selectedItem.data as CourseResult;
      const metadata: SharedCourse = {
        course_id: course.id,
        course_name: course.name,
        course_image_url: course.thumbnail_image || undefined,
        location: [course.region, course.country].filter(Boolean).join(', ') || undefined,
      };
      onShare('Check out this course! ⛳', 'course_share', metadata as unknown as Record<string, unknown>);
    } else if (selectedItem.type === 'moment_share') {
      const moment = selectedItem.data as MomentResult;
      const thumbnail = moment.post_media?.[0]?.poster_url || moment.post_media?.[0]?.media_url;
      const metadata: SharedMoment = {
        moment_id: moment.id,
        thumbnail_url: thumbnail || undefined,
        creator_name: moment.user_profile?.display_name || 'Unknown',
        creator_avatar: moment.user_profile?.profile_photo_url || undefined,
        caption: moment.content || undefined,
      };
      onShare('Watch this moment! 🎬', 'moment_share', metadata as unknown as Record<string, unknown>);
    }

    setSelectedItem(null);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedItem(null);
    setSearchQuery('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Share Golf Content</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="teetimes">Tee Times</TabsTrigger>
            <TabsTrigger value="moments">Moments</TabsTrigger>
          </TabsList>

          {/* Courses Tab */}
          <TabsContent value="courses" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              {coursesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No courses found
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => setSelectedItem({ type: 'course_share', data: course })}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                        selectedItem?.type === 'course_share' && (selectedItem.data as CourseResult).id === course.id
                          ? "bg-primary/10 border border-primary"
                          : "hover:bg-muted border border-transparent"
                      )}
                    >
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {course.thumbnail_image ? (
                          <img 
                            src={course.thumbnail_image} 
                            alt={course.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xl">
                            ⛳
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{course.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {(course.region || course.country) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[course.region, course.country].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tee Times Tab */}
          <TabsContent value="teetimes" className="flex-1 flex flex-col items-center justify-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm text-center">
              Tee time sharing coming soon!
            </p>
            <p className="text-muted-foreground text-xs text-center mt-1">
              You'll be able to share your upcoming games here.
            </p>
          </TabsContent>

          {/* Moments Tab */}
          <TabsContent value="moments" className="flex-1 flex flex-col min-h-0 mt-4">
            <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
              {momentsLoading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                  ))}
                </div>
              ) : moments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No moments yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {moments.map(moment => {
                    const thumbnail = moment.post_media?.[0]?.poster_url || moment.post_media?.[0]?.media_url;
                    const isSelected = selectedItem?.type === 'moment_share' && 
                      (selectedItem.data as MomentResult).id === moment.id;
                    
                    return (
                      <button
                        key={moment.id}
                        onClick={() => setSelectedItem({ type: 'moment_share', data: moment })}
                        className={cn(
                          "aspect-square rounded-lg overflow-hidden bg-muted relative",
                          isSelected && "ring-2 ring-primary ring-offset-2"
                        )}
                      >
                        {thumbnail ? (
                          <img 
                            src={thumbnail} 
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare} 
            disabled={!selectedItem}
          >
            Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
