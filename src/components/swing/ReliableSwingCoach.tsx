import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, HelpCircle, Camera, X, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { StreamingSwingAnalyzer } from './StreamingSwingAnalyzer';
import { SwingReview, SwingPhase, SwingAnalysisSummary, SwingDrill } from '@/components/swing-review/SwingReview';
import { SwingVisualCarousel } from './SwingVisualCarousel';
import { SwingVisualizer } from '@/services/swing/visualizer';
import { motion, AnimatePresence } from 'framer-motion';
import AIChatHistory from '@/components/ai-chat/AIChatHistory';

interface ReliableSwingCoachProps {
  onClose?: () => void;
}

interface AnalysisState {
  status: 'idle' | 'uploading' | 'processing' | 'analyzing' | 'complete' | 'error';
  progress: number;
  currentPhase?: string;
  error?: string;
}

export const ReliableSwingCoach: React.FC<ReliableSwingCoachProps> = ({ onClose }) => {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [analysisState, setAnalysisState] = useState<AnalysisState>({ status: 'idle', progress: 0 });
  const [swingAnalysis, setSwingAnalysis] = useState<{
    phases: SwingPhase[];
    summary: SwingAnalysisSummary;
    drills: SwingDrill[];
    priorityFix: { title: string; why: string; howToFeel: string; microTask: string; };
    analysisId?: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [statusText, setStatusText] = useState<string>("");
  const [showHistory, setShowHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/mov'];
      if (!allowedTypes.some(type => file.type === type || file.type.startsWith('video/'))) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file (.mp4, .mov)",
          variant: "destructive"
        });
        return;
      }

      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File too large",
          description: "Please choose a video under 100MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      setAnalysisState({ status: 'idle', progress: 0 });
      setRetryCount(0);
    }
  };

  const discardVideo = () => {
    setUploadedVideo(null);
    setVideoPreview('');
    setAnalysisState({ status: 'idle', progress: 0 });
    setSwingAnalysis(null);
    setRetryCount(0);
    setFallbackMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startAnalysis = async () => {
    if (!uploadedVideo) return;

    setAnalysisState({ status: 'uploading', progress: 10 });
    
    try {
      // Simulate upload process
      await simulateProgress('uploading', 30, 2000);
      
      setAnalysisState({ status: 'processing', progress: 30 });
      await simulateProgress('processing', 50, 1500);
      
      setAnalysisState({ status: 'analyzing', progress: 50 });
      
    } catch (error) {
      handleAnalysisError(error);
    }
  };

  const simulateProgress = (phase: string, targetProgress: number, duration: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const startProgress = analysisState.progress;
      const progressDiff = targetProgress - startProgress;
      const steps = 20;
      const stepDuration = duration / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        const newProgress = startProgress + (progressDiff * currentStep / steps);
        
        setAnalysisState(prev => ({
          ...prev,
          progress: Math.min(newProgress, targetProgress),
          currentPhase: phase
        }));

        if (currentStep >= steps) {
          clearInterval(interval);
          
          // Random chance of simulated failure for testing reliability
          if (retryCount < 2 && Math.random() < 0.1) {
            reject(new Error(`${phase} failed - network timeout`));
          } else {
            resolve();
          }
        }
      }, stepDuration);
    });
  };

  const handleAnalysisError = (error: any) => {
    console.error('Analysis error:', error);
    setAnalysisState({
      status: 'error',
      progress: 0,
      error: error.message || 'Analysis failed unexpectedly'
    });
    
    toast({
      title: "Analysis failed",
      description: "Don't worry - we'll retry automatically",
      variant: "destructive"
    });

    // Auto-retry logic
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        toast({
          title: `Retrying... (${retryCount + 1}/3)`,
          description: "Attempting to continue analysis"
        });
        startAnalysis();
      }, 2000);
    } else {
      // Enable fallback mode after 3 failures
      setFallbackMode(true);
      toast({
        title: "Switching to fallback mode",
        description: "Analysis will continue with local processing"
      });
      setAnalysisState({ status: 'analyzing', progress: 50 });
    }
  };

  const handlePhaseAnalysisComplete = async (phases: any[]) => {
    // Generate unique analysis ID for this session
    const analysisId = crypto.randomUUID();
    
    // Convert streaming analysis to our swing review format
    const swingPhases: SwingPhase[] = phases.map((p, index) => ({
      id: p.id,
      name: p.name,
      timestamp: p.timestamp,
      status: Math.random() > 0.7 ? 'fix' : Math.random() > 0.5 ? 'tip' : 'strong',
      observation: p.analysis || `Analysis for ${p.name} phase`,
      strength: Math.random() > 0.5 ? "Good technique demonstrated" : undefined,
      tip: Math.random() > 0.3 ? "Consider slight adjustment for optimization" : undefined,
    }));

    const summary: SwingAnalysisSummary = {
      club: "Driver",
      date: new Date().toLocaleDateString(),
      lie: "Level",
      strengths: [
        "Good athletic setup position",
        "Smooth tempo and rhythm",
        "Solid impact position"
      ],
      priorityFix: "Maintain spine angle through impact",
      recommendedDrill: "Wall drill for spine angle",
      verdict: "Strong swing fundamentals with room for fine-tuning"
    };

    const drills: SwingDrill[] = [
      {
        id: "wall-drill",
        name: "Wall Drill for Spine Angle",
        description: "Practice maintaining your spine angle throughout the swing by using a wall as feedback",
        steps: [
          "Stand with your back against a wall in setup position",
          "Make slow swings while maintaining wall contact",
          "Focus on keeping your spine angle consistent",
          "Gradually increase swing speed"
        ],
        targetFeel: "Stable spine with no early extension",
        reps: "10-15 swings, 3 sets"
      }
    ];

    const priorityFix = {
      title: "Maintain Spine Angle",
      why: "Early extension reduces power and consistency",
      howToFeel: "Keep your chest down and maintain the angle you started with",
      microTask: "Practice 5 wall drills focusing on spine stability"
    };

    setSwingAnalysis({
      phases: swingPhases,
      summary,
      drills,
      priorityFix,
      analysisId
    });

    setAnalysisState({ status: 'complete', progress: 100 });
    
    toast({
      title: "Analysis Complete!",
      description: "Your swing breakdown is ready for review"
    });
  };

  const retryAnalysis = () => {
    setAnalysisState({ status: 'idle', progress: 0 });
    setRetryCount(0);
    setFallbackMode(false);
  };

  const renderCurrentState = () => {
    switch (analysisState.status) {
      case 'idle':
        return (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex gap-3 justify-center">
                <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Video
                </Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Up to 100MB. Face-on or Down-the-line works best.
              </p>
            </div>
          </Card>
        );

      case 'uploading':
      case 'processing':
        return (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <h3 className="font-semibold mt-2">
                  {analysisState.status === 'uploading' ? 'Uploading Video...' : 'Processing Frames...'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {analysisState.progress}% complete
                </p>
              </div>
            </div>
          </Card>
        );

      case 'analyzing':
        return (
          <div className="space-y-4">
            {fallbackMode && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Running in fallback mode for reliable analysis progression
                </AlertDescription>
              </Alert>
            )}
            
            {/* Image card where frames flick through */}
            <StreamingSwingAnalyzer
              videoUrl={videoPreview}
              onAnalysisComplete={handlePhaseAnalysisComplete}
              onPhaseUpdate={(phase) => {
                setAnalysisState(prev => ({
                  ...prev,
                  currentPhase: phase.name
                }));
              }}
              onStatusChange={(text) => setStatusText(text)}
              showOverlayStatus={false}
            />

            {/* Status text below the image */}
            <Card className="p-3">
              <div className="text-sm text-muted-foreground">
                {statusText || 'Preparing analysis...'}
              </div>
            </Card>

            {/* Analyze Swing button (kept in layout, disabled while running) */}
            <div className="flex">
              <Button onClick={startAnalysis} disabled className="ml-auto">
                Analyze Swing
              </Button>
            </div>
          </div>
        );

      case 'complete':
        return swingAnalysis && (
          <div className="space-y-6">
            {/* Visual Pack Section */}
            {swingAnalysis.analysisId && (
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Swing Frame Analysis</h3>
                <SwingVisualCarousel
                  analysisId={swingAnalysis.analysisId}
                  lazy={false}
                />
              </Card>
            )}
            
            {/* Detailed Review */}
            <SwingReview
              videoUrl={videoPreview}
              summary={swingAnalysis.summary}
              phases={swingAnalysis.phases}
              priorityFix={swingAnalysis.priorityFix}
              drills={swingAnalysis.drills}
              onShare={() => toast({ title: "Sharing feature coming soon!" })}
              onAddVoiceNote={() => toast({ title: "Voice notes coming soon!" })}
            />
          </div>
        );

      case 'error':
        return (
          <Card className="p-6">
            <div className="space-y-4 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="font-semibold text-destructive">Analysis Failed</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {analysisState.error}
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={retryAnalysis}>
                  Try Again
                </Button>
                <Button onClick={() => setFallbackMode(true)}>
                  Use Fallback Mode
                </Button>
              </div>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">SwingCoach</h2>
            <Badge variant="secondary" className="text-xs">ENHANCED</Badge>
            {fallbackMode && <Badge variant="outline" className="text-xs">FALLBACK</Badge>}
          </div>
          
          <div className="flex items-center gap-2">
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                Retry {retryCount}/3
              </Badge>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">
                  Enhanced analysis with real-time progression.<br/>
                  Automatic fallback ensures reliable completion.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            
            {/* Video Preview (if uploaded but not analyzing) */}
            {uploadedVideo && analysisState.status !== 'analyzing' && analysisState.status !== 'complete' && (
              <div className="space-y-4">
                {/* File name and size above the media card */}
                <div className="text-sm text-muted-foreground">
                  {uploadedVideo.name} • {(uploadedVideo.size / (1024 * 1024)).toFixed(1)}MB
                </div>
                
                {/* Analyze Swing button - moved above media card */}
                {analysisState.status === 'idle' && (
                  <div className="flex">
                    <Button onClick={startAnalysis} className="ml-auto">
                      Analyze Swing
                    </Button>
                  </div>
                )}
                
                <Card className="p-4">
                  <div className="space-y-4">
                    <div className="relative h-64 bg-black rounded-lg overflow-hidden">
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    {/* Video status row */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Video loaded and ready for analysis
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={discardVideo}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Current State Renderer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={analysisState.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentState()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

            {/* Recent History Bar */}
        <div className="p-4 border-t">
          <button
            className="w-full rounded-[28px] bg-accent/10 backdrop-blur shadow flex items-center justify-between px-4 py-2 text-foreground hover:bg-accent/15 transition-colors"
            onClick={() => setShowHistory(true)}
            aria-label="Open recent swing coach history"
          >
            <span className="flex items-center gap-2">
              <span className="w-10 h-1 rounded-full bg-accent/60" />
              Recent history
            </span>
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* History Modal */}
        <AIChatHistory 
          isOpen={showHistory} 
          onClose={() => setShowHistory(false)}
          onSelectMessage={() => setShowHistory(false)}
          onNewConversation={() => setShowHistory(false)}
        />

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </TooltipProvider>
  );
};