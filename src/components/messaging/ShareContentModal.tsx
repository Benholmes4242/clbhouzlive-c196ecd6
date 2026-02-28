import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Calendar, ImagePlus, X, Plus, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import type { MessageType, SharedCourse } from '@/types/messaging';

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
  global_rank: number | null;
  regional_rank: number | null;
  usa_rank: number | null;
  course_rating_aggregates: { avg_overall_score: number | null }[] | null;
}

type TabType = 'courses' | 'teetimes' | 'moments';

const MAX_MEDIA = 6;

export function ShareContentModal({ 
  open, 
  onOpenChange,
  onShare 
}: ShareContentModalProps) {
  const { user } = useSupabaseSession();
  
  const [activeTab, setActiveTab] = useState<TabType>('courses');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Moments state (native picker)
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Search courses with react-query
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['share-courses', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select(`
          id, name, country, region, thumbnail_image, global_rank, regional_rank, usa_rank,
          course_rating_aggregates(avg_overall_score)
        `)
        .order('name')
        .limit(20);

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      const { data } = await query;
      return (data || []) as CourseResult[];
    },
    enabled: activeTab === 'courses' && open,
  });

  // Handle course share
  const handleShareCourse = (course: CourseResult) => {
    const locationParts = [course.region, course.country].filter(Boolean);
    const avgRating = course.course_rating_aggregates?.[0]?.avg_overall_score;
    
    const metadata: SharedCourse = {
      course_id: course.id,
      course_name: course.name,
      course_image_url: course.thumbnail_image || undefined,
      location: locationParts.length > 0 ? locationParts.join(', ') : undefined,
      rating: avgRating || undefined,
      // Ranking data
      world_rank: course.global_rank || undefined,
      country_rank: course.regional_rank || course.usa_rank || undefined,
      country_code: course.country || undefined,
    };

    onShare(
      `Check out ${course.name}! ⛳`, 
      'course_share', 
      metadata as unknown as Record<string, unknown>
    );
    handleClose();
  };

  // Media selection handlers
  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalFiles = selectedMedia.length + files.length;
    
    if (totalFiles > MAX_MEDIA) {
      toast.error(`Maximum ${MAX_MEDIA} items allowed`);
      return;
    }
    
    // Filter for images and videos only
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setSelectedMedia(prev => [...prev, ...validFiles]);
    
    // Reset input
    if (mediaInputRef.current) {
      mediaInputRef.current.value = '';
    }
  }, [selectedMedia.length]);

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleShareMedia = async () => {
    if (selectedMedia.length === 0 || !user) return;
    
    setIsUploading(true);
    try {
      // Upload each file and collect URLs
      const uploadedUrls: string[] = [];
      
      for (const file of selectedMedia) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const filePath = `${user.id}/shared-moments/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('message-media')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('message-media')
          .getPublicUrl(filePath);
          
        uploadedUrls.push(publicUrl);
      }
      
      // Send as moment_share with multiple images
      onShare(
        `Shared ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} 📸`,
        'moment_share',
        {
          media_urls: uploadedUrls,
          media_count: uploadedUrls.length,
          thumbnail_url: uploadedUrls[0],
        }
      );
      
      handleClose();
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error('Failed to upload media');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedMedia([]);
    setMediaPreviews([]);
    onOpenChange(false);
  };

  const isVideo = (file: File) => file.type.startsWith('video/');

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      zIndexBase={1500}
    >
      <div className="px-4 pb-6" style={{ maxHeight: 'calc(85vh - 40px)', overflowY: 'auto' }}>
        {/* Title */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Share Golf Content</h2>
        
        {/* Tab switcher */}
        <div className="flex bg-muted rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'courses' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground"
            )}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('teetimes')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'teetimes' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground"
            )}
          >
            Tee Times
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === 'moments' 
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground"
            )}
          >
            Moments
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[50vh]">
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
                <div className="space-y-2 pr-2">
                  {courses.map(course => (
                    <button
                      key={course.id}
                      onClick={() => handleShareCourse(course)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors hover:bg-muted border border-transparent"
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
          </div>
        )}

        {/* Tee Times Tab */}
        {activeTab === 'teetimes' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm text-center">
              Tee time sharing coming soon!
            </p>
            <p className="text-muted-foreground text-xs text-center mt-1">
              You'll be able to share your upcoming games here.
            </p>
          </div>
        )}

        {/* Moments Tab - Native Media Picker */}
        {activeTab === 'moments' && (
          <div className="space-y-4">
            {/* Selected media preview grid */}
            {mediaPreviews.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {mediaPreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                    {isVideo(selectedMedia[index]) ? (
                      <video 
                        src={preview} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <img 
                        src={preview} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    )}
                    <button
                      onClick={() => removeMedia(index)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                    {isVideo(selectedMedia[index]) && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center">
                          <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Add more button */}
                {selectedMedia.length < MAX_MEDIA && (
                  <button
                    onClick={() => mediaInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">Add</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Empty state - big add button */}
            {mediaPreviews.length === 0 && (
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="w-full py-16 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImagePlus size={48} className="mb-2" />
                <span className="font-medium">Select Photos & Videos</span>
                <span className="text-xs mt-1">Up to {MAX_MEDIA} items</span>
              </button>
            )}
            
            {/* Hidden file input */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaSelect}
              className="hidden"
            />
            
            {/* Share button */}
            {selectedMedia.length > 0 && (
              <Button
                onClick={handleShareMedia}
                disabled={isUploading}
                className="w-full h-12 text-base"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>Share {selectedMedia.length} item{selectedMedia.length > 1 ? 's' : ''}</>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}