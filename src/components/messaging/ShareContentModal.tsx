import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Calendar, ImagePlus, X, Plus, Loader2, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
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
    
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    
    setSelectedMedia(prev => [...prev, ...validFiles]);
    
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
      className="!bg-[#F8FAFC] !rounded-t-[22px]"
    >
      <div className="px-4" style={{ maxHeight: 'calc(85vh - 40px)', overflowY: 'auto', paddingBottom: '24px' }}>
        {/* Title */}
        <h2 className="text-[18px] font-bold mb-4" style={{ color: '#0f172a', letterSpacing: '-0.2px' }}>Share Golf Content</h2>
        
        {/* Tab switcher */}
        <div
          className="flex p-[3px] mb-4"
          style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 12 }}
        >
          <button
            onClick={() => setActiveTab('courses')}
            className={cn(
              "flex-1 py-2 rounded-[10px] text-sm transition-all",
              activeTab === 'courses' 
                ? "bg-white text-[#0f172a] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.10)]" 
                : "text-[#64748b] font-medium"
            )}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('teetimes')}
            className={cn(
              "flex-1 py-2 rounded-[10px] text-sm transition-all",
              activeTab === 'teetimes' 
                ? "bg-white text-[#0f172a] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.10)]" 
                : "text-[#64748b] font-medium"
            )}
          >
            Tee Times
          </button>
          <button
            onClick={() => setActiveTab('moments')}
            className={cn(
              "flex-1 py-2 rounded-[10px] text-sm transition-all",
              activeTab === 'moments' 
                ? "bg-white text-[#0f172a] font-bold shadow-[0_1px_4px_rgba(0,0,0,0.10)]" 
                : "text-[#64748b] font-medium"
            )}
          >
            Moments
          </button>
        </div>

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-3">
            {/* White card search bar */}
            <div
              className="flex items-center gap-2 px-3 h-[44px]"
              style={{
                background: '#ffffff',
                borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.07)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Search size={17} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <input
                placeholder="Search courses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-[#0f172a] placeholder:text-[#94a3b8]"
              />
            </div>

            {/* Eyebrow label */}
            <p
              className="text-[11px] font-bold uppercase px-1 pt-1"
              style={{ color: '#64748b', letterSpacing: '0.1em' }}
            >
              Recently Played
            </p>

            {/* Course list — no ScrollArea wrapper */}
            {coursesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-8" style={{ color: '#64748b' }}>
                No courses found
              </div>
            ) : (
              <div>
                {courses.map((course, index) => {
                  const isLast = index === courses.length - 1;
                  return (
                    <div key={course.id}>
                      <button
                        onClick={() => handleShareCourse(course)}
                        className="w-full flex items-center gap-3 py-[10px] text-left min-h-[44px]"
                      >
                        <div className="h-12 w-12 overflow-hidden bg-[#f1f5f9] flex-shrink-0" style={{ borderRadius: '34%' }}>
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
                          <p className="font-medium text-sm truncate" style={{ color: '#0f172a' }}>{course.name}</p>
                          <div className="flex items-center gap-2 text-xs" style={{ color: '#64748b' }}>
                            {(course.region || course.country) && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {[course.region, course.country].filter(Boolean).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                      </button>
                      {!isLast && (
                        <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.05)' }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tee Times Tab */}
        {activeTab === 'teetimes' && (
          <div className="flex flex-col items-center justify-center py-12">
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-3"
              style={{ background: 'rgba(245,166,35,0.10)' }}
            >
              <Calendar size={24} style={{ color: '#F5A623' }} />
            </div>
            <p className="text-[15px] font-semibold text-center" style={{ color: '#0f172a' }}>
              Tee time sharing coming soon
            </p>
            <p className="text-xs text-center mt-1" style={{ color: '#64748b' }}>
              You'll be able to share upcoming games directly in chat.
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
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-[#f1f5f9]">
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
                    className="aspect-square rounded-[12px] border-2 border-dashed border-[rgba(245,166,35,0.35)] bg-[rgba(245,166,35,0.08)] flex flex-col items-center justify-center gap-1 text-[#F5A623] transition-colors"
                  >
                    <Plus size={24} />
                    <span className="text-xs mt-1">Add</span>
                  </button>
                )}
              </div>
            )}
            
            {/* Empty state - amber-tinted dashed zone */}
            {mediaPreviews.length === 0 && (
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="w-full min-h-[160px] rounded-[16px] border-2 border-dashed border-[rgba(245,166,35,0.30)] bg-[rgba(245,166,35,0.08)] flex flex-col items-center justify-center gap-[10px] transition-colors"
              >
                <div
                  className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center"
                  style={{ background: 'rgba(245,166,35,0.12)' }}
                >
                  <ImagePlus size={24} style={{ color: '#F5A623' }} />
                </div>
                <span className="font-semibold text-[15px]" style={{ color: '#0f172a' }}>Select Photos & Videos</span>
                <span className="text-xs" style={{ color: '#64748b' }}>Up to {MAX_MEDIA} items</span>
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
            
            {/* Share CTA button */}
            {selectedMedia.length > 0 && (
              <button
                onClick={handleShareMedia}
                disabled={isUploading}
                className="w-full h-[52px] rounded-[14px] text-[16px] font-bold text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
                style={{
                  background: '#F5A623',
                  boxShadow: '0 4px 14px rgba(245,166,35,0.35)',
                }}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>Share {selectedMedia.length} item{selectedMedia.length > 1 ? 's' : ''}</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}