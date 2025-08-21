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
import ChatMessageComponent from './ChatMessage';

interface SwingAnalysis {
  id: string;
  save_card: string;
  tags: string[];
  category: string;
  content: string;
  videoThumbnail?: string;
  timestamp: Date;
  voiceNote?: string;
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
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [analyses, setAnalyses] = useState<SwingAnalysis[]>([]);
  const [showAnalyses, setShowAnalyses] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<SwingAnalysis | null>(null);
  const [isAddingVoiceNote, setIsAddingVoiceNote] = useState(false);
  const [currentGolfClub, setCurrentGolfClub] = useState<string>('');
  const [isVoiceNoteRecording, setIsVoiceNoteRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load saved analyses from localStorage
  useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    setAnalyses(savedAnalyses);
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

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      const updatedAnalysis = {
        ...currentAnalysis,
        voiceNote: transcribedText
      };
      setCurrentAnalysis(updatedAnalysis);
      
      // Update saved analyses
      const updatedAnalyses = analyses.map(analysis => 
        analysis.id === currentAnalysis.id ? updatedAnalysis : analysis
      );
      setAnalyses(updatedAnalyses);
      localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(updatedAnalyses));
      
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
          0.1, // Address (P1)
          0.2, // Takeaway (P2) 
          0.35, // Shaft parallel back (P3)
          0.5, // Top (P4)
          0.65, // Downswing parallel (P5)
          0.8, // Impact (P6)
          0.9, // Early release (P7)
          0.95 // Finish (P9)
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

    // Show progress for extracting frames
    if (uploadedVideo && uploadedVideo.type.startsWith('video/')) {
      toast({
        title: "Extracting swing frames...",
        description: "Analyzing key positions from your video",
      });
    }

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: analysisText.trim() || 'Please analyze my swing',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setAnalysisText('');
    setIsAnalyzing(true);

    try {
      let extractedFrames: string[] = [];
      let swingContext: any = {};

      // Extract frames from video or use image directly
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
        const message = userMessage.content.toLowerCase();
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

      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: userMessage.content,
          conversation: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          detailMode: false,
          isProAI: true,
          images: extractedFrames,
          swingContext: swingContext
        }
      });

      if (error) throw error;

      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      // Create video thumbnail if video was uploaded
      let thumbnailUrl = '';
      if (uploadedVideo && uploadedVideo.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = videoPreview;
        video.currentTime = 1; // Get frame at 1 second
        await new Promise((resolve) => {
          video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(video, 0, 0);
              thumbnailUrl = canvas.toDataURL();
            }
            resolve(null);
          };
        });
      } else if (uploadedVideo && uploadedVideo.type.startsWith('image/')) {
        thumbnailUrl = videoPreview;
      }

      // Update AI message with thumbnail in metadata
      const updatedAiMessage = {
        ...aiMessage,
        metadata: {
          ...aiMessage.metadata,
          videoThumbnail: thumbnailUrl
        }
      };

      // Update messages state with the updated AI message
      const allSwingCoachMessages = [...messages, userMessage, updatedAiMessage];
      setMessages(allSwingCoachMessages);

      // Save SwingCoach conversations to SwingCoach history (separate from Chat) with updated metadata
      localStorage.setItem('clbhouz_swingcoach_history', JSON.stringify(allSwingCoachMessages));

      // Set current analysis for potential saving
      if (data.metadata) {
        setCurrentAnalysis({
          id: aiMessage.id,
          save_card: data.metadata.save_card || 'Swing analysis',
          tags: data.metadata.tags || [],
          category: data.metadata.category || 'Swing',
          content: data.response,
          videoThumbnail: thumbnailUrl,
          timestamp: new Date()
        });
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
    }
  };

  const saveToSwingInsights = () => {
    if (!currentAnalysis) return;
    
    const updatedAnalyses = [...analyses, currentAnalysis];
    setAnalyses(updatedAnalyses);
    localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(updatedAnalyses));
    
    toast({
      title: "Saved to Swing Insights",
      description: "You can find this anytime in History & Saved → Analyses.",
    });
    
    setCurrentAnalysis(null);
  };

  const requestMoreDetail = (originalMessage: string) => {
    // Re-analyze with detail mode
    setAnalysisText(originalMessage);
    analyzeSwing();
  };

  const deleteAnalysis = (analysisId: string) => {
    const updatedAnalyses = analyses.filter(analysis => analysis.id !== analysisId);
    setAnalyses(updatedAnalyses);
    localStorage.setItem('clbhouz_swing_analyses', JSON.stringify(updatedAnalyses));
    toast({
      title: "Analysis deleted",
      description: "The swing analysis has been removed",
    });
  };

  if (showAnalyses) {
    return (
      <div className="h-full min-h-0">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Swing Analyses</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowAnalyses(false)}>
              Back
            </Button>
          </div>
          
          {analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No analyses yet.</p>
              <p className="text-sm">Upload a swing to get instant feedback and drills.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="p-4">
                  <div className="flex items-start gap-3">
                    {analysis.videoThumbnail && (
                      <img 
                        src={analysis.videoThumbnail} 
                        alt="Swing thumbnail"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">{analysis.save_card}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.timestamp).toLocaleDateString()}
                      </p>
                      {analysis.voiceNote && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          Voice note attached
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => deleteAnalysis(analysis.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0">
      <div className="px-6 py-5">
        {messages.length === 0 && !uploadedVideo ? (
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
              {!videoPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAnalyses(true)}
                  className="text-xs"
                >
                  <BookOpen className="h-3 w-3 mr-1" />
                  Analyses ({analyses.length})
                </Button>
              )}
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
                      {!videoPreview && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAnalyses(true)}
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          Analyses ({analyses.length})
                        </Button>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={discardVideo}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
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
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full"></div>
                    <span className="text-sm">Swing Coach is analyzing swing positions...</span>
                  </div>
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