import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Video, Play, Trash2, Send, BookOpen, MoreHorizontal, Share2, Plus, Mic, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { useCloudflareStream } from '@/hooks/useCloudflareStream';
import { useConversationSession } from '@/hooks/useConversationSession';
import ChatMessageComponent from './ChatMessage';
import { useAutoScroll } from '@/hooks/useAutoScroll';
import { SwingAnalysisLoader } from './SwingAnalysisLoader';

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
  const [analysisText, setAnalysisText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Use conversation session hook for Supabase integration
  const {
    currentSession,
    conversations,
    addMessage,
    saveCurrentSession,
    renameConversation,
    deleteConversation,
    clearAllConversations,
    startNewConversationManually,
    getDisplayTitle,
    loadConversations
  } = useConversationSession({ 
    storageKey: 'swing-coach',
    isModalOpen: true 
  });
  
  const [currentAnalysis, setCurrentAnalysis] = useState<SwingAnalysis | null>(null);
  const [isAddingVoiceNote, setIsAddingVoiceNote] = useState(false);
  const [currentGolfClub, setCurrentGolfClub] = useState<string>('');
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { uploadVideo, uploading } = useCloudflareStream();

  // Auto-scroll for messages
  const messagesAutoScroll = useAutoScroll({
    dependencies: [currentSession?.messages],
    enabled: true,
    direction: 'bottom' // Live chat messages are added at the bottom
  });
  
  // Helper functions for Cloudflare Stream URLs
  const getPlaybackUrl = (videoId: string): string => {
    return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/manifest/video.m3u8`;
  };
  
  const getThumbnailUrl = (videoId: string): string => {
    return `https://customer-4ah4gni80ytefpck.cloudflarestream.com/${videoId}/thumbnails/thumbnail.jpg`;
  };

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

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
      
      // Add to conversation session
      if (currentSession) {
        addMessage({
          id: Date.now().toString(),
          type: 'user',
          content: transcribedText,
          timestamp: new Date()
        });
      }
      
      // Save to caddie logs
      saveToCaddieLogs(transcribedText, detectedGolfClub || undefined, holeNumber || undefined);
    }
    setIsAddingVoiceNote(false);
    setIsVoiceNoteRecording(false);
  }, [currentAnalysis, toast, currentGolfClub]);

  const { isRecording, isProcessing, startRecording, stopRecording } = useVoiceRecording({
    onTranscriptionComplete: handleVoiceNoteComplete
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    }
  };

  const discardVideo = () => {
    setUploadedVideo(null);
    setVideoPreview('');
    setAnalysisText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const extractFramesFromVideo = async (videoFile: File): Promise<string[]> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      
      video.onloadedmetadata = () => {
        canvas.width = Math.min(video.videoWidth, 1280);
        canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
        
        const duration = video.duration;
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
        ].map(pos => pos * duration);

        let frameIndex = 0;
        
        const captureFrame = () => {
          if (frameIndex >= framePositions.length) {
            resolve(frames);
            return;
          }
          
          video.currentTime = framePositions[frameIndex];
          video.onseeked = () => {
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const frameData = canvas.toDataURL('image/jpeg', 0.8);
              frames.push(frameData);
              frameIndex++;
              captureFrame();
            }
          };
        };
        
        captureFrame();
      };
      
      video.src = URL.createObjectURL(videoFile);
    });
  };

  const analyzeSwing = async () => {
    if (!uploadedVideo && !analysisText.trim()) return;

    console.log('🚀 Starting swing analysis with:', {
      hasVideo: !!uploadedVideo,
      videoType: uploadedVideo?.type,
      message: analysisText || 'Please analyze my swing'
    });

    setIsAnalyzing(true);
    
    try {
      let extractedFrames: string[] = [];
      let swingContext: any = {};

      // Extract frames from video or use image directly BEFORE creating user message
      if (uploadedVideo) {
        if (uploadedVideo.type.startsWith('video/')) {
          // Check video size
          if (uploadedVideo.size > 50 * 1024 * 1024) {
            toast({
              title: "Video too large",
              description: "We'll analyze key frames instead.",
            });
          }
          
          extractedFrames = await extractFramesFromVideo(uploadedVideo);
          
          if (extractedFrames.length === 0) {
            throw new Error("Couldn't extract frames from video");
          }

          toast({
            title: "Analyzing...",
            description: `Extracted ${extractedFrames.length} key swing positions`,
          });
        } else if (uploadedVideo.type.startsWith('image/')) {
          // Convert image to base64
          const reader = new FileReader();
          const imageData = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(uploadedVideo);
          });
          extractedFrames = [imageData];
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
      }

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

      const userMessage: ChatMessageData = {
        id: Date.now().toString(),
        type: 'user',
        content: analysisText.trim() || 'Please analyze my swing',
        timestamp: new Date(),
        videoPreview: uploadedVideo ? videoPreview : undefined,
        videoFileName: uploadedVideo?.name,
        videoType: uploadedVideo?.type
      };

      // Add user message to conversation
      if (currentSession) {
        addMessage({
          id: userMessage.id,
          type: 'user',
          content: userMessage.content,
          timestamp: userMessage.timestamp,
          metadata: {
            videoPreview: userMessage.videoPreview,
            videoFileName: userMessage.videoFileName,
            videoType: userMessage.videoType
          }
        });
      }
      setAnalysisText('');

      console.log('📡 Sending to Edge Function:', {
        message: userMessage.content,
        imageCount: extractedFrames.length,
        hasSwingContext: Object.keys(swingContext).length > 0,
        firstFramePreview: extractedFrames[0]?.substring(0, 100) + '...'
      });

      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: userMessage.content,
          conversation: currentSession ? currentSession.messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })) : [],
          detailMode: false,
          isEcho: true,
          images: extractedFrames,
          swingContext: swingContext
        }
      });

      console.log('✅ Edge Function response:', { error, hasData: !!data });

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

      // Add AI response to conversation
      if (currentSession) {
        addMessage({
          id: aiMessage.id,
          type: 'ai',
          content: data.response,
          timestamp: aiMessage.timestamp,
          metadata: data.metadata
        });
      }

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

      // Update session title if not already set
      if (currentSession && !currentSession.title) {
        const title = userMessage.content.slice(0, 50) + (userMessage.content.length > 50 ? '...' : '');
        renameConversation(currentSession.id, title);
      }

      // Set current analysis for potential saving
      if (data.metadata) {
        setCurrentAnalysis({
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
            { role: 'user', content: userMessage.content, timestamp: userMessage.timestamp },
            { role: 'ai', content: aiMessage.content, timestamp: aiMessage.timestamp }
          ]
        });
      }

    } catch (error) {
      console.error('Error analyzing swing:', error);
      toast({
        title: "Analysis failed",
        description: "Failed to analyze swing. Please try again.",
        variant: "destructive"
      });

      // Add error message to conversation
      if (currentSession) {
        addMessage({
          id: Date.now().toString() + '_error',
          type: 'ai',
          content: "Sorry, I'm having trouble analyzing your swing right now. Please ensure you've uploaded a clear video and try again.",
          timestamp: new Date()
        });
      }
    } finally {
      setIsAnalyzing(false);
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

      // Analysis is automatically saved via conversation session
      
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

  const deleteAnalysis = async (sessionId: string) => {
    try {
      deleteConversation(sessionId);
      toast({
        title: "Analysis deleted",
        description: "The swing analysis has been removed",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete analysis.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="h-full min-h-0">
      <ScrollArea 
        ref={messagesAutoScroll.scrollAreaRef}
        className="h-full"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="px-6 py-5">
        {(!currentSession || currentSession.messages.length === 0) && !uploadedVideo ? (
          <div className="text-center text-muted-foreground">
            <h3 className="text-lg font-medium mb-2">
              Upload your swing for swing analysis
            </h3>
            <p className="mb-6 text-sm">
              Get instant feedback and drills from Swing Coach.
            </p>
            
            <div className="text-left max-w-sm mx-auto">
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
                className="text-xs"
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
                <div className="flex flex-col gap-4">
                  <div className="w-full">
                    <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-black">
                      {uploadedVideo.type.startsWith('video/') ? (
                        <video 
                          src={videoPreview} 
                          className="absolute inset-0 h-full w-full object-cover"
                          playsInline
                          muted
                          loop
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
                    <p className="text-sm font-medium mb-1">{uploadedVideo.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {uploadedVideo.type.startsWith('video/') ? 'Video loaded and ready for analysis' : 'Image loaded and ready for analysis'}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Replace
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={discardVideo}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentSession && currentSession.messages.map((message, index) => (
              <ChatMessageComponent
                key={`${message.timestamp}-${index}`}
                message={{
                  id: `${message.timestamp}-${index}`,
                  type: message.type,
                  content: message.content,
                  timestamp: message.timestamp,
                  metadata: message.metadata
                }}
                onSaveToInsights={saveToSwingInsights}
                onRequestDetail={requestMoreDetail}
              />
            ))}

            {currentAnalysis && (
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={saveToSwingInsights}
                    className="w-full"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Save to Swing Insights
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => requestMoreDetail(analysisText || 'Explain fully in detail')}
                      className="flex-1"
                    >
                      More Detail
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share to Feed
                    </Button>
                  </div>
                  {!currentAnalysis.voiceNote && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setIsAddingVoiceNote(true);
                        startRecording();
                      }}
                      disabled={isRecording || isProcessing}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Voice Note
                    </Button>
                  )}
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                  <SwingAnalysisLoader isAnalyzing={isAnalyzing} />
                </div>
              </div>
            )}

            {/* Previous swing analyses */}
            {conversations.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <h4 className="font-medium mb-2 text-sm">Previous Analyses</h4>
                <div className="space-y-2">
                  {conversations.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                      <button
                        onClick={() => window.location.reload()} // Simple reload to load the session
                        className="truncate text-left flex-1 hover:text-primary"
                      >
                        {getDisplayTitle(session)}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteAnalysis(session.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
};

export default SwingCoach;