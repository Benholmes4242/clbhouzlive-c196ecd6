import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Play, RefreshCw, Download, Wand2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface SmartCompilationProps {
  files: File[];
  onCompilationComplete: (compiledVideoFile: File, suggestedCaption: string) => void;
  disabled?: boolean;
}

interface VideoClipData {
  id: string;
  file: File;
  thumbnailUrl: string;
  duration: number;
  order: number;
}

interface CompilationStatus {
  status: 'idle' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  compiledVideoUrl?: string;
  suggestedCaption?: string;
  error?: string;
}

const SmartCompilation: React.FC<SmartCompilationProps> = ({
  files,
  onCompilationComplete,
  disabled = false
}) => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [useAiAssist, setUseAiAssist] = useState(true);
  const [videoClips, setVideoClips] = useState<VideoClipData[]>([]);
  const [compilationStatus, setCompilationStatus] = useState<CompilationStatus>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  // Filter and process video files
  useEffect(() => {
    const videoFiles = files.filter(file => file.type.startsWith('video/'));
    console.log('SmartCompilation: Processing video files:', videoFiles.length);
    
    const processVideoFiles = async () => {
      const clips: VideoClipData[] = [];
      
      for (let i = 0; i < videoFiles.length; i++) {
        const file = videoFiles[i];
        console.log(`SmartCompilation: Processing file ${i + 1}:`, file.name);
        
        try {
          const thumbnailUrl = await generateVideoThumbnail(file);
          const duration = await getVideoDuration(file);
          
          const clipData = {
            id: `clip-${i}`, // Simple stable ID
            file,
            thumbnailUrl,
            duration,
            order: i
          };
          
          console.log(`SmartCompilation: Created clip:`, clipData.id);
          clips.push(clipData);
        } catch (error) {
          console.error(`SmartCompilation: Error processing file ${i + 1}:`, error);
        }
      }
      
      console.log('SmartCompilation: All clips processed:', clips.map(c => c.id));
      setVideoClips(clips);
    };

    if (videoFiles.length >= 2) {
      processVideoFiles();
    } else {
      setVideoClips([]);
      setIsEnabled(false);
    }
  }, [files]);

  // Generate video thumbnail
  const generateVideoThumbnail = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.playsInline = true;
      
      let timeoutId: NodeJS.Timeout;
      let hasResolved = false;
      
      const resolveWithThumbnail = (url: string) => {
        if (hasResolved) return;
        hasResolved = true;
        clearTimeout(timeoutId);
        URL.revokeObjectURL(video.src);
        resolve(url);
      };
      
      const generateThumbnail = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 120;
          canvas.height = 80;
          const ctx = canvas.getContext('2d')!;
          
          // Ensure video has loaded properly
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolveWithThumbnail(thumbnailUrl);
          } else {
            throw new Error('Video dimensions not available');
          }
        } catch (error) {
          console.error('Error generating thumbnail for', file.name, ':', error);
          resolveWithThumbnail(getDefaultThumbnail());
        }
      };
      
      const getDefaultThumbnail = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 80;
        const ctx = canvas.getContext('2d')!;
        
        // Create a simple gradient background
        const gradient = ctx.createLinearGradient(0, 0, 120, 80);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 120, 80);
        
        // Add play icon
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(45, 25);
        ctx.lineTo(45, 55);
        ctx.lineTo(75, 40);
        ctx.closePath();
        ctx.fill();
        
        return canvas.toDataURL('image/jpeg', 0.8);
      };
      
      video.onloadedmetadata = () => {
        if (video.duration > 0) {
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        } else {
          generateThumbnail();
        }
      };
      
      video.onseeked = generateThumbnail;
      video.oncanplay = () => {
        if (!hasResolved && video.currentTime === 0) {
          generateThumbnail();
        }
      };
      
      video.onerror = () => {
        console.error('Video loading error for thumbnail generation:', file.name);
        resolveWithThumbnail(getDefaultThumbnail());
      };
      
      // Timeout fallback
      timeoutId = setTimeout(() => {
        console.warn('Thumbnail generation timeout for:', file.name);
        resolveWithThumbnail(getDefaultThumbnail());
      }, 5000);
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Get video duration
  const getVideoDuration = async (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    console.log('SmartCompilation: Drag end:', result);
    console.log('SmartCompilation: Current videoClips:', videoClips.map(c => c.id));
    
    if (!result.destination) {
      console.log('SmartCompilation: No destination, canceling drag');
      return;
    }
    
    const items = Array.from(videoClips);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property
    const reorderedItems = items.map((item, index) => ({
      ...item,
      order: index
    }));
    
    console.log('SmartCompilation: Reordered items:', reorderedItems.map(c => c.id));
    setVideoClips(reorderedItems);
  };

  // Start compilation process
  const handleStartCompilation = async () => {
    if (videoClips.length < 2) {
      toast({
        title: "Need more videos",
        description: "Please upload at least 2 videos to create a compilation",
        variant: "destructive"
      });
      return;
    }

    setCompilationStatus({
      status: 'processing',
      progress: 0,
      message: 'Preparing videos for AI processing...'
    });

    try {
      // Upload videos to temporary storage for processing
      setCompilationStatus(prev => ({
        ...prev,
        progress: 20,
        message: 'Uploading videos...'
      }));

      const uploadedUrls: string[] = [];
      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i];
        const fileName = `temp-compilation-${Date.now()}-${i}.${clip.file.name.split('.').pop()}`;
        
        const { data, error } = await supabase.storage
          .from('post-media')
          .upload(fileName, clip.file);
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('post-media')
          .getPublicUrl(data.path);
          
        uploadedUrls.push(publicUrl);
      }

      // Call AI compilation edge function
      setCompilationStatus(prev => ({
        ...prev,
        progress: 40,
        message: 'AI is analyzing your clips...'
      }));

      const { data: compilationResult, error } = await supabase.functions.invoke('ai-video-compilation', {
        body: {
          videoUrls: uploadedUrls,
          videoOrder: videoClips.map(clip => clip.order),
          useAiAssist,
          clipDurations: videoClips.map(clip => clip.duration)
        }
      });

      if (error) throw error;

      if (!compilationResult.success) {
        throw new Error(compilationResult.error || 'Compilation failed');
      }

      setCompilationStatus(prev => ({
        ...prev,
        progress: 80,
        message: 'Finalizing your highlight reel...'
      }));

      // For HLS streams, we'll create a mock file and pass the URL
      // The parent component will handle the HLS stream URL directly
      const compiledFile = new File([''], 'highlight-compilation.m3u8', {
        type: 'application/vnd.apple.mpegurl'
      });
      
      // Store the actual stream URL on the file object for parent component
      (compiledFile as any).streamUrl = compilationResult.compiledVideoUrl;

      setCompilationStatus({
        status: 'complete',
        progress: 100,
        message: 'Compilation complete! 🎉',
        compiledVideoUrl: compilationResult.compiledVideoUrl,
        suggestedCaption: compilationResult.suggestedCaption
      });

      // Clean up temporary files
      for (const url of uploadedUrls) {
        const path = url.split('/').pop();
        if (path) {
          await supabase.storage.from('post-media').remove([path]);
        }
      }

      // Notify parent component
      onCompilationComplete(compiledFile, compilationResult.suggestedCaption);
      
      toast({
        title: "Compilation complete!",
        description: "Your AI-powered highlight reel is ready",
      });

    } catch (error) {
      console.error('Compilation error:', error);
      setCompilationStatus({
        status: 'error',
        progress: 0,
        message: 'Compilation failed',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      
      toast({
        title: "Compilation failed",
        description: error instanceof Error ? error.message : 'Please try again',
        variant: "destructive"
      });
    }
  };

  // Reset compilation
  const handleReset = () => {
    setCompilationStatus({
      status: 'idle',
      progress: 0,
      message: ''
    });
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't show if less than 2 videos
  const videoFiles = files.filter(file => file.type.startsWith('video/'));
  if (videoFiles.length < 2) {
    return null;
  }

  return (
    <div className="space-y-6 pt-6 border-t border-gray-100">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Smart Compilation</h3>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            disabled={disabled || compilationStatus.status === 'processing'}
          />
        </div>

        <p className="text-sm text-gray-600">
          Let AI create a highlight reel from your {videoFiles.length} video clips
        </p>

        {/* Compilation Interface */}
        {isEnabled && (
          <div className="space-y-6">
            
            {/* AI Assist Toggle */}
            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Wand2 className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900">AI Assist</p>
                  <p className="text-sm text-gray-600">Let AI choose the best moments automatically</p>
                </div>
              </div>
              <Switch
                checked={useAiAssist}
                onCheckedChange={setUseAiAssist}
                disabled={disabled || compilationStatus.status === 'processing'}
              />
            </div>

            {/* Video Clips Preview & Reorder */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Clip Order</p>
              
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="video-clips" direction="horizontal">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex gap-3 overflow-x-auto pb-2"
                    >
                      {videoClips.map((clip, index) => (
                        <Draggable key={`${clip.id}-${clip.file.name}`} draggableId={`${clip.id}-${clip.file.name}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`flex-shrink-0 relative cursor-grab active:cursor-grabbing ${
                                snapshot.isDragging ? 'opacity-75 transform rotate-3 scale-105 z-50' : ''
                              }`}
                              style={{
                                ...provided.draggableProps.style,
                                transform: snapshot.isDragging 
                                  ? `${provided.draggableProps.style?.transform} rotate(3deg) scale(1.05)`
                                  : provided.draggableProps.style?.transform
                              }}
                            >
                              <div className={`w-24 h-16 rounded-lg overflow-hidden relative transition-all duration-200 ${
                                snapshot.isDragging 
                                  ? 'border-2 border-purple-500 shadow-lg' 
                                  : 'border-2 border-gray-200 hover:border-purple-300'
                              }`}>
                                <img
                                  src={clip.thumbnailUrl}
                                  alt={`Clip ${index + 1}`}
                                  className="w-full h-full object-cover bg-gray-100"
                                  onError={(e) => {
                                    console.error('Thumbnail failed to load for clip:', clip.id);
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                  {formatDuration(clip.duration)}
                                </div>
                                <div className="absolute top-1 left-1 bg-purple-600 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                                  {index + 1}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <p className="text-xs text-gray-500">
                Drag to reorder clips • AI will auto-trim to ~3-6 seconds each
              </p>
            </div>

            {/* Compilation Status */}
            {compilationStatus.status !== 'idle' && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{compilationStatus.message}</p>
                  {compilationStatus.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  )}
                </div>
                
                {compilationStatus.status === 'processing' && (
                  <Progress value={compilationStatus.progress} className="w-full" />
                )}
                
                {compilationStatus.status === 'error' && (
                  <p className="text-sm text-red-600">{compilationStatus.error}</p>
                )}
                
                {compilationStatus.status === 'complete' && compilationStatus.compiledVideoUrl && (
                  <div className="space-y-3">
                    <video
                      src={compilationStatus.compiledVideoUrl}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '200px' }}
                    />
                    
                    {compilationStatus.suggestedCaption && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Suggested Caption:</p>
                        <p className="text-sm text-blue-800">{compilationStatus.suggestedCaption}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {compilationStatus.status === 'idle' && (
                <Button
                  onClick={handleStartCompilation}
                  disabled={disabled || videoClips.length < 2}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Create Compilation
                </Button>
              )}
              
              {compilationStatus.status === 'complete' && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Another
                </Button>
              )}
              
              {compilationStatus.status === 'error' && (
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartCompilation;