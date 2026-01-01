import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Music, Clock, Check, Loader2, AlertCircle, RotateCcw, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MUSIC_LIBRARY, MusicTrack, getSignedAudioUrl } from '@/lib/musicLibrary';
import { ComposerMediaItem } from '@/hooks/useSnapModal';

type CompilationLength = 12 | 20 | 30;

type CompilationState = 
  | 'settings'      // Initial settings screen
  | 'uploading'     // Uploading source clips to R2
  | 'compiling'     // Server-side compilation in progress
  | 'preview'       // Showing compiled result
  | 'error';        // Error state

interface SmartCompilationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: ComposerMediaItem[];
  existingMusic?: {
    trackId: string;
    title: string;
    artist?: string;
    r2Key?: string;
  } | null;
  onCompilationComplete: (compiledMedia: ComposerMediaItem) => void;
}

interface CompilationResult {
  streamId: string;
  playbackUrl: string;
  posterUrl: string;
  duration: number;
}

export default function SmartCompilationSheet({
  isOpen,
  onClose,
  mediaItems,
  existingMusic,
  onCompilationComplete,
}: SmartCompilationSheetProps) {
  // Settings state
  const [targetLength, setTargetLength] = useState<CompilationLength>(20);
  const [useSoundtrack, setUseSoundtrack] = useState(!!existingMusic);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(
    existingMusic ? MUSIC_LIBRARY.find(t => t.id === existingMusic.trackId) || null : null
  );
  const [showMusicPicker, setShowMusicPicker] = useState(false);
  
  // Progress state
  const [state, setState] = useState<CompilationState>('settings');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Result state
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  
  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);

  // Filter to only video items
  const videoItems = mediaItems.filter(item => item.file?.type.startsWith('video/'));
  const videoCount = videoItems.length;

  // Reset state when sheet opens
  useEffect(() => {
    if (isOpen) {
      setState('settings');
      setProgress(0);
      setProgressMessage('');
      setErrorMessage('');
      setCompilationResult(null);
      setJobId(null);
      setUseSoundtrack(!!existingMusic);
      setSelectedTrack(
        existingMusic ? MUSIC_LIBRARY.find(t => t.id === existingMusic.trackId) || null : null
      );
    }
  }, [isOpen, existingMusic]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const handleCancel = () => {
    if (state === 'uploading' || state === 'compiling') {
      abortControllerRef.current?.abort();
    }
    onClose();
  };

  const handleGenerate = async () => {
    if (videoCount < 2) return;

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // Phase 1: Create job and upload clips
      setState('uploading');
      setProgress(0);
      setProgressMessage('Preparing clips...');

      // Create compilation job
      const { data: jobData, error: jobError } = await supabase.functions.invoke('smart-compilation', {
        body: {
          action: 'create',
          clipCount: videoCount,
        },
      });

      if (jobError || !jobData?.jobId) {
        throw new Error(jobError?.message || 'Failed to create compilation job');
      }

      const newJobId = jobData.jobId as string;
      setJobId(newJobId);
      console.log('[SmartCompilation] Job created:', newJobId);

      // Upload each video clip to R2
      for (let i = 0; i < videoItems.length; i++) {
        if (signal.aborted) throw new Error('Cancelled');

        const item = videoItems[i];
        const file = item.file;
        if (!file) continue;

        setProgressMessage(`Uploading clip ${i + 1} of ${videoCount}...`);
        setProgress((i / videoCount) * 50); // 0-50% for uploads

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${i}.mp4`);
        formData.append('bucketType', `smart_compilations/${newJobId}/source`);

        const { error: uploadError } = await supabase.functions.invoke('cloudflare-r2-upload', {
          body: formData,
        });

        if (uploadError) {
          throw new Error(`Failed to upload clip ${i + 1}: ${uploadError.message}`);
        }

        console.log(`[SmartCompilation] Uploaded clip ${i + 1}/${videoCount}`);
      }

      // Phase 2: Start compilation
      setState('compiling');
      setProgress(50);
      setProgressMessage('Compiling your highlight...');

      const { data: compileData, error: compileError } = await supabase.functions.invoke('smart-compilation', {
        body: {
          action: 'compile',
          jobId: newJobId,
          clipCount: videoCount,
          targetSeconds: targetLength,
          useSoundtrack,
          soundtrackR2Key: useSoundtrack && selectedTrack ? selectedTrack.r2Key : null,
        },
      });

      if (compileError || !compileData?.success) {
        throw new Error(compileError?.message || compileData?.error || 'Compilation failed');
      }

      console.log('[SmartCompilation] Compilation complete:', compileData);

      // Set result and show preview
      setCompilationResult({
        streamId: compileData.streamId,
        playbackUrl: compileData.playbackUrl,
        posterUrl: compileData.posterUrl,
        duration: compileData.duration,
      });
      setProgress(100);
      setState('preview');

    } catch (error) {
      if ((error as Error).message === 'Cancelled') {
        console.log('[SmartCompilation] Cancelled by user');
        onClose();
        return;
      }

      console.error('[SmartCompilation] Error:', error);
      setErrorMessage((error as Error).message || 'Something went wrong');
      setState('error');
    }
  };

  const handleRegenerate = () => {
    setState('settings');
    setCompilationResult(null);
  };

  const handleUseHighlight = () => {
    if (!compilationResult) return;

    // Create a new ComposerMediaItem for the compiled video
    const compiledMedia: ComposerMediaItem = {
      id: `compiled-${compilationResult.streamId}`,
      type: 'video',
      previewUrl: compilationResult.posterUrl,
      // Note: file is not available since this is a server-compiled video
      // The upload pipeline will need to handle this specially
      compiledVideo: {
        streamId: compilationResult.streamId,
        playbackUrl: compilationResult.playbackUrl,
        posterUrl: compilationResult.posterUrl,
        duration: compilationResult.duration,
      },
    };

    onCompilationComplete(compiledMedia);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000]"
        onClick={state === 'settings' ? onClose : undefined}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="absolute bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh] overflow-hidden flex flex-col"
          style={{ 
            background: 'var(--cm-surface-card)',
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div 
              className="w-10 h-1 rounded-full"
              style={{ background: 'var(--cm-border)' }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5" style={{ color: 'var(--cm-accent)' }} />
              <div>
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  Smart Compilation
                </h3>
                <p 
                  className="text-xs"
                  style={{ color: 'var(--cm-text-tertiary)' }}
                >
                  {state === 'settings' && `Create a highlight from ${videoCount} clips`}
                  {state === 'uploading' && 'Preparing your clips...'}
                  {state === 'compiling' && 'Creating your highlight...'}
                  {state === 'preview' && 'Preview your highlight'}
                  {state === 'error' && 'Something went wrong'}
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--cm-surface-alt)' }}
            >
              <X className="w-4 h-4" style={{ color: 'var(--cm-icon-primary)' }} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Settings View */}
            {state === 'settings' && (
              <div className="space-y-4">
                {/* Highlight Length */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--cm-surface-alt)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" style={{ color: 'var(--cm-icon-secondary)' }} />
                    <span 
                      className="text-sm font-medium"
                      style={{ color: 'var(--cm-text-primary)' }}
                    >
                      Highlight Length
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {([12, 20, 30] as CompilationLength[]).map((length) => (
                      <button
                        key={length}
                        onClick={() => setTargetLength(length)}
                        className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors"
                        style={{
                          background: targetLength === length 
                            ? 'var(--cm-surface-slate)' 
                            : 'var(--cm-surface-card)',
                          color: targetLength === length 
                            ? 'white' 
                            : 'var(--cm-text-secondary)',
                          border: targetLength === length 
                            ? 'none' 
                            : '1px solid var(--cm-border-subtle)',
                        }}
                      >
                        {length === 12 && 'Short'}
                        {length === 20 && 'Standard'}
                        {length === 30 && 'Full'}
                        <span 
                          className="block text-xs mt-0.5"
                          style={{ 
                            color: targetLength === length 
                              ? 'rgba(255,255,255,0.7)' 
                              : 'var(--cm-text-tertiary)'
                          }}
                        >
                          {length}s
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Music Overlay */}
                <div 
                  className="p-4 rounded-xl"
                  style={{ background: 'var(--cm-surface-alt)' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" style={{ color: 'var(--cm-icon-secondary)' }} />
                      <span 
                        className="text-sm font-medium"
                        style={{ color: 'var(--cm-text-primary)' }}
                      >
                        Use Soundtrack
                      </span>
                    </div>
                    <button
                      onClick={() => setUseSoundtrack(!useSoundtrack)}
                      className="relative w-11 h-6 rounded-full transition-colors"
                      style={{
                        background: useSoundtrack 
                          ? 'var(--cm-surface-slate)' 
                          : 'var(--cm-border)',
                      }}
                    >
                      <div 
                        className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                        style={{
                          transform: useSoundtrack ? 'translateX(24px)' : 'translateX(4px)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Track selector */}
                  {useSoundtrack && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <button
                        onClick={() => setShowMusicPicker(true)}
                        className="w-full p-3 rounded-lg text-left flex items-center justify-between"
                        style={{ 
                          background: 'var(--cm-surface-card)',
                          border: '1px solid var(--cm-border-subtle)',
                        }}
                      >
                        <div>
                          <p 
                            className="text-sm font-medium"
                            style={{ color: 'var(--cm-text-primary)' }}
                          >
                            {selectedTrack?.title || 'Select a track'}
                          </p>
                          {selectedTrack && (
                            <p 
                              className="text-xs"
                              style={{ color: 'var(--cm-text-tertiary)' }}
                            >
                              {selectedTrack.artist} • {selectedTrack.mood}
                            </p>
                          )}
                        </div>
                        <Music 
                          className="w-4 h-4" 
                          style={{ color: 'var(--cm-icon-secondary)' }} 
                        />
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Music Picker Modal */}
                <AnimatePresence>
                  {showMusicPicker && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[10001] flex items-end justify-center"
                      onClick={() => setShowMusicPicker(false)}
                    >
                      <div className="absolute inset-0 bg-black/40" />
                      <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="relative w-full max-h-[60vh] rounded-t-2xl overflow-hidden"
                        style={{ background: 'var(--cm-surface-card)' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--cm-border-subtle)' }}>
                          <h4 className="font-medium" style={{ color: 'var(--cm-text-primary)' }}>
                            Select Track
                          </h4>
                          <button onClick={() => setShowMusicPicker(false)}>
                            <X className="w-5 h-5" style={{ color: 'var(--cm-icon-primary)' }} />
                          </button>
                        </div>
                        <div className="overflow-y-auto max-h-[50vh]">
                          {MUSIC_LIBRARY.map((track) => (
                            <button
                              key={track.id}
                              onClick={() => {
                                setSelectedTrack(track);
                                setShowMusicPicker(false);
                              }}
                              className="w-full p-4 flex items-center gap-3 border-b"
                              style={{ 
                                borderColor: 'var(--cm-border-subtle)',
                                background: selectedTrack?.id === track.id 
                                  ? 'var(--cm-surface-alt)' 
                                  : 'transparent',
                              }}
                            >
                              <div className="flex-1 text-left">
                                <p 
                                  className="text-sm font-medium"
                                  style={{ color: 'var(--cm-text-primary)' }}
                                >
                                  {track.title}
                                </p>
                                <p 
                                  className="text-xs"
                                  style={{ color: 'var(--cm-text-tertiary)' }}
                                >
                                  {track.artist} • {track.mood} • {track.duration}
                                </p>
                              </div>
                              {selectedTrack?.id === track.id && (
                                <Check 
                                  className="w-4 h-4" 
                                  style={{ color: 'var(--cm-accent)' }} 
                                />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={useSoundtrack && !selectedTrack}
                  className="w-full py-3.5 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    background: 'var(--cm-surface-slate)',
                    color: 'white',
                  }}
                >
                  Generate Highlight
                </button>
              </div>
            )}

            {/* Progress View */}
            {(state === 'uploading' || state === 'compiling') && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 
                  className="w-12 h-12 animate-spin mb-4" 
                  style={{ color: 'var(--cm-accent)' }} 
                />
                <p 
                  className="text-sm font-medium mb-2"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  {progressMessage}
                </p>
                <div 
                  className="w-48 h-1.5 rounded-full overflow-hidden"
                  style={{ background: 'var(--cm-surface-alt)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'var(--cm-surface-slate)' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <button
                  onClick={handleCancel}
                  className="mt-6 px-4 py-2 text-sm rounded-lg"
                  style={{ 
                    background: 'var(--cm-surface-alt)',
                    color: 'var(--cm-text-secondary)',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Preview View */}
            {state === 'preview' && compilationResult && (
              <div className="space-y-4">
                {/* Video Preview */}
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-black">
                  <video
                    ref={videoPreviewRef}
                    src={compilationResult.playbackUrl}
                    poster={compilationResult.posterUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleRegenerate}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium"
                    style={{ 
                      background: 'var(--cm-surface-alt)',
                      border: '1px solid var(--cm-border-subtle)',
                      color: 'var(--cm-text-primary)',
                    }}
                  >
                    <RotateCcw className="w-4 h-4" />
                    Regenerate
                  </button>
                  <button
                    onClick={handleUseHighlight}
                    className="flex-1 py-3 rounded-xl font-semibold"
                    style={{ 
                      background: 'var(--cm-surface-slate)',
                      color: 'white',
                    }}
                  >
                    Use Highlight
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm"
                  style={{ color: 'var(--cm-text-secondary)' }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to original clips
                </button>
              </div>
            )}

            {/* Error View */}
            {state === 'error' && (
              <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle 
                  className="w-12 h-12 mb-4" 
                  style={{ color: 'hsl(0 72% 51%)' }} 
                />
                <p 
                  className="text-sm font-medium mb-2 text-center"
                  style={{ color: 'var(--cm-text-primary)' }}
                >
                  Compilation Failed
                </p>
                <p 
                  className="text-xs text-center mb-6 max-w-[250px]"
                  style={{ color: 'var(--cm-text-tertiary)' }}
                >
                  {errorMessage}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm rounded-lg"
                    style={{ 
                      background: 'var(--cm-surface-alt)',
                      color: 'var(--cm-text-secondary)',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setState('settings')}
                    className="px-4 py-2 text-sm rounded-lg font-medium"
                    style={{ 
                      background: 'var(--cm-surface-slate)',
                      color: 'white',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
