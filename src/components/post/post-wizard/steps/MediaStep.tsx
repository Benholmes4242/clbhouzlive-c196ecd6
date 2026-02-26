// MediaStep - Step 1: Add Media, Studio, Tags
// Uses native OS picker via pickMediaFiles utility
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Images, Plus, Wand2, Award, MapPin, AtSign, X, Play } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';
import { pickMediaFiles, validateMediaFiles } from '@/utils/media/pickMediaFiles';
import { StepProps } from '../types';
import { StudioEdits } from '@/types/studio';
import { ComposerMediaItem } from '@/hooks/useSnapModal';
import { PermissionDeniedCard } from '../components';
import { PostTemplate } from '../components/PostTemplateSelector';
import { useFirstRunFlag } from '@/hooks/useFirstRunFlag';
import { useToast } from '@/hooks/use-toast';

// Lazy imports for heavy components
import CreateMomentMediaStage from '@/components/post/create-moment/CreateMomentMediaStage';
import { POST_LIMITS } from '@/constants/postLimits';
import { validateMediaFile } from '@/constants/postLimits';

// Processing UX components
import { MediaProcessingBanner } from '@/components/post/create-moment/MediaProcessingBanner';
import { PickerLoadingBanner } from '@/components/post/create-moment/PickerLoadingBanner';

// Helper functions for background video processing
async function readVideoDuration(src: string, timeoutMs = 3000): Promise<number | undefined> {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    let done = false;

    const cleanup = () => {
      if (!done) {
        done = true;
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      }
    };

    const to = setTimeout(() => {
      cleanup();
      resolve(undefined);
    }, timeoutMs);

    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      clearTimeout(to);
      const d = isFinite(v.duration) ? v.duration : undefined;
      cleanup();
      resolve(d);
    };
    v.onerror = () => {
      clearTimeout(to);
      cleanup();
      resolve(undefined);
    };
    v.src = src;
  });
}

async function generateVideoPoster(videoFile: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const blobUrl = URL.createObjectURL(videoFile);
    let resolved = false;
    
    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      video.oncanplay = null;
    };
    
    const captureFrame = () => {
      if (resolved) return;
      resolved = true;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx || video.videoWidth === 0) {
        cleanup();
        resolve(undefined);
        return;
      }
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        cleanup();
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          resolve(undefined);
        }
      }, 'image/jpeg', 0.8);
    };
    
    video.onloadedmetadata = () => {
      const seekTime = Math.min(0.5, video.duration || 0.5);
      video.currentTime = seekTime;
    };
    
    video.onseeked = () => {
      setTimeout(captureFrame, 50);
    };
    
    video.oncanplay = () => {
      if (!resolved && video.currentTime === 0) {
        setTimeout(captureFrame, 100);
      }
    };
    
    video.onerror = () => {
      cleanup();
      resolve(undefined);
    };
    
    setTimeout(() => {
      if (!resolved) {
        captureFrame();
      }
    }, 2000);
    
    video.preload = 'metadata';
    video.playsInline = true;
    video.muted = true;
    video.src = blobUrl;
    video.load();
  });
}

interface MediaStepProps extends StepProps {
  onOpenStudio: () => void;
  onOpenBadges: () => void;
}

export function MediaStep({ 
  state, 
  dispatch,
  onOpenStudio,
  onOpenBadges,
}: MediaStepProps) {
  const hasMedia = state.mediaItems.length > 0;
  const canAddMore = state.mediaItems.length < POST_LIMITS.MAX_MEDIA_COUNT;
  const { toast } = useToast();
  
  // Loading states for picker
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState<'camera' | 'photos' | null>(null);
  
  // Per-item processing tracking (replaces blocking overlay)
  const [processingMediaIds, setProcessingMediaIds] = useState<Set<string>>(new Set());
  const [warningMediaIds, setWarningMediaIds] = useState<Set<string>>(new Set());
  const [removingMediaIds, setRemovingMediaIds] = useState<Set<string>>(new Set());
  
  // Batch progress tracking
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCompleted, setBatchCompleted] = useState(0);
  
  // First-run flags for Studio & Badges discovery
  const studioFirstRun = useFirstRunFlag('postWizard:studio');
  const badgesFirstRun = useFirstRunFlag('postWizard:badges');
  
  // Active media ID - use state or default to first item
  const activeMediaId = useMemo(() => {
    if (state.activeMediaId) return state.activeMediaId;
    if (state.mediaItems.length === 0) return null;
    return state.mediaItems[0]?.id ?? null;
  }, [state.activeMediaId, state.mediaItems]);
  
  // Cover media ID based on coverIndex
  const coverMediaId = useMemo(() => {
    return state.mediaItems[state.coverIndex]?.id ?? null;
  }, [state.mediaItems, state.coverIndex]);
  
  // Current media index for counter pill
  const currentMediaIndex = useMemo(() => {
    if (!activeMediaId) return 0;
    const idx = state.mediaItems.findIndex(m => m.id === activeMediaId);
    return idx >= 0 ? idx : 0;
  }, [activeMediaId, state.mediaItems]);
  
  // Get edits for a media item
  const getEdits = useCallback((mediaId: string): StudioEdits => {
    return state.studioEditsByMediaId[mediaId] ?? {};
  }, [state.studioEditsByMediaId]);
  
  // Animated removal — shrink out before dispatching REMOVE_MEDIA
  const animateAndRemove = useCallback((mediaId: string) => {
    setRemovingMediaIds(prev => new Set(prev).add(mediaId));
    setTimeout(() => {
      dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
      setRemovingMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      setProcessingMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
      setWarningMediaIds(prev => {
        const next = new Set(prev);
        next.delete(mediaId);
        return next;
      });
    }, 200);
  }, [dispatch]);
  
  // Non-blocking file processing
  const handleFilesSelected = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    // Validate files first
    const validFiles = validateMediaFiles(files);
    if (validFiles.length === 0) return;
    
    // IMMEDIATELY create placeholder items and add to state
    const placeholderItems: ComposerMediaItem[] = validFiles.map((file, idx) => {
      const type: 'image' | 'video' = file.type.startsWith('video') ? 'video' : 'image';
      const previewUrl = URL.createObjectURL(file);
      
      return {
        id: crypto.randomUUID?.() ?? `${Date.now()}-${idx}`,
        type,
        file,
        previewUrl,
        thumbnailUrl: type === 'image' ? previewUrl : undefined,
        duration: undefined,
      } as ComposerMediaItem;
    });
    
    // Add to state immediately - user sees their media right away
    dispatch({ type: 'ADD_MEDIA', payload: placeholderItems });
    triggerHaptic('success');
    
    // Count videos that need processing
    const videosToProcess = placeholderItems.filter(item => item.type === 'video');
    if (videosToProcess.length > 0) {
      // Mark videos as processing (per-item tracking)
      setProcessingMediaIds(prev => {
        const next = new Set(prev);
        videosToProcess.forEach(v => next.add(v.id));
        return next;
      });
      
      // Set batch progress
      setBatchTotal(prev => prev + videosToProcess.length);
    }
    
    // Process videos in background (non-blocking)
    videosToProcess.forEach(async (item) => {
      try {
        const tmpUrl = URL.createObjectURL(item.file!);
        
        // Extract duration in background
        const duration = await readVideoDuration(tmpUrl, 3000);
        
        // Validate duration
        const validation = validateMediaFile(item.file!, duration);
        if (!validation.valid) {
          console.warn('Video validation failed:', validation.error);
          
          // Show toast explaining why the video was removed
          toast({
            title: 'Video removed',
            description: validation.error || 'Video exceeds the allowed limits.',
            variant: 'destructive',
          });
          triggerHaptic('error');
          
          // Animate out then remove
          animateAndRemove(item.id);
          setBatchCompleted(prev => prev + 1);
          URL.revokeObjectURL(tmpUrl);
          return;
        }
        
        // Generate poster in background
        let thumbnailUrl: string | undefined;
        try {
          thumbnailUrl = await generateVideoPoster(item.file!);
        } catch (posterErr) {
          console.warn('Poster generation failed:', posterErr);
          // Mark as warning — video still usable, just no custom poster
          setWarningMediaIds(prev => new Set(prev).add(item.id));
        }
        
        // If poster came back undefined (not error, just failed), also mark warning
        if (!thumbnailUrl) {
          setWarningMediaIds(prev => new Set(prev).add(item.id));
        }
        
        // Update the specific media item with thumbnail and duration
        dispatch({ 
          type: 'UPDATE_MEDIA_ITEM', 
          payload: { 
            id: item.id, 
            updates: { 
              duration, 
              thumbnailUrl: thumbnailUrl || item.previewUrl,
            } 
          } 
        });
        
        URL.revokeObjectURL(tmpUrl);
      } catch (err) {
        console.error('Video processing error:', err);
        // Mark as warning — video still usable
        setWarningMediaIds(prev => new Set(prev).add(item.id));
      } finally {
        // Remove from processing set
        setProcessingMediaIds(prev => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setBatchCompleted(prev => prev + 1);
      }
    });
  }, [dispatch, toast, animateAndRemove]);
  
  // Reset batch counters when all processing completes
  useEffect(() => {
    if (batchTotal > 0 && batchCompleted >= batchTotal && processingMediaIds.size === 0) {
      // Reset after the completion banner fades (2s + buffer)
      const timer = setTimeout(() => {
        setBatchTotal(0);
        setBatchCompleted(0);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [batchTotal, batchCompleted, processingMediaIds.size]);
  
  // Open camera via native OS picker with capture attribute
  const handleCamera = useCallback(async () => {
    setPermissionDenied(null);
    setIsPickerOpen(true);
    
    try {
      const files = await pickMediaFiles({ 
        accept: 'image/*,video/*', 
        capture: 'environment',
        multiple: false 
      });
      
      setIsPickerOpen(false);
      
      if (files.length > 0) {
        await handleFilesSelected(files);
      }
    } catch (error) {
      console.error('[MediaStep] Camera error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [handleFilesSelected]);
  
  // Open gallery via native OS picker
  const handleGallery = useCallback(async () => {
    setPermissionDenied(null);
    
    const remainingSlots = POST_LIMITS.MAX_MEDIA_COUNT - state.mediaItems.length;
    
    if (remainingSlots <= 0) {
      return;
    }
    
    setIsPickerOpen(true);
    
    try {
      const files = await pickMediaFiles({ 
        accept: 'image/*,video/*', 
        multiple: remainingSlots > 1,
        maxFiles: remainingSlots
      });
      
      setIsPickerOpen(false);
      
      if (files.length > 0) {
        // Enforce the limit
        const trimmed = files.slice(0, remainingSlots);
        await handleFilesSelected(trimmed);
      }
    } catch (error) {
      console.error('[MediaStep] Gallery picker error:', error);
      setIsPickerOpen(false);
      triggerHaptic('error');
    }
  }, [handleFilesSelected, state.mediaItems.length]);
  
  // Retry permission handler
  const handleRetryPermission = useCallback(() => {
    const deniedType = permissionDenied;
    setPermissionDenied(null);
    if (deniedType === 'camera') {
      handleCamera();
    } else {
      handleGallery();
    }
  }, [permissionDenied, handleCamera, handleGallery]);
  
  // NOTE: Auto-launch removed - iOS blocks programmatic input.click() without user gesture
  
  // Handle active media change (for studio)
  const handleActiveMediaChange = useCallback((mediaId: string) => {
    dispatch({ type: 'SET_ACTIVE_MEDIA_ID', payload: mediaId });
  }, [dispatch]);
  
  // Handle set cover
  const handleSetCover = useCallback((mediaId: string) => {
    const index = state.mediaItems.findIndex(m => m.id === mediaId);
    if (index >= 0) {
      dispatch({ type: 'SET_COVER_INDEX', payload: index });
      triggerHaptic('selection');
    }
  }, [state.mediaItems, dispatch]);
  
  // Handle remove media
  const handleRemoveMedia = useCallback((mediaId: string) => {
    dispatch({ type: 'REMOVE_MEDIA', payload: mediaId });
    triggerHaptic('light');
  }, [dispatch]);
  
  // Handle reorder
  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    const items = [...state.mediaItems];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    
    // Reindex orders
    const reordered = items.map((item, idx) => ({ ...item, order: idx }));
    dispatch({ type: 'REORDER_MEDIA', payload: reordered });
    triggerHaptic('selection');
  }, [state.mediaItems, dispatch]);

  // Template state
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  const handleSelectTemplate = useCallback((template: PostTemplate) => {
    setActiveTemplateId(template.id);
    dispatch({ type: 'SET_CATEGORIES', payload: template.categories as any });
    dispatch({ type: 'SET_CAPTION', payload: template.captionStructure });
    if (template.badges) {
      dispatch({ type: 'SET_BADGES', payload: template.badges });
    }
  }, [dispatch]);

  const handleDeselectTemplate = useCallback(() => {
    setActiveTemplateId(null);
    dispatch({ type: 'SET_CATEGORIES', payload: [] as any });
    dispatch({ type: 'SET_CAPTION', payload: '' });
    dispatch({ type: 'SET_BADGES', payload: [] });
  }, [dispatch]);

  // Mounted state for staggered entrance animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (!hasMedia) {
      const t = setTimeout(() => setMounted(true), 100);
      return () => clearTimeout(t);
    }
  }, [hasMedia]);

  // Template cards data with unique gradients
  const TEMPLATE_CARDS: (PostTemplate & { desc: string; gradient: string })[] = [
    { id: 'course-vlog', emoji: '🎬', label: 'Course Vlog', desc: 'Document your round', gradient: 'linear-gradient(135deg, #2a1f0a 0%, #4a3510 50%, #3a2a0a 100%)', icon: Camera, categories: ['course-vlog'], captionStructure: 'Course: \nConditions: \nHighlights: \nRating: /10' },
    { id: 'tournament', emoji: '🏆', label: 'Tournament', desc: 'Competition day', gradient: 'linear-gradient(135deg, #1a2a1a 0%, #2a4a2a 50%, #1a3a1a 100%)', icon: Camera, categories: ['tournament'], captionStructure: 'Event: \nCourse: \nScore: \nHighlights:' },
    { id: 'hole-in-one', emoji: '🎯', label: 'Hole-in-One', desc: 'Celebrate the ace', gradient: 'linear-gradient(135deg, #3a1a1a 0%, #5a2020 50%, #4a1a1a 100%)', icon: Camera, categories: ['achievement'], captionStructure: 'HOLE IN ONE! 🎯\nCourse: \nHole: \nYards: \nClub:', badges: ['hole-in-one'] },
    { id: 'society-day', emoji: '📸', label: 'Best Shots', desc: 'Showcase photos', gradient: 'linear-gradient(135deg, #1a2030 0%, #2a3a5a 50%, #1a2a4a 100%)', icon: Camera, categories: ['society'], captionStructure: 'Society: \nCourse: \nWinner: \nBest Moment:' },
    { id: 'review', emoji: '⭐', label: 'Course Review', desc: 'Rate & review', gradient: 'linear-gradient(135deg, #2a2010 0%, #4a3a18 50%, #3a2a10 100%)', icon: Camera, categories: ['review'], captionStructure: 'Course: \nCondition: \nLayout: \nOverall: /10' },
  ];

  // Empty state
  if (!hasMedia) {
    if (permissionDenied) {
      return (
        <PermissionDeniedCard 
          type={permissionDenied} 
          onRetry={handleRetryPermission}
        />
      );
    }
    
    return (
      <div 
        className="h-full flex flex-col relative overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #1a1008 0%, #2a1a0a 12%, #33200c 28%, #f8f6f3 55%, #f9f8f6 100%)',
        }}
      >
        {/* Ambient amber glow */}
        <div 
          className="absolute pointer-events-none"
          style={{
            top: '-60px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '380px',
            height: '380px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.10) 0%, rgba(251, 191, 36, 0.04) 40%, transparent 70%)',
            zIndex: 1,
          }}
        />

        {/* Grain texture overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            zIndex: 1,
          }}
        />

        {/* Skeleton loading banner */}
        <PickerLoadingBanner isVisible={isPickerOpen} />
        
        {/* Content container — max-width for tablet/desktop */}
        <div 
          className="relative flex flex-col items-center w-full max-w-[430px] mx-auto px-6 z-[2]"
          style={{ paddingTop: '48px', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
        >
          {/* === PHASE 4: Glass Capture Card === */}
          <motion.div 
            className="w-full relative"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.15s',
            }}
          >
            <div 
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(245, 158, 11, 0.12)',
                padding: '32px 24px 28px',
              }}
            >
              {/* Amber accent line */}
              <div 
                className="absolute top-0 left-1/2 -translate-x-1/2"
                style={{
                  width: '60px',
                  height: '2px',
                  borderRadius: '1px',
                  background: 'linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent)',
                }}
              />

              {/* Inner glow */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                style={{
                  top: '-30px',
                  width: '240px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)',
                }}
              />

              {/* Title section */}
              <div className="text-center mb-6 relative">
                <h3 
                  className="font-bold mb-1.5"
                  style={{ fontSize: '22px', color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}
                >
                  Create Your Moment
                </h3>
                <p style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 500 }}>
                  Up to {POST_LIMITS.MAX_MEDIA_COUNT} photos & videos from your round
                </p>
              </div>

              {/* Camera & Gallery buttons */}
              <div className="flex gap-3">
                <motion.button
                  onClick={handleCamera}
                  disabled={isPickerOpen}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    height: '80px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>📷</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>Camera</span>
                </motion.button>
                <motion.button
                  onClick={handleGallery}
                  disabled={isPickerOpen}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl transition-all disabled:opacity-50"
                  style={{
                    height: '80px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.10)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                  }}
                >
                  <span style={{ fontSize: '28px' }}>🖼️</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)' }}>Gallery</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* === PHASE 5: Template Cards Carousel === */}
          <div
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.3s',
              marginTop: '32px',
              width: '100%',
            }}
          >
            <p 
              className="uppercase mb-3.5"
              style={{ 
                fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', 
                color: 'rgba(120, 100, 70, 0.5)', paddingLeft: '0px',
              }}
            >
              Start from a template
            </p>
            <div 
              className="flex gap-3 overflow-x-auto -mx-6 px-6 pb-1"
              style={{ 
                scrollbarWidth: 'none', 
                WebkitOverflowScrolling: 'touch',
                scrollSnapType: 'x proximity',
              }}
            >
              {TEMPLATE_CARDS.map((tpl) => {
                const isActive = activeTemplateId === tpl.id;
                return (
                  <motion.button
                    key={tpl.id}
                    onClick={() => {
                      triggerHaptic('light');
                      if (isActive) handleDeselectTemplate();
                      else handleSelectTemplate(tpl);
                    }}
                    whileTap={{ scale: 0.97 }}
                    className="flex-shrink-0 flex flex-col justify-between text-left rounded-2xl transition-all"
                    style={{
                      minWidth: '120px',
                      height: '150px',
                      padding: '16px 14px',
                      background: tpl.gradient,
                      border: isActive ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid transparent',
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>{tpl.emoji}</span>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'white' }}>{tpl.label}</p>
                      <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)' }}>{tpl.desc}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* === PHASE 6: Quick Actions === */}
          <div
            className="flex justify-center gap-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.45s',
              padding: '36px 24px 24px',
            }}
          >
            {[
              { emoji: '📸', label: 'Best shots' },
              { emoji: '👋', label: 'Tag partners' },
              { emoji: '📍', label: 'Add location' },
            ].map((action) => (
              <div key={action.label} className="flex flex-col items-center gap-2">
                <div 
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'rgba(168, 162, 158, 0.08)',
                    border: '1px solid rgba(168, 162, 158, 0.12)',
                    fontSize: '20px',
                  }}
                >
                  {action.emoji}
                </div>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#78716c' }}>
                  {action.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Non-blocking picker loading banner */}
      <PickerLoadingBanner isVisible={isPickerOpen} />
      
      {/* Large media preview stage — takes all remaining space */}
      <div className="flex-1 min-h-0">
        <CreateMomentMediaStage
          media={state.mediaItems}
          activeMediaId={activeMediaId}
          coverMediaId={coverMediaId}
          onActiveMediaChange={handleActiveMediaChange}
          onSetCover={handleSetCover}
          onRemoveMedia={handleRemoveMedia}
          onReorder={handleReorder}
          getEdits={getEdits}
          processingMediaIds={processingMediaIds}
          warningMediaIds={warningMediaIds}
          removingMediaIds={removingMediaIds}
        />
      </div>
      
      {/* Bottom footer bar — counter + 3 buttons */}
      <div 
        className="flex-shrink-0 border-t border-border/30 px-4 py-3 bg-[#F8FAFC]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
      >
        {/* Non-blocking processing progress banner */}
        <MediaProcessingBanner 
          totalVideos={batchTotal} 
          completedVideos={batchCompleted} 
        />
        
        {/* Counter — centered */}
        <p className="text-sm text-muted-foreground font-medium tabular-nums text-center mb-2">
          {state.mediaItems.length}/{POST_LIMITS.MAX_MEDIA_COUNT}
        </p>
        
        {/* Three buttons row */}
        <div className="flex items-center justify-center gap-4">
          {/* Add button */}
          <button
            onClick={handleGallery}
            disabled={!canAddMore || isPickerOpen}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted text-sm font-medium text-foreground active:bg-muted/80 transition-colors ${!canAddMore ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
          
          {/* Studio button */}
          <button
            onClick={() => {
              studioFirstRun.markSeen();
              onOpenStudio();
            }}
            className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted text-sm font-medium text-foreground active:bg-muted/80 transition-colors"
          >
            <Wand2 className="h-4 w-4" />
            Studio
            {!studioFirstRun.hasSeen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
          
          {/* Badges button */}
          <button
            onClick={() => {
              badgesFirstRun.markSeen();
              onOpenBadges();
            }}
            className="relative flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-muted text-sm font-medium text-foreground active:bg-muted/80 transition-colors"
          >
            <Award className="h-4 w-4" />
            Badges
            {!badgesFirstRun.hasSeen && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
