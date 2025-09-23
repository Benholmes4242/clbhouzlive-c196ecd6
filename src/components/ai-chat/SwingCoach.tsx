import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, Play, Trash2, Send, BookOpen, MoreHorizontal, Share2, Plus, Mic, MapPin, HelpCircle, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import ChatMessageComponent from './ChatMessage';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { SwingAnalysisLoader } from './SwingAnalysisLoader';
import AIChatHistory from './AIChatHistory';
import { CoachPromptInline } from '@/components/swing/CoachPromptInline';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { SwingVisualCarousel } from '@/components/swing/SwingVisualCarousel';
import { SwingVisualizer } from '@/services/swing/visualizer';
import { SwingVisual } from '@/types/swing';
import { CoachPickerModal } from '@/components/swing/CoachPickerModal';
import { AiFeedbackBlock } from '@/components/swing/AiFeedbackBlock';
import { ProgressStrip } from '@/components/swing/ProgressStrip';
import { CoachCta } from '@/components/swing/CoachCta';

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
  voiceNote?: string;
  conversation?: Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: Date;
  }>;
}

interface SwingCoachProps {
  onClose?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
  analysisText?: string;
  onAnalysisTextChange?: (text: string) => void;
}

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: string;
  metadata?: any;
  videoPreview?: string;
  videoFileName?: string;
  videoType?: string;
  videoId?: string;
  videoUrl?: string;
}

const SwingCoach: React.FC<SwingCoachProps> = ({
  onClose,
  isRecording: parentIsRecording,
  isProcessing: parentIsProcessing,
  startRecording: parentStartRecording,
  stopRecording: parentStopRecording,
  analysisText: externalAnalysisText,
  onAnalysisTextChange,
}) => {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoPoster, setVideoPoster] = useState<string>(''); // Add poster for mobile
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [analyses, setAnalyses] = useState<SwingAnalysis[]>([]);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  
  const [currentAnalysis, setCurrentAnalysis] = useState<SwingAnalysis | null>(null);
  const [isAddingVoiceNote, setIsAddingVoiceNote] = useState(false);
  const [currentGolfClub, setCurrentGolfClub] = useState<string>('');
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadVideo, uploading } = useCloudflareStream();

  // Auto-scroll for messages
  const messagesAutoScroll = useAutoScroll({
    dependencies: [messages],
    enabled: true,
    direction: 'bottom' // Live chat messages are added at the bottom
  });
  
  // Helper functions for Cloudflare Stream URLs
  const getPlaybackUrl = (videoId: string): string => {
    return generateStreamHlsUrl(videoId);
  };
  
  const getThumbnailUrl = (videoId: string): string => {
    return generateStreamThumbnailUrl(videoId);
  };

  // Load saved analyses from Supabase
  useEffect(() => {
    loadAnalysesFromSupabase();
  }, []);

  const loadAnalysesFromSupabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading analyses:', error);
        return;
      }

      if (data) {
        const formattedAnalyses = data.map(analysis => {
          const analysisResults = analysis.analysis_results as any;
          const swingContextData = analysis.swing_context as string;
          
          let swingContext: any = {};
          try {
            if (swingContextData) {
              swingContext = JSON.parse(swingContextData);
            }
          } catch (e) {
            console.error('Error parsing swing context:', e);
          }

          return {
            id: analysis.id,
            save_card: analysisResults?.metadata?.save_card || 'Swing Analysis',
            tags: analysisResults?.metadata?.tags || [],
            category: analysisResults?.metadata?.category || 'Swing',
            content: analysisResults?.aiResponse || '',
            videoUrl: analysis.video_url,
            timestamp: new Date(analysis.created_at),
            conversation: swingContext.conversation || [],
            videoId: swingContext.videoId || null,
            videoThumbnail: swingContext.videoThumbnail || null
          };
        });
        setAnalyses(formattedAnalyses);
      }
    } catch (error) {
      console.error('Error loading analyses from Supabase:', error);
    }
  };

  useEffect(() => {
    const handleSwingAnalysis = (event: any) => {
      const analysisText = event.detail?.analysisText || '';
      // Allow analysis with video even if no text is provided
      if (uploadedVideo || analysisText.trim()) {
        setAnalysisText(analysisText);
        analyzeSwing();
      }
    };

    window.addEventListener('triggerSwingAnalysis', handleSwingAnalysis);
    return () => window.removeEventListener('triggerSwingAnalysis', handleSwingAnalysis);
  }, [uploadedVideo]);


  const detectGolfClub = (text: string): string | null => {
    const golfClubPatterns = [
      /(?:today|playing|at|visiting)\s+(?:i'm\s+)?(?:playing\s+)?(?:at\s+)?([A-Za-z\s&'.-]+(?:golf|country|club|links|course|resort))/gi,
      /(?:i'm|we're|playing)\s+(?:at\s+)?([A-Za-z\s&'.-]+(?:golf|country|club|links|course|resort))/gi,
      /([A-Za-z\s&'.-]+(?:golf|country|club|links|course|resort))/gi
    ];
    
    for (const pattern of golfClubPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1]?.trim() || null;
      }
    }
    return null;
  };

  const extractHoleNumber = (text: string): number | null => {
    const holePatterns = [
      /hole\s+(\d+)/gi,
      /(\d+)(?:st|nd|rd|th)\s+hole/gi,
      /on\s+(\d+)/gi
    ];
    
    for (const pattern of holePatterns) {
      const match = text.match(pattern);
      if (match) {
        const holeNum = parseInt(match[1]);
        if (holeNum >= 1 && holeNum <= 18) {
          return holeNum;
        }
      }
    }
    return null;
  };

  const saveToCaddieLogs = async (text: string, golfClub?: string, holeNumber?: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const logData = {
        user_id: user.id,
        content: text,
        transcription: text,
        course_name: golfClub || currentGolfClub || null,
        tags: holeNumber ? [`hole-${holeNumber}`] : [],
        location_name: golfClub || currentGolfClub || null
      };

      const { error } = await supabase
        .from('caddie_logs')
        .insert([logData]);

      if (error) throw error;

      toast({
        title: "Note saved",
        description: `Saved to ${golfClub || currentGolfClub || 'caddie logs'}${holeNumber ? ` (Hole ${holeNumber})` : ''}`,
      });
    } catch (error) {
      console.error('Error saving to caddie logs:', error);
    }
  };

  const handleVoiceNoteComplete = useCallback((transcribedText: string) => {
    if (currentAnalysis) {
      // Update current analysis with voice note
      const updatedAnalysis = {
        ...currentAnalysis,
        voiceNote: transcribedText
      };
      setCurrentAnalysis(updatedAnalysis);
      
      toast({
        title: "Voice note added",
        description: "Your note has been attached to this analysis",
      });
    } else {
      // Handle regular voice notes for caddie logs
      const detectedGolfClub = detectGolfClub(transcribedText);
      const holeNumber = extractHoleNumber(transcribedText);
      
      if (detectedGolfClub) {
        setCurrentGolfClub(detectedGolfClub);
        toast({
          title: "Golf club detected",
          description: `Now logging notes for ${detectedGolfClub}`,
        });
      }
      
      // Add to chat messages
      const voiceMessage: ChatMessageData = {
        id: Date.now().toString(),
        type: 'user',
        content: transcribedText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, voiceMessage]);
      
      // Save to caddie logs
      saveToCaddieLogs(transcribedText, detectedGolfClub || undefined, holeNumber || undefined);
    }
    setIsAddingVoiceNote(false);
    setIsVoiceNoteRecording(false);
  }, [currentAnalysis, analyses, toast, currentGolfClub]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscriptionComplete: handleVoiceNoteComplete
  });

  const generateVideoPoster = async (videoFile: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        // Set canvas size for mobile optimization
        const isMobile = window.innerWidth <= 768;
        const maxWidth = isMobile ? 600 : 800;
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
        
        // Capture frame at 10% of video duration for better preview
        video.currentTime = video.duration * 0.1;
        
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const posterData = canvas.toDataURL('image/jpeg', 0.8);
            resolve(posterData);
          } else {
            resolve(''); // Fallback
          }
        };
      };
      
      video.onerror = () => {
        console.warn('Could not generate video poster');
        resolve(''); // Fallback to empty poster
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type - Accept video (.mp4, .mov) and image files
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
          description: "Video too large; we'll analyze key frames instead.",
        });
        // Continue with upload despite size warning
      }

      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      
      // Generate poster for mobile video thumbnail
      if (file.type.startsWith('video/')) {
        try {
          const poster = await generateVideoPoster(file);
          setVideoPoster(poster);
        } catch (error) {
          console.warn('Failed to generate video poster:', error);
          setVideoPoster('');
        }
      } else {
        setVideoPoster(''); // Clear poster for images
      }
    }
  };

  const discardVideo = () => {
    setUploadedVideo(null);
    setVideoPreview('');
    setVideoPoster(''); // Clear poster too
    setAnalysisText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractFramesFromVideo = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      
      // Mobile-specific settings
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';
      
      // Add timeout for mobile devices
      const timeout = setTimeout(() => {
        console.error('Video frame extraction timed out');
        reject(new Error('Video processing timed out'));
      }, 45000); // Extended timeout for 20 frames
      
      // Enhanced error handling
      video.onerror = (e) => {
        clearTimeout(timeout);
        console.error('Video error:', e);
        reject(new Error('Video failed to load'));
      };
      
      video.onloadedmetadata = () => {
        console.log('Video metadata loaded:', {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration
        });
        
        // Mobile-optimized canvas size but keep quality
        const isMobile = window.innerWidth <= 768;
        const maxWidth = isMobile ? 800 : 1280; // Increased mobile resolution
        canvas.width = Math.min(video.videoWidth, maxWidth);
        canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
        
        const duration = video.duration;
        
        // Keep 20 frames for both mobile and desktop for optimal analysis
        const framePositions = [
          0.03, // Initial setup/Address (P1)
          0.08, // Settled address position
          0.13, // Takeaway initiation
          0.18, // Early takeaway
          0.23, // Mid takeaway (P2)
          0.28, // Late takeaway
          0.33, // Transition to backswing
          0.38, // Early backswing
          0.43, // Shaft parallel back (P3)
          0.48, // Three-quarter back
          0.53, // Near top of backswing
          0.58, // Top of backswing (P4)
          0.63, // Transition/Early downswing
          0.68, // Downswing acceleration
          0.73, // Mid downswing (P5)
          0.78, // Approaching impact
          0.83, // Pre-impact position
          0.87, // Impact (P6)
          0.91, // Early release/follow-through (P7)
          0.95  // Full finish (P8/P9)
        ];
        
        const positions = framePositions.map(pos => pos * duration);
        let frameIndex = 0;
        let seekTimeout: NodeJS.Timeout;
        
        // Mobile optimization: Process frames in batches to prevent memory issues
        const batchSize = isMobile ? 4 : 20; // Process 4 frames at a time on mobile
        let currentBatch = 0;
        
        const processBatch = () => {
          const batchStart = currentBatch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, positions.length);
          
          if (batchStart >= positions.length) {
            clearTimeout(timeout);
            console.log(`Successfully extracted ${frames.length} frames`);
            resolve(frames);
            return;
          }
          
          frameIndex = batchStart;
          captureFrame();
        };
        
        const captureFrame = () => {
          const batchStart = currentBatch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, positions.length);
          
          if (frameIndex >= batchEnd) {
            // Batch complete, clean up memory and start next batch
            if (isMobile) {
              // Force garbage collection on mobile by nullifying references
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
              // Small delay to allow memory cleanup
              setTimeout(() => {
                currentBatch++;
                processBatch();
              }, 200);
            } else {
              currentBatch++;
              processBatch();
            }
            return;
          }
          
          // Clear any existing seek timeout
          if (seekTimeout) clearTimeout(seekTimeout);
          
          video.currentTime = positions[frameIndex];
          
          // Backup timeout for seek operation
          seekTimeout = setTimeout(() => {
            console.warn(`Seek timeout for frame ${frameIndex + 1}, skipping...`);
            frameIndex++;
            captureFrame();
          }, 4000); // Longer timeout for mobile
          
          video.onseeked = () => {
            clearTimeout(seekTimeout);
            
            if (ctx) {
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                // Optimized quality: slightly lower on mobile but still good
                const quality = isMobile ? 0.75 : 0.8;
                const frameData = canvas.toDataURL('image/jpeg', quality);
                frames.push(frameData);
                console.log(`Captured frame ${frameIndex + 1}/${positions.length} (Batch ${currentBatch + 1})`);
                
                // Clear canvas immediately after capture on mobile
                if (isMobile) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
              } catch (e) {
                console.error('Canvas draw error:', e);
              }
            }
            
            frameIndex++;
            // Slightly longer delay between frames for mobile stability
            setTimeout(captureFrame, isMobile ? 150 : 50);
          };
        };
        
        // Start processing first batch
        setTimeout(processBatch, 500);
      };
      
      // Enhanced data handling for mobile
      video.oncanplay = () => {
        console.log('Video can play');
      };
      
      video.src = URL.createObjectURL(videoFile);
      video.load(); // Explicitly load the video
    });
  };

  const analyzeSwing = async () => {
    if (!uploadedVideo && !analysisText.trim()) return;

    // Post user message to chat immediately
    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: analysisText.trim() || 'Please analyze my swing',
      timestamp: new Date(),
      videoPreview: uploadedVideo ? videoPreview : undefined,
      videoFileName: uploadedVideo?.name,
      videoType: uploadedVideo?.type
    };
    setMessages(prev => [...prev, userMessage]);
    setAnalysisText('');

    console.log('🚀 Starting swing analysis with:', {
      hasVideo: !!uploadedVideo,
      videoType: uploadedVideo?.type,
      message: userMessage.content
    });

    setIsAnalyzing(true);
    setAnalysisStatus('Extracting frames from video...');
    setExtractedFrames([]);
    try {
      let extractedFrames: string[] = [];
      let swingContext: any = {};

      // Ultra-fast test mode: generate placeholder frames so analysis starts instantly
      const FAST_TEST = false;
      if (FAST_TEST) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const framesArr: string[] = [];
        canvas.width = 640;
        canvas.height = 360;
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = `hsl(${(i * 36) % 360} 30% 18%)`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`Frame ${i + 1}`, canvas.width / 2, canvas.height / 2);
          framesArr.push(canvas.toDataURL('image/jpeg', 0.7));
        }
        extractedFrames = framesArr;
        setExtractedFrames(framesArr);
      } else if (uploadedVideo) {
        if (uploadedVideo.type.startsWith('video/')) {
          // Check video size
          if (uploadedVideo.size > 50 * 1024 * 1024) {
            toast({
              title: 'Video too large',
              description: "We'll analyze key frames instead.",
            });
          }
          setAnalysisStatus('Extracting frames...');
          extractedFrames = await extractFramesFromVideo(uploadedVideo);
          setExtractedFrames(extractedFrames);
          if (extractedFrames.length === 0) {
            throw new Error("Couldn't extract frames from video");
          }
        } else if (uploadedVideo.type.startsWith('image/')) {
          // Convert image to base64
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(uploadedVideo);
          });
          extractedFrames = [imageData];
        }
      }

      // Extract swing context from user message
      const message = (analysisText.trim() || 'Please analyze my swing').toLowerCase();
      if (message.includes('driver')) swingContext.club = 'Driver';
      else if (message.includes('iron')) swingContext.club = 'Iron';
      else if (message.includes('wedge')) swingContext.club = 'Wedge';
      else if (message.includes('putter')) swingContext.club = 'Putter';

      if (message.includes('hook')) swingContext.miss = 'Hook';
      else if (message.includes('slice')) swingContext.miss = 'Slice';
      else if (message.includes('pull')) swingContext.miss = 'Pull';
      else if (message.includes('push')) swingContext.miss = 'Push';

      if (message.includes('face on')) swingContext.angle = 'Face on';
      else if (message.includes('down the line')) swingContext.angle = 'Down the line';

      // Start lightweight UI progression in background (does not block API call)
      setAnalysisStatus('Analyzing swing phases...');
      let frameIdx = 0;
      let frameInterval: NodeJS.Timeout;
      let analysisProgressLoop: NodeJS.Timeout;
      const analysisStartTime = Date.now();

      // Extended analysis phases to keep user engaged
      const analysisPhases = [
        'Examining setup position...',
        'Analyzing stance and posture...',
        'Studying takeaway mechanics...',
        'Checking backswing plane...',
        'Evaluating wrist hinge...',
        'Analyzing transition timing...',
        'Studying downswing path...',
        'Reviewing impact dynamics...',
        'Checking clubface angle...',
        'Analyzing ball striking...',
        'Studying follow-through...',
        'Evaluating balance and finish...',
        'Calculating swing metrics...',
        'Generating detailed insights...',
        'Preparing recommendations...',
        'Finalizing analysis...'
      ];

      // Fixed timing with 1 second between each analysis phase
      const startDynamicProgression = () => {
        let currentPhaseIndex = 0;
        let frameUpdateCounter = 0;
        
        const progressUpdate = () => {
          // Update frame carousel every 300ms for smooth progression
          if (extractedFrames.length > 0) {
            setCurrentFrameIndex(frameIdx % extractedFrames.length);
            frameIdx++;
          }
          frameUpdateCounter++;
          
          // Update analysis status every 1000ms (1 second)
          // Since frames update every 300ms, analysis phases update every ~3.33 frame updates
          if (frameUpdateCounter % 3 === 0 && currentPhaseIndex < analysisPhases.length) {
            setAnalysisStatus(analysisPhases[currentPhaseIndex]);
            currentPhaseIndex++;
          }
        };
        
        // Update frames every 300ms, analysis phases effectively every 1000ms
        frameInterval = setInterval(progressUpdate, 300);
      };

      // Function to adjust timing based on actual API response time
      const adjustProgressionTiming = (apiResponseTime: number) => {
        const targetProgressTime = apiResponseTime * 0.8; // Use 80% of API time
        const remainingTime = Math.max(targetProgressTime - (Date.now() - analysisStartTime), 0);
        const remainingPhases = analysisPhases.length - (analysisPhases.findIndex(phase => 
          phase === document.querySelector('[data-analysis-status]')?.textContent
        ) + 1);
        
        if (remainingTime > 0 && remainingPhases > 0) {
          // Slow down to fill remaining time
          clearInterval(frameInterval);
          const newFrameInterval = Math.max(remainingTime / (remainingPhases * 2), 200);
          
          frameInterval = setInterval(() => {
            if (extractedFrames.length > 0) {
              setCurrentFrameIndex(frameIdx % extractedFrames.length);
              frameIdx++;
            }
          }, newFrameInterval);
        }
      };

      startDynamicProgression();

      // Fallback if no visuals could be attached
      if (uploadedVideo && extractedFrames.length === 0) {
        toast({
          title: "We couldn't attach your video",
          description: "Retrying by extracting key frames...",
          variant: "destructive"
        });
        
        // Try once more
        if (uploadedVideo.type.startsWith('video/')) {
          extractedFrames = await extractFramesFromVideo(uploadedVideo);
        }
        
        if (extractedFrames.length === 0) {
          toast({
            title: "Analysis failed to receive visuals",
            description: "Please re-upload or switch to photos (face-on / down-the-line).",
            variant: "destructive"
          });
          return;
        }
      }

      // userMessage already posted at analysis start

      console.log('📡 Sending to Edge Function:', {
        message: userMessage.content,
        imageCount: extractedFrames.length,
        hasSwingContext: Object.keys(swingContext).length > 0,
        firstFramePreview: extractedFrames[0]?.substring(0, 100) + '...'
      });

      const apiStartTime = Date.now();
      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: userMessage.content,
          conversation: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          detailMode: false,
          isEcho: true,
          images: extractedFrames,
          swingContext: swingContext
        }
      });

      const apiResponseTime = Date.now() - apiStartTime;
      console.log('✅ Edge Function response:', { error, hasData: !!data, responseTime: apiResponseTime });

      // Ensure visual progression uses at least 80% of total wait time
      const minProgressTime = apiResponseTime * 0.8;
      const actualProgressTime = Date.now() - analysisStartTime;
      
      if (actualProgressTime < minProgressTime) {
        const remainingTime = minProgressTime - actualProgressTime;
        setAnalysisStatus('Finalizing swing analysis...');
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }

      // Clear intervals when done
      clearInterval(frameInterval);

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw error;
      }

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      // Upload video to Cloudflare Stream in background after successful analysis
      let videoId = '';
      let videoUrl = '';
      let thumbnailUrl = '';

      if (uploadedVideo && uploadedVideo.type.startsWith('video/')) {
        try {
          const uploadResult = await uploadVideo(uploadedVideo);

          if (uploadResult.success && uploadResult.videoId) {
            videoId = uploadResult.videoId;
            videoUrl = getPlaybackUrl(videoId);
            thumbnailUrl = getThumbnailUrl(videoId);
          }
        } catch (error) {
          console.error('Background video upload failed:', error);
        }
      }

      // Use Cloudflare Stream thumbnail if available, otherwise create one for images
      if (!thumbnailUrl && uploadedVideo && uploadedVideo.type.startsWith('image/')) {
        thumbnailUrl = videoPreview;
      }

      // Update AI message with video data in metadata
      const updatedAiMessage = {
        ...aiMessage,
        metadata: {
          ...aiMessage.metadata,
          videoThumbnail: thumbnailUrl,
          videoId: videoId,
          videoUrl: videoUrl,
          conversation: [
            { role: 'user' as const, content: userMessage.content, timestamp: userMessage.timestamp },
            { role: 'ai' as const, content: aiMessage.content, timestamp: aiMessage.timestamp }
          ]
        }
      };

      // Update messages state with the updated AI message
      const allSwingCoachMessages = [...messages, userMessage, updatedAiMessage];
      setMessages(allSwingCoachMessages);

      // Save SwingCoach conversations to SwingCoach history (separate from Chat) with updated metadata
      localStorage.setItem('clbhouz_swingcoach_history', JSON.stringify(allSwingCoachMessages));

      // Set current analysis for potential saving
      console.log('🔍 Analysis response data:', { 
        hasMetadata: !!data.metadata, 
        metadata: data.metadata,
        response: data.response?.substring(0, 100) + '...'
      });
      
      if (data.metadata) {
        const analysisToSave = {
          id: aiMessage.id,
          save_card: data.metadata.save_card || 'Swing analysis',
          tags: data.metadata.tags || [],
          category: data.metadata.category || 'Swing',
          content: data.response,
          videoThumbnail: thumbnailUrl,
          videoId: videoId,
          videoUrl: videoUrl,
          timestamp: new Date(),
          conversation: [
            { role: 'user' as const, content: userMessage.content, timestamp: userMessage.timestamp },
            { role: 'ai' as const, content: aiMessage.content, timestamp: aiMessage.timestamp }
          ]
        };
        
        setCurrentAnalysis(analysisToSave);
        
        // Auto-save to Supabase after successful analysis
        console.log('🤖 Analysis complete, auto-saving to Supabase...');
        await autoSaveAnalysisToSupabase(analysisToSave);
      } else {
        // If no metadata, still save with basic information
        console.log('📝 No metadata found, creating basic analysis for auto-save...');
        const basicAnalysisToSave = {
          id: aiMessage.id,
          save_card: 'Swing Analysis',
          tags: [],
          category: 'Swing',
          content: data.response,
          videoThumbnail: thumbnailUrl,
          videoId: videoId,
          videoUrl: videoUrl,
          timestamp: new Date(),
          conversation: [
            { role: 'user' as const, content: userMessage.content, timestamp: userMessage.timestamp },
            { role: 'ai' as const, content: aiMessage.content, timestamp: aiMessage.timestamp }
          ]
        };
        
        setCurrentAnalysis(basicAnalysisToSave);
        
        // Auto-save to Supabase even without metadata
        console.log('🤖 Basic analysis complete, auto-saving to Supabase...');
        await autoSaveAnalysisToSupabase(basicAnalysisToSave);
      }

    } catch (error) {
      console.error('Error analyzing swing:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze swing. Please try again.",
        variant: "destructive"
      });

      const errorMessage: ChatMessageData = {
        id: Date.now().toString() + '_error',
        type: 'ai',
        content: "Sorry, I'm having trouble analyzing your swing right now. Please ensure you've uploaded a clear video and try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStatus('');
      setExtractedFrames([]);
      setCurrentFrameIndex(0);
    }
  };

  const autoSaveAnalysisToSupabase = async (analysisToSave: SwingAnalysis) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ No authenticated user for auto-save');
        return;
      }

      // Save to Supabase database
      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .insert({
          user_id: user.id,
          analysis_results: {
            aiResponse: analysisToSave.content,
            metadata: {
              category: analysisToSave.category,
              save_card: analysisToSave.save_card,
              tags: analysisToSave.tags,
              videoThumbnail: analysisToSave.videoThumbnail,
              videoId: analysisToSave.videoId,
              videoUrl: analysisToSave.videoUrl
            },
            timestamp: analysisToSave.timestamp.toISOString(),
            userMessage: analysisToSave.conversation?.[0]?.content || "Swing analysis request",
            conversation: analysisToSave.conversation?.map(msg => ({
              ...msg,
              timestamp: msg.timestamp.toISOString()
            }))
          },
          video_url: analysisToSave.videoUrl || null,
          swing_context: JSON.stringify({
            conversation: analysisToSave.conversation,
            videoId: analysisToSave.videoId,
            videoThumbnail: analysisToSave.videoThumbnail
          })
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Auto-save error:', error);
        return;
      }

      console.log('✅ Swing analysis auto-saved to database:', data);
      
      // Reload analyses from Supabase to sync with UI
      await loadAnalysesFromSupabase();
      
    } catch (error) {
      console.error('❌ Exception during auto-save:', error);
    }
  };

  const saveToSwingInsights = async () => {
    if (!currentAnalysis) return;
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save analysis.",
          variant: "destructive"
        });
        return;
      }

      // Save to Supabase database
      const { data, error } = await supabase
        .from('pro_ai_analyses')
        .insert({
          user_id: user.id,
          analysis_results: {
            aiResponse: currentAnalysis.content,
            metadata: {
              category: currentAnalysis.category,
              save_card: currentAnalysis.save_card,
              tags: currentAnalysis.tags
            },
            timestamp: currentAnalysis.timestamp.toISOString(),
            userMessage: currentAnalysis.conversation?.[0]?.content || "Swing analysis request"
          },
          video_url: currentAnalysis.videoUrl || null,
          swing_context: currentAnalysis.conversation ? JSON.stringify({
            conversation: currentAnalysis.conversation,
            videoId: currentAnalysis.videoId,
            videoThumbnail: currentAnalysis.videoThumbnail
          }) : null
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving to database:', error);
        throw error;
      }

      console.log('✅ Swing analysis saved to database:', data);

      // Reload analyses from Supabase to get the latest data
      await loadAnalysesFromSupabase();
      
      toast({
        title: "Saved to Swing Insights",
        description: "You can find this anytime in History & Saved → Analyses.",
      });
      
      setCurrentAnalysis(null);
    } catch (error) {
      console.error('Failed to save analysis:', error);
      toast({
        title: "Save failed",
        description: "Failed to save analysis to database.",
        variant: "destructive"
      });
    }
  };

  const requestMoreDetail = (originalMessage: string) => {
    // Re-analyze with detail mode
    setAnalysisText(originalMessage);
    analyzeSwing();
  };

  const handleGetCoachReview = (analysisId: string) => {
    setCurrentAnalysis(null); // Use existing state for now
    // setShowCoachPicker(true);
  };

  const handleCoachShareComplete = (shareId: string) => {
    // Could navigate to share tracking or show confirmation
    toast({
      title: "Shared successfully",
      description: "Your analysis has been sent to the coach for review"
    });
  };

  const handleExportPack = async (analysisId: string) => {
    try {
      const exportUrl = await SwingVisualizer.generateExportPack(analysisId);
      if (exportUrl) {
        // Open download URL
        window.open(exportUrl, '_blank');
        toast({
          title: "Export started",
          description: "Your visual coaching pack is being prepared"
        });
      } else {
        toast({
          title: "Export failed",
          description: "Could not generate visual pack",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error exporting pack:', error);
      toast({
        title: "Export failed",
        description: "Could not generate visual pack",
        variant: "destructive"
      });
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('pro_ai_analyses')
        .delete()
        .eq('id', analysisId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting analysis:', error);
        toast({
          title: "Delete failed",
          description: "Failed to delete analysis from database.",
          variant: "destructive"
        });
        return;
      }

      // Reload analyses from Supabase
      await loadAnalysesFromSupabase();
      
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
    }
  };


  return (
    <div className="h-full min-h-0">
      <ScrollArea 
        ref={messagesAutoScroll.scrollAreaRef}
        className="h-full"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="px-6 py-0">
        {messages.length === 0 && !uploadedVideo ? (
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">
              Upload your swing for swing analysis
            </h3>
            <p className="mb-6 text-sm">
              Get instant feedback and drills from Swing Coach.
            </p>
            
            <div className="text-center max-w-sm mx-auto">
              <p className="text-sm font-medium mb-3">Best results:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Face-on or down-the-line, full body, good lighting</li>
                <li>• State the club and typical miss (e.g., Driver + Hook)</li>
                <li>• Include swing speed or ball flight if known</li>
                <li>• Mention face-on or down-the-line</li>
              </ul>
            </div>

            <div className="flex gap-2 mt-6 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs hover:border-[#2A9D8F] hover:bg-[#2A9D8F]/5 hover:text-[#1D3557] active:bg-[#2A9D8F]/10 focus:border-[#2A9D8F] focus:ring-[#2A9D8F]/20"
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload Swing Video
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {uploadedVideo && (
              <div className="bg-muted rounded-lg p-4">
                {/* File name & size above media card */}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <p className="truncate">{uploadedVideo.name}</p>
                  <p>{(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
                
                {/* Analyze Swing button - moved above media card */}
                <div className="mb-3">
                  <Button
                    onClick={analyzeSwing}
                    disabled={uploading || isAnalyzing}
                    className="w-full gap-2 text-white"
                    style={{ 
                      background: 'linear-gradient(135deg, var(--echo-from), var(--echo-to))'
                    }}
                    aria-label={isAnalyzing ? 'Analyzing swing' : 'Analyze swing'}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      "Analyze Swing"
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-col gap-4">
                   <div className="w-full">
                     <div className="relative w-full h-64 overflow-hidden rounded-2xl bg-black">
                       {/* Show cycling frames during analysis, otherwise show video/image preview */}
                       {isAnalyzing && extractedFrames.length > 0 ? (
                         <img 
                           src={extractedFrames[currentFrameIndex]} 
                           alt="Analyzing swing frame"
                           className="absolute inset-0 h-full w-full object-cover transition-opacity duration-200"
                         />
                       ) : uploadedVideo.type.startsWith('video/') ? (
                         <video 
                           src={videoPreview} 
                           poster={videoPoster}
                           className="absolute inset-0 h-full w-full object-cover"
                           playsInline
                           muted
                           preload="metadata"
                           controls={false}
                         />
                       ) : (
                         <img 
                           src={videoPreview} 
                           alt="Preview"
                           className="absolute inset-0 h-full w-full object-cover"
                         />
                       )}
                     </div>
                   </div>
                     <div className="flex-1">
                       <div className="flex items-center justify-between mb-1">
                         <p className="text-xs text-muted-foreground">
                           {uploadedVideo.type.startsWith('video/') ? 'Video loaded and ready for analysis' : 'Image loaded and ready for analysis'}
                         </p>
                         <Button variant="ghost" size="sm" onClick={discardVideo}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                       
                        {/* Analysis status display */}
                        {isAnalyzing && analysisStatus && (
                          <div className="mb-3 p-2 rounded-lg border" style={{ 
                            backgroundColor: 'rgba(42, 157, 143, 0.08)', 
                            borderColor: 'rgba(42, 157, 143, 0.2)',
                            color: '#1D3557'
                          }}>
                            <p className="text-sm font-medium">{analysisStatus}</p>
                          </div>
                        )}
                     </div>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id}>
                <ChatMessageComponent
                  message={message}
                  onSaveToInsights={saveToSwingInsights}
                  onRequestDetail={requestMoreDetail}
                  onAskEcho={(prompt) => {
                    // Open Echo with the specific prompt
                    // This would integrate with the main Echo system
                    console.log('Ask Echo:', prompt);
                  }}
                />
                
                {/* Show visual pack if this is the latest AI message with analysis */}
                {message.type === 'ai' && 
                 message.id === messages[messages.length - 1]?.id && 
                 message.metadata?.category === 'swing_analysis' && (
                  <div className="mt-4 ml-12 space-y-4">
                    <SwingVisualCarousel
                      visuals={[]}
                      isLoading={false}
                      onExport={() => handleExportPack(message.id)}
                    />
                    
                    {/* Coach Review CTA */}
                    <div className="p-4 bg-muted/20 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">Want a pro's perspective?</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Get your swing reviewed by a local PGA professional
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleGetCoachReview(message.id)}
                          className="shrink-0"
                        >
                          Find Local Coach
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Show inline coach recommendations after swing analysis is complete */}
            {currentAnalysis && (
              <CoachPromptInline
                swingAnalysisId={currentAnalysis.id}
                defaultLocation={undefined}
              />
            )}

            {/* Hide action buttons completely for Swing Coach - they're not needed */}


            {/* Previous analyses removed per design */}
          </div>
        )}

        {currentGolfClub && (
          <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1 justify-center">
            <MapPin className="h-3 w-3" />
            Currently logging notes for {currentGolfClub}
          </div>
        )}
        </div>
      </ScrollArea>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Recent History Bar */}
      <div className="p-4 border-t">
        <button
          className="w-full rounded-[28px] backdrop-blur shadow flex items-center justify-between px-4 py-2 text-white hover:opacity-90 transition-all"
          style={{ 
            background: 'linear-gradient(135deg, rgba(29, 53, 87, 0.15), rgba(42, 157, 143, 0.15))',
            color: '#1D3557'
          }}
          onClick={() => setShowHistory(true)}
          aria-label="Open recent swing coach history"
        >
          <span className="flex items-center gap-2">
            <span 
              className="w-10 h-1 rounded-full" 
              style={{ 
                background: 'linear-gradient(135deg, #1D3557, #2A9D8F)', 
                opacity: 0.8 
              }} 
            />
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
        defaultCategory="swing"
      />

      {/* Coach Picker Modal - Temporarily disabled */}
      {false && (
        <div>Coach picker will go here</div>
      )}
    </div>
  );
};

export default SwingCoach;