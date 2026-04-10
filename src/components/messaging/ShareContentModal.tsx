import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Calendar, ImagePlus, X, Plus, Loader2, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
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
  
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: ['share-courses', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('golf_courses')
        .select(`id, name, country, region, thumbnail_image, global_rank, regional_rank, usa_rank, course_rating_aggregates(avg_overall_score)`)
        .order('name')
        .limit(20);
      if (searchQuery.trim()) query = query.ilike('name', `%${searchQuery.trim()}%`);
      const { data } = await query;
      return (data || []) as CourseResult[];
    },
    enabled: activeTab === 'courses' && open,
  });

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
    onShare(`Check out ${course.name}! ⛳`, 'course_share', metadata as unknown as Record<string, unknown>);
    handleClose();
  };

  const handleMediaSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedMedia.length + files.length > MAX_MEDIA) {
      toast.error(`Maximum ${MAX_MEDIA} items allowed`);
      return;
    }
    const validFiles = files.filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'));
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreviews(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    setSelectedMedia(prev => [...prev, ...validFiles]);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
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
        const { error: uploadError } = await supabase.storage.from('message-media').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('message-media').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      }
      onShare(
        `Shared ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''} 📸`,
        'moment_share',
        { media_urls: uploadedUrls, media_count: uploadedUrls.length, thumbnail_url: uploadedUrls[0] }
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

  const tabs: { key: TabType; label: string }[] = [
    { key: 'courses', label: 'Courses' },
    { key: 'teetimes', label: 'Tee Times' },
    { key: 'moments', label: 'Moments' },
  ];

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      zIndexBase={1500}
      className="!rounded-t-[24px]"
      style={{ background: '#fff' }}
    >
      <div style={{ height: '72vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          {/* Drag handle */}
          <div style={{ width: 36, height: 4, background: '#e2e8f0', borderRadius: 99, margin: '0 auto 14px' }} />
          <h2 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Share Golf Content</h2>
          
          {/* Tab row */}
          <div className="flex" style={{ gap: 8, marginBottom: 14 }}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '7px 14px', borderRadius: 99,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  ...(activeTab === tab.key
                    ? { border: '1.5px solid #0f172a', background: '#0f172a', color: '#fff' }
                    : { border: '1.5px solid #e2e8f0', background: 'transparent', color: '#64748b' }
                  ),
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 24px' }}>
          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              {/* Search bar */}
              <div className="relative" style={{ marginBottom: 10 }}>
                <Search className="absolute" style={{ left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={14} />
                <input
                  placeholder="Search courses…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full outline-none"
                  style={{
                    height: 36, borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid rgba(0,0,0,0.08)',
                    paddingLeft: 32, fontSize: 13, color: '#1e293b',
                  }}
                />
              </div>

              {/* Section label */}
              <div style={{
                padding: '6px 0 4px',
                fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', color: '#c0c8d0',
                textTransform: 'uppercase' as const,
              }}>
                Recently Played
              </div>

              {coursesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-8" style={{ color: '#64748b' }}>No courses found</div>
              ) : (
                <div>
                  {courses.map((course, index) => (
                    <div key={course.id}>
                      <button
                        onClick={() => handleShareCourse(course)}
                        className="w-full flex items-center text-left active:bg-[rgba(247,147,30,0.04)]"
                        style={{ gap: 12, padding: '10px 0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                      >
                        <div
                          className="flex-shrink-0 overflow-hidden"
                          style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9' }}
                        >
                          {course.thumbnail_image ? (
                            <img src={course.thumbnail_image} alt={course.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">⛳</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', margin: 0 }}>{course.name}</p>
                          {(course.region || course.country) && (
                            <div className="flex items-center" style={{ gap: 4, marginTop: 2 }}>
                              <MapPin size={11} style={{ color: '#94a3b8' }} />
                              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                                {[course.region, course.country].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                      </button>
                      {index < courses.length - 1 && (
                        <div style={{ height: 1, background: 'rgba(0,0,0,0.05)' }} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tee Times Tab */}
          {activeTab === 'teetimes' && (
            <div className="flex flex-col items-center justify-center text-center" style={{ padding: '40px 24px' }}>
              <div
                className="flex items-center justify-center"
                style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(247,147,30,0.10)', marginBottom: 12 }}
              >
                <Calendar size={24} style={{ color: '#F7931E' }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Tee time sharing coming soon
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
                You'll be able to share upcoming games directly in chat.
              </p>
            </div>
          )}

          {/* Moments Tab */}
          {activeTab === 'moments' && (
            <div style={{ padding: '16px 0' }}>
              {mediaPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2" style={{ marginBottom: 16 }}>
                  {mediaPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden" style={{ background: '#f1f5f9' }}>
                      {isVideo(selectedMedia[index]) ? (
                        <video src={preview} className="w-full h-full object-cover" />
                      ) : (
                        <img src={preview} alt="" className="w-full h-full object-cover" />
                      )}
                      <button
                        onClick={() => removeMedia(index)}
                        className="absolute flex items-center justify-center"
                        style={{ top: 6, right: 6, padding: 4, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none' }}
                      >
                        <X size={14} style={{ color: '#fff' }} />
                      </button>
                    </div>
                  ))}
                  {selectedMedia.length < MAX_MEDIA && (
                    <button
                      onClick={() => mediaInputRef.current?.click()}
                      className="aspect-square flex flex-col items-center justify-center"
                      style={{
                        borderRadius: 12,
                        border: '2px dashed rgba(247,147,30,0.35)',
                        background: 'rgba(247,147,30,0.08)',
                        color: '#F7931E',
                      }}
                    >
                      <Plus size={24} />
                      <span style={{ fontSize: 12, marginTop: 4 }}>Add</span>
                    </button>
                  )}
                </div>
              )}
              
              {mediaPreviews.length === 0 && (
                <button
                  onClick={() => mediaInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center"
                  style={{
                    padding: '28px 20px', borderRadius: 18,
                    border: '2px dashed rgba(247,147,30,0.35)',
                    background: 'rgba(247,147,30,0.04)',
                    gap: 10, cursor: 'pointer',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(247,147,30,0.10)' }}
                  >
                    <ImagePlus size={22} style={{ color: '#F7931E' }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Select Photos & Videos</span>
                  <span style={{ fontSize: '12.5px', color: '#94a3b8' }}>Up to {MAX_MEDIA} items</span>
                </button>
              )}
              
              <input
                ref={mediaInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaSelect}
                className="hidden"
              />
              
              {selectedMedia.length > 0 && (
                <button
                  onClick={handleShareMedia}
                  disabled={isUploading}
                  className="w-full flex items-center justify-center active:scale-[0.98] transition-transform disabled:opacity-60"
                  style={{
                    height: 48, borderRadius: 14,
                    fontSize: '14.5px', fontWeight: 700,
                    background: 'rgba(247,147,30,0.10)',
                    border: '1px solid rgba(247,147,30,0.28)',
                    color: '#F7931E',
                    marginTop: 16, gap: 8,
                  }}
                >
                  {isUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <>Share {selectedMedia.length} item{selectedMedia.length > 1 ? 's' : ''}</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
