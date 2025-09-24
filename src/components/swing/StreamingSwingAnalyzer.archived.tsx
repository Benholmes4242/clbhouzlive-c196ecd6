import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface SwingPhase {
  id: string;
  name: string;
  frameIndex: number;
  status: 'pending' | 'analyzing' | 'complete';
  analysis?: string;
  thumbnail?: string;
  timestamp: number;
}

interface StreamingSwingAnalyzerProps {
  videoUrl: string;
  onAnalysisComplete: (phases: SwingPhase[]) => void;
  onPhaseUpdate?: (phase: SwingPhase) => void;
  onStatusChange?: (statusText: string) => void;
  showOverlayStatus?: boolean;
}

interface SwingFrame {
  id: string;
  imageData: string;
  timestamp: number;
}

export const StreamingSwingAnalyzer: React.FC<StreamingSwingAnalyzerProps> = ({
  videoUrl,
  onAnalysisComplete,
  onPhaseUpdate,
  onStatusChange,
  showOverlayStatus
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [analysisPhase, setAnalysisPhase] = useState<'extracting' | 'analyzing' | 'complete'>('extracting');
  const [currentAnalyzingPhase, setCurrentAnalyzingPhase] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [swingFrames, setSwingFrames] = useState<SwingFrame[]>([]);
  const [currentFrameImage, setCurrentFrameImage] = useState<string>('');
  
  // Predefined swing phases for analysis progression
  const [phases, setPhases] = useState<SwingPhase[]>([
    { id: 'setup', name: 'Setup', frameIndex: 0, status: 'pending', timestamp: 0 },
    { id: 'takeaway', name: 'Takeaway', frameIndex: 2, status: 'pending', timestamp: 0.3 },
    { id: 'backswing', name: 'Backswing Top', frameIndex: 4, status: 'pending', timestamp: 0.6 },
    { id: 'transition', name: 'Transition', frameIndex: 6, status: 'pending', timestamp: 0.8 },
    { id: 'impact', name: 'Impact', frameIndex: 8, status: 'pending', timestamp: 1.2 },
    { id: 'followthrough', name: 'Follow Through', frameIndex: 9, status: 'pending', timestamp: 1.5 }
  ]);

  // Auto-progression through frames during analysis
  useEffect(() => {
    if (analysisPhase === 'analyzing' && swingFrames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex(prev => {
          const nextIndex = (prev + 1) % 10; // Cycle through 10 frames
          if (swingFrames[nextIndex]) {
            setCurrentFrameImage(swingFrames[nextIndex].imageData);
          }
          return nextIndex;
        });
      }, 800); // Slower progression to match analysis phases

      return () => clearInterval(interval);
    }
  }, [analysisPhase, swingFrames]);

  // Fallback mode auto-progression
  useEffect(() => {
    if (fallbackMode && isPlaying && swingFrames.length > 0) {
      const interval = setInterval(() => {
        setCurrentFrameIndex(prev => {
          const nextIndex = (prev + 1) % 10;
          if (swingFrames[nextIndex]) {
            setCurrentFrameImage(swingFrames[nextIndex].imageData);
          }
          return nextIndex;
        });
      }, 400); // Slightly faster for manual playback

      return () => clearInterval(interval);
    }
  }, [fallbackMode, isPlaying, swingFrames]);

  // Extract frames immediately when component mounts with video
  useEffect(() => {
    if (videoUrl && swingFrames.length === 0) {
      setAnalysisPhase('extracting');
      onStatusChange?.('Extracting frames...');
      extractFramesFromVideo();
    }
  }, [videoUrl]);

  // Start analysis automatically when frames are ready
  useEffect(() => {
    if (analysisPhase === 'extracting' && swingFrames.length > 0) {
      setTimeout(() => {
        setAnalysisPhase('analyzing');
        onStatusChange?.('Analyzing swing...');
        simulateStreamingAnalysis();
      }, 1000);
    }
  }, [swingFrames]);

  const extractFramesFromVideo = async () => {
    const video = videoRef.current;

    // FAST TEST MODE: generate lightweight placeholder frames instantly to validate timing (~0.2s)
    const FAST_TEST = false;
    if (FAST_TEST) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const frames: SwingFrame[] = [];

      canvas.width = 640;
      canvas.height = 480;

      for (let i = 0; i < 10; i++) {
        // simple visual variation per frame
        ctx.fillStyle = `hsl(${(i * 36) % 360} 30% 18%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'white';
        ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, Roboto';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`Frame ${i + 1}`, canvas.width / 2, canvas.height / 2);

        const imageData = canvas.toDataURL('image/jpeg', 0.7);
        frames.push({ id: `frame-${i}`, imageData, timestamp: i });
      }

      setSwingFrames(frames);
      if (frames.length > 0) {
        setCurrentFrameImage(frames[0].imageData);
        setCurrentFrameIndex(0);
      }
      return;
    }

    if (!video) {
      console.error('Video element not found');
      return;
    }

    console.log(`Video URL: ${videoUrl}, duration: ${video.duration}, ready state: ${video.readyState}`);

    // Ensure metadata is ready before seeking
    if (!isFinite(video.duration) || video.duration === 0) {
      console.log('Waiting for video metadata...');
      await new Promise<void>((resolve) => {
        const onMeta = () => {
          console.log(`Video metadata loaded - duration: ${video.duration}, dimensions: ${video.videoWidth}x${video.videoHeight}`);
          video.removeEventListener('loadedmetadata', onMeta);
          resolve();
        };
        video.addEventListener('loadedmetadata', onMeta, { once: true });
      });
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frames: SwingFrame[] = [];

    // Set canvas size based on video
    canvas.width = 640;
    canvas.height = 480;

    // Extract 10 frames
    for (let i = 0; i < 10; i++) {
      const timestamp = (video.duration / 10) * i;

      await new Promise<void>((resolve) => {
        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };
        const onSeeked = () => {
          try {
            console.log(`Extracting frame ${i} at timestamp ${timestamp}, video dimensions: ${video.videoWidth}x${video.videoHeight}`);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            console.log(`Frame ${i} extracted successfully, data length: ${imageData.length}`);
            frames.push({ id: `frame-${i}`, imageData, timestamp });
          } catch (error) {
            console.error(`Failed to extract frame ${i}:`, error);
            // If cross-origin taints the canvas or draw fails, push empty placeholder
            frames.push({ id: `frame-${i}`, imageData: '', timestamp });
          }
          cleanup();
          resolve();
        };
        const onError = () => {
          // fail-soft, push placeholder
          frames.push({ id: `frame-${i}`, imageData: '', timestamp });
          cleanup();
          resolve();
        };

        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        video.currentTime = timestamp;

        // Safety timeout to avoid long stalls
        setTimeout(() => {
          if (video.currentTime !== timestamp) {
            onSeeked();
          }
        }, 300);
      });
    }

    setSwingFrames(frames);
    if (frames.length > 0) {
      setCurrentFrameImage(frames[0].imageData);
      setCurrentFrameIndex(0);
    }
  };

  const simulateStreamingAnalysis = async () => {
    const analysisStartTime = Date.now();
    // Extended timing to ensure better user engagement - minimum 8 seconds total
    const baseDelayPerPhase = 1200; // Increased from 600ms to 1200ms
    const randomVariation = 400; // Increased variation
    
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      setCurrentAnalyzingPhase(phase.name);
      onStatusChange?.(`Analyzing ${phase.name}`);
      
      // Update phase to analyzing
      setPhases(prev => prev.map(p => 
        p.id === phase.id ? { ...p, status: 'analyzing' } : p
      ));

      // Focus video on this phase's frame
      setCurrentFrameIndex(phase.frameIndex);
      
      // Update displayed frame image
      if (swingFrames[phase.frameIndex]) {
        setCurrentFrameImage(swingFrames[phase.frameIndex].imageData);
      }
      
      // Extended analysis time for better engagement
      await new Promise(resolve => setTimeout(resolve, baseDelayPerPhase + Math.random() * randomVariation));
      
      // Generate mock analysis for the phase
      const mockAnalysis = generatePhaseAnalysis(phase);
      
      // Update phase to complete
      const updatedPhase = { ...phase, status: 'complete' as const, analysis: mockAnalysis };
      setPhases(prev => prev.map(p => 
        p.id === phase.id ? updatedPhase : p
      ));
      
      onPhaseUpdate?.(updatedPhase);
      
      // Small delay before next phase
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setAnalysisPhase('complete');
    setCurrentAnalyzingPhase(null);
    onStatusChange?.('Analysis complete');
    
    // Final callback with all completed phases
    setTimeout(() => {
      onAnalysisComplete(phases.map(p => ({ ...p, status: 'complete' as const })));
    }, 150);
  };

  const generatePhaseAnalysis = (phase: SwingPhase): string => {
    const analyses = {
      setup: "Good athletic posture with balanced stance. Slight adjustment needed in spine angle for optimal position.",
      takeaway: "Smooth takeaway with good club path. Maintain the wide arc for better consistency.",
      backswing: "Excellent shoulder turn and club position at the top. Good width and proper plane.",
      transition: "Nice tempo change from backswing to downswing. Good weight transfer initiation.",
      impact: "Solid impact position with good hand-ahead contact. Strong compression through the ball.",
      followthrough: "Complete finish with good balance. Full extension shows good swing mechanics."
    };
    return analyses[phase.id as keyof typeof analyses] || "Analysis complete for this phase.";
  };


  const togglePlayback = () => {
    if (analysisPhase === 'complete') {
      setIsPlaying(!isPlaying);
    }
  };

  const jumpToPhase = (phase: SwingPhase) => {
    setCurrentFrameIndex(phase.frameIndex);
    if (swingFrames[phase.frameIndex]) {
      setCurrentFrameImage(swingFrames[phase.frameIndex].imageData);
    }
    if (videoRef.current) {
      videoRef.current.currentTime = phase.timestamp;
    }
  };

  const enableFallbackMode = () => {
    setFallbackMode(true);
    setIsPlaying(true);
    toast({
      title: "Fallback Mode Enabled",
      description: "Manual frame progression activated"
    });
  };

  const nextFrame = () => {
    setCurrentFrameIndex(prev => {
      const newIndex = Math.min(prev + 1, 9);
      if (swingFrames[newIndex]) {
        setCurrentFrameImage(swingFrames[newIndex].imageData);
      }
      return newIndex;
    });
  };

  const prevFrame = () => {
    setCurrentFrameIndex(prev => {
      const newIndex = Math.max(prev - 1, 0);
      if (swingFrames[newIndex]) {
        setCurrentFrameImage(swingFrames[newIndex].imageData);
      }
      return newIndex;
    });
  };

  const getPhaseProgress = () => {
    const completedPhases = phases.filter(p => p.status === 'complete').length;
    return (completedPhases / phases.length) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Main Video/Frame Display */}
      <Card className="relative overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-muted/20 to-muted/40 flex items-center justify-center relative">
          {/* Video Element (hidden, used for timing reference) */}
          <video
            ref={videoRef}
            src={videoUrl}
            className="absolute inset-0 w-full h-full object-contain opacity-0"
            muted
          />
          
          {/* Frame Display */}
          <div className="w-full h-full flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden">
            {currentFrameImage ? (
              <img 
                src={currentFrameImage} 
                alt={`Swing frame ${currentFrameIndex + 1}`}
                className="w-full h-full object-contain"
              />
            ) : analysisPhase === 'extracting' ? (
              <div className="text-center space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Extracting frames from video...</p>
              </div>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-primary">{currentFrameIndex + 1}</span>
                </div>
                <p className="text-sm text-muted-foreground">Frame {currentFrameIndex + 1} of 10</p>
              </div>
            )}
          </div>

          {/* Analysis Status Overlay */}
          <AnimatePresence>
            {analysisPhase === 'analyzing' && currentAnalyzingPhase && showOverlayStatus !== false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-4 left-4 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Analyzing {currentAnalyzingPhase}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Manual Controls (for fallback mode or completed analysis) */}
          {(fallbackMode || analysisPhase === 'complete') && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
              <Button variant="ghost" size="icon" onClick={prevFrame} disabled={currentFrameIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={nextFrame} disabled={currentFrameIndex === 9}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Analysis Progress */}
      {analysisPhase !== 'extracting' && (
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Analysis Progress</h3>
              <span className="text-sm text-muted-foreground">
                {phases.filter(p => p.status === 'complete').length} of {phases.length} phases complete
              </span>
            </div>
            <Progress value={getPhaseProgress()} className="h-2" />
          </div>
        </Card>
      )}

      {/* Phase Timeline */}
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold">Swing Phases</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {phases.map((phase, index) => (
              <motion.button
                key={phase.id}
                onClick={() => jumpToPhase(phase)}
                disabled={phase.status === 'pending'}
                className={`p-3 rounded-lg text-left transition-colors ${
                  currentFrameIndex === phase.frameIndex
                    ? 'bg-primary text-primary-foreground'
                    : phase.status === 'complete'
                    ? 'bg-muted/50 hover:bg-muted'
                    : phase.status === 'analyzing'
                    ? 'bg-primary/20 animate-pulse'
                    : 'bg-muted/20 opacity-50'
                } ${phase.status !== 'pending' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                whileHover={phase.status !== 'pending' ? { scale: 1.02 } : {}}
                whileTap={phase.status !== 'pending' ? { scale: 0.98 } : {}}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{phase.name}</span>
                  <Badge variant={
                    phase.status === 'complete' ? 'default' : 
                    phase.status === 'analyzing' ? 'secondary' : 'outline'
                  } className="text-xs">
                    {phase.status === 'complete' ? '✓' : 
                     phase.status === 'analyzing' ? '...' : '○'}
                  </Badge>
                </div>
                <p className="text-xs opacity-75">Frame {phase.frameIndex + 1}</p>
                {phase.analysis && (
                  <p className="text-xs mt-1 line-clamp-2">{phase.analysis}</p>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </Card>


      {analysisPhase === 'analyzing' && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={enableFallbackMode} className="flex-1">
            Enable Manual Control
          </Button>
        </div>
      )}

      {analysisPhase === 'complete' && !fallbackMode && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFallbackMode(true)}>
            Manual Frame Control
          </Button>
          <Button onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? 'Pause' : 'Play'} Progression
          </Button>
        </div>
      )}
    </div>
  );
};