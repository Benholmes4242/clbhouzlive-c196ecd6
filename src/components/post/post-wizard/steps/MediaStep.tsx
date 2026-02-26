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

// ─── Template card data ───────────────────────────────────────────────
interface TemplateCard {
  id: string;
  label: string;
  description: string;
  emoji: string;
  gradient: string;
  categories: string[];
  captionStructure: string;
  badges?: string[];
}

const TEMPLATE_CARDS: TemplateCard[] = [
  {
    id: 'course-vlog',
    label: 'Course Vlog',
    description: 'Share your round',
    emoji: '🎬',
    gradient: 'linear-gradient(135deg, #2a1f0a 0%, #4a3510 50%, #3a2a0a 100%)',
    categories: ['course-vlog'],
    captionStructure: 'Course: \nConditions: \nHighlights: \nRating: /10',
  },
  {
    id: 'tournament',
    label: 'Tournament',
    description: 'Compete & share',
    emoji: '🏆',
    gradient: 'linear-gradient(135deg, #1a2a1a 0%, #2a4a2a 50%, #1a3a1a 100%)',
    categories: ['tournament'],
    captionStructure: 'Event: \nCourse: \nScore: \nHighlights:',
  },
  {
    id: 'hole-in-one',
    label: 'Hole-in-One',
    description: 'Celebrate the ace',
    emoji: '🎯',
    gradient: 'linear-gradient(135deg, #3a1a1a 0%, #5a2020 50%, #4a1a1a 100%)',
    categories: ['achievement'],
    captionStructure: 'HOLE IN ONE! 🎯\nCourse: \nHole: \nYards: \nClub:',
    badges: ['hole-in-one'],
  },
  {
    id: 'best-shots',
    label: 'Best Shots',
    description: 'Your top moments',
    emoji: '📸',
    gradient: 'linear-gradient(135deg, #1a2030 0%, #2a3a5a 50%, #1a2a4a 100%)',
    categories: ['highlight'],
    captionStructure: '',
  },
  {
    id: 'course-review',
    label: 'Course Review',
    description: 'Rate & review',
    emoji: '⭐',
    gradient: 'linear-gradient(135deg, #2a2010 0%, #4a3a18 50%, #3a2a10 100%)',
    categories: ['review'],
    captionStructure: 'Course: \nConditions: \nPace: \nValue: \nOverall: /10',
  },
];

// Noise SVG for grain texture
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

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

  // Entrance animation
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);
  
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

  const handleSelectTemplate = useCallback((template: TemplateCard) => {
    if (activeTemplateId === template.id) {
      // Deselect
      setActiveTemplateId(null);
      dispatch({ type: 'SET_CATEGORIES', payload: [] as any });
      dispatch({ type: 'SET_CAPTION', payload: '' });
      dispatch({ type: 'SET_BADGES', payload: [] });
    } else {
      setActiveTemplateId(template.id);
      dispatch({ type: 'SET_CATEGORIES', payload: template.categories as any });
      dispatch({ type: 'SET_CAPTION', payload: template.captionStructure });
      if (template.badges) {
        dispatch({ type: 'SET_BADGES', payload: template.badges });
      }
    }
    triggerHaptic('light');
  }, [activeTemplateId, dispatch]);

  // Empty state — Glass redesign
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
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
      >
        {/* Ambient amber glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -60,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.10) 0%, rgba(251,191,36,0.04) 40%, transparent 70%)',
          }}
        />

        {/* Grain texture overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: 0.03,
            backgroundImage: GRAIN_SVG,
            zIndex: 1,
          }}
        />

        {/* Skeleton loading banner */}
        <PickerLoadingBanner isVisible={isPickerOpen} />

        {/* Content — staggered entrance */}
        <div className="relative z-[2] flex flex-col items-center w-full max-w-[430px] mx-auto px-6 pt-6">

          {/* ── Glass Capture Card ── */}
          <motion.div
            className="w-full relative rounded-3xl overflow-hidden"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.15s',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(245,158,11,0.12)',
              padding: '32px 24px 28px',
            }}
          >
            {/* Amber accent line */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                width: 60,
                height: 2,
                borderRadius: 1,
                background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)',
              }}
            />

            {/* Inner glow */}
            <div
              className="absolute pointer-events-none left-1/2 -translate-x-1/2"
              style={{
                top: -30,
                width: 240,
                height: 120,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)',
              }}
            />

            {/* Title */}
            <div className="text-center mb-6 relative">
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: 'white',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                Create Your Moment
              </h3>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
                Up to {POST_LIMITS.MAX_MEDIA_COUNT} photos &amp; videos from your round
              </p>
            </div>

            {/* Camera & Gallery buttons — equal glass style */}
            <div className="flex gap-3">
              <button
                onClick={handleCamera}
                disabled={isPickerOpen}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl active:scale-[0.97] transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <span style={{ fontSize: 28 }}>📷</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Camera</span>
              </button>
              <button
                onClick={handleGallery}
                disabled={isPickerOpen}
                className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl active:scale-[0.97] transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <span style={{ fontSize: 28 }}>🖼️</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>Gallery</span>
              </button>
            </div>
          </motion.div>

          {/* ── Template Cards Carousel ── */}
          <div
            className="w-full mt-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.3s',
            }}
          >
            <p
              className="px-0 mb-3.5"
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(120,100,70,0.5)',
              }}
            >
              Start from a template
            </p>

            <div
              className="flex gap-3 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide"
              style={{
                scrollSnapType: 'x proximity',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {TEMPLATE_CARDS.map((t) => {
                const isActive = activeTemplateId === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTemplate(t)}
                    className="flex-shrink-0 flex flex-col justify-between text-left rounded-2xl active:scale-[0.97] transition-all"
                    style={{
                      minWidth: 120,
                      height: 150,
                      padding: '16px 14px',
                      background: t.gradient,
                      border: isActive
                        ? '1px solid rgba(245,158,11,0.5)'
                        : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.3)' : undefined,
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <span style={{ fontSize: 32 }}>{t.emoji}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                        {t.label}
                      </p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {t.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Quick Actions ── */}
          <div
            className="flex justify-center gap-8 pt-9 pb-6"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(15px)',
              transition: 'all 0.6s cubic-bezier(0.32, 0.72, 0, 1) 0.45s',
            }}
          >
            {[
              { icon: <Camera className="h-5 w-5" />, label: 'Best shots' },
              { icon: <AtSign className="h-5 w-5" />, label: 'Tag partners' },
              { icon: <MapPin className="h-5 w-5" />, label: 'Add location' },
            ].map((qa) => (
              <div key={qa.label} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(168,162,158,0.08)',
                    border: '1px solid rgba(168,162,158,0.12)',
                    color: '#78716c',
                  }}
                >
                  {qa.icon}
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, color: '#78716c' }}>
                  {qa.label}
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
