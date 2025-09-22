import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, HelpCircle, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { AiFeedbackBlock } from '@/components/swing/AiFeedbackBlock';
import { ProgressStrip } from '@/components/swing/ProgressStrip';
import { CoachCta } from '@/components/swing/CoachCta';
import { SwingVisualCarousel } from '@/components/swing/SwingVisualCarousel';
import { CoachPickerModal } from '@/components/swing/CoachPickerModal';
import { SwingVisualizer } from '@/services/swing/visualizer';
import { SwingVisual } from '@/types/swing';

interface SwingAnalysis {
  id: string;
  save_card: string;
  tags: string[];
  category: string;
  content: string;
  videoThumbnail?: string;
  videoId?: string;
  videoUrl?: string;
  timestamp: Date;
}

interface SwingCoachProps {
  onClose?: () => void;
}

export const SwingCoach: React.FC<SwingCoachProps> = ({ onClose }) => {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'extracting' | 'analyzing' | 'saving' | 'preparing' | 'complete'>('extracting');
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<SwingAnalysis | null>(null);
  const [visuals, setVisuals] = useState<SwingVisual[]>([]);
  const [isVisualsLoading, setIsVisualsLoading] = useState(false);
  const [showCoachPicker, setShowCoachPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadVideo, uploading } = useCloudflareStream();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = ['video/mp4', 'video/quicktime', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.some(type => file.type === type || file.type.startsWith('video/') || file.type.startsWith('image/'))) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video (.mp4, .mov) or image (.jpg, .png) file",
          variant: "destructive"
        });
        return;
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose a file under 50MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const handleRecord = () => {
    // Open camera for recording
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      })
        .then(stream => {
          toast({
            title: "Camera access",
            description: "Recording feature coming soon! Use Upload for now.",
          });
          stream.getTracks().forEach(track => track.stop());
        })
        .catch(error => {
          toast({
            title: "Camera unavailable",
            description: "Please use the Upload option instead",
            variant: "destructive"
          });
        });
    } else {
      toast({
        title: "Camera not supported",
        description: "Please use the Upload option instead",
        variant: "destructive"
      });
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const discardVideo = () => {
    setUploadedVideo(null);
    setVideoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeSwing = async () => {
    if (!uploadedVideo) return;

    setIsAnalyzing(true);
    setCurrentStep('extracting');
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 1000);

      // Step 1: Extract frames
      setCurrentStep('extracting');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Step 2: Analyze
      setCurrentStep('analyzing');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Step 3: Save
      setCurrentStep('saving');
      
      // Create mock analysis for demo
      const mockAnalysis: SwingAnalysis = {
        id: `analysis_${Date.now()}`,
        save_card: 'Swing Analysis',
        tags: ['Driver', 'Face-on'],
        category: 'swing_analysis',
        content: `🏌️ **Top Findings:**

• **Setup Position**: Good athletic posture with slight knee flex. Spine angle could be more tilted away from target.

• **Backswing**: Nice wide takeaway but club gets slightly across the line at the top. Try to keep the club more on plane.

• **Downswing**: Good weight transfer but early extension through impact zone. Focus on maintaining spine angle.

• **Impact**: Solid contact but hands are slightly behind the ball. Work on getting hands ahead at impact.

• **Follow-through**: Good balance and full extension through the ball.

**Key Improvement Areas:**
1. Work on maintaining spine angle through impact
2. Focus on getting hands ahead of ball at impact
3. Practice keeping club on plane in backswing

**Recommended Drills:**
- Wall drill for spine angle
- Impact bag work for hand position
- Alignment stick for swing plane`,
        videoUrl: videoPreview,
        timestamp: new Date()
      };

      setAnalysis(mockAnalysis);
      
      // Step 4: Prepare visuals
      setCurrentStep('preparing');
      setIsVisualsLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep('complete');
      
      // Generate mock visuals
      const mockVisuals: SwingVisual[] = [
        {
          id: '1',
          analysisId: mockAnalysis.id,
          frameIndex: 0,
          label: 'P1 Setup',
          overlay: { notes: 'Good athletic posture, slight knee flex' },
          url: videoPreview,
          width: 800,
          height: 600,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          analysisId: mockAnalysis.id,
          frameIndex: 5,
          label: 'P3 Backswing',
          overlay: { notes: 'Club slightly across the line' },
          url: videoPreview,
          width: 800,
          height: 600,
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          analysisId: mockAnalysis.id,
          frameIndex: 10,
          label: 'P6 Impact',
          overlay: { notes: 'Hands slightly behind ball at impact' },
          url: videoPreview,
          width: 800,
          height: 600,
          createdAt: new Date().toISOString()
        }
      ];
      
      setVisuals(mockVisuals);
      setIsVisualsLoading(false);

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCancelAnalysis = () => {
    setIsAnalyzing(false);
    setProgress(0);
    toast({
      title: "Analysis cancelled",
      description: "You can start again anytime"
    });
  };

  const handleExportPack = async () => {
    toast({
      title: "Preparing download",
      description: "Your visual pack will download shortly"
    });
  };

  const renderEmptyState = () => (
    <div className="text-center py-12 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Filming Tips</h3>
        <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
          <p>• Film face-on or down-the-line for best analysis</p>
          <p>• Include your full swing from setup to finish</p>
          <p>• Ensure good lighting and stable camera position</p>
        </div>
      </div>
      
      <div className="w-32 h-24 mx-auto bg-muted/20 rounded-lg flex items-center justify-center">
        <Video className="h-8 w-8 text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">SwingCoach</h2>
            <Badge variant="secondary" className="text-xs">BETA</Badge>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                Upload your swing video for AI analysis.<br/>
                Face-on or down-the-line works best.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            
            {/* Capture/Upload Panel */}
            {!uploadedVideo && !analysis && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={handleRecord}
                      className="gap-2"
                      variant="outline"
                    >
                      <Camera className="h-4 w-4" />
                      Record
                    </Button>
                    <Button
                      onClick={handleUpload}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                  
                  <p className="text-xs text-center text-muted-foreground">
                    Up to 50MB. Face-on or Down-the-line.
                  </p>
                </div>
              </Card>
            )}

            {/* Media Preview */}
            {uploadedVideo && !isAnalyzing && !analysis && (
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    {uploadedVideo.type.startsWith('video/') ? (
                      <video
                        src={videoPreview}
                        controls
                        className="w-full h-full"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={videoPreview}
                        alt="Uploaded swing image"
                        className="w-full h-full object-contain"
                      />
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                      onClick={discardVideo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Video loaded and ready for analysis
                    </div>
                    <Button onClick={analyzeSwing} className="gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Analyze Swing
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Progress Strip */}
            {isAnalyzing && (
              <ProgressStrip
                currentStep={currentStep}
                progress={progress}
                onCancel={currentStep === 'extracting' || currentStep === 'analyzing' ? handleCancelAnalysis : undefined}
              />
            )}

            {/* Results */}
            {analysis && !isAnalyzing && (
              <div className="space-y-6">
                {/* AI Feedback */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">AI Analysis</h3>
                  <AiFeedbackBlock analysis={analysis} defaultCollapsed={true} />
                </div>

                {/* Visual Pack */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Visual Pack</h3>
                  <SwingVisualCarousel
                    visuals={visuals}
                    isLoading={isVisualsLoading}
                    onExport={handleExportPack}
                  />
                </div>

                {/* Coach CTA */}
                <CoachCta
                  analysisId={analysis.id}
                  onOpenCoachPicker={() => setShowCoachPicker(true)}
                />
              </div>
            )}

            {/* Empty State */}
            {!uploadedVideo && !analysis && !isAnalyzing && renderEmptyState()}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Coach Picker Modal */}
        {showCoachPicker && analysis && (
          <CoachPickerModal
            isOpen={showCoachPicker}
            onClose={() => setShowCoachPicker(false)}
            analysisId={analysis.id}
            onShareComplete={() => {
              setShowCoachPicker(false);
              toast({
                title: "Share request sent",
                description: "The coach will receive your swing analysis"
              });
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};