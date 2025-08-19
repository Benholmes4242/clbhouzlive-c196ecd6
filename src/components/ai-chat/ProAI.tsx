import React, { useState, useRef, useCallback } from 'react';
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

interface ProAIProps {
  onClose?: () => void;
  isRecording?: boolean;
  isProcessing?: boolean;
  startRecording?: () => void;
  stopRecording?: () => void;
}

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

const ProAI: React.FC<ProAIProps> = ({
  onClose,
  isRecording: parentIsRecording,
  isProcessing: parentIsProcessing,
  startRecording: parentStartRecording,
  stopRecording: parentStopRecording,
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
  const { toast } = useToast();

  // Load saved analyses from localStorage
  React.useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    setAnalyses(savedAnalyses);
  }, []);

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
      // Check file type
      if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video (.mp4, .mov) or image file",
          variant: "destructive"
        });
        return;
      }

      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 50MB",
          variant: "destructive"
        });
        return;
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

  const extractKeyFrames = async (video: HTMLVideoElement): Promise<string[]> => {
    const frames: string[] = [];
    const duration = video.duration;
    
    // Define key positions as percentages of swing duration
    const keyPositions = [
      { name: 'Address (P1)', percent: 0.05 },
      { name: 'Takeaway (P2)', percent: 0.15 },
      { name: 'Shaft Parallel Back (P3)', percent: 0.35 },
      { name: 'Top (P4)', percent: 0.45 },
      { name: 'Downswing Parallel (P5)', percent: 0.65 },
      { name: 'Impact (P6)', percent: 0.75 },
      { name: 'Early Release (P7)', percent: 0.85 },
      { name: 'Finish (P9)', percent: 0.95 }
    ];
    
    for (const position of keyPositions.slice(0, 8)) { // Max 8 frames
      const timePoint = duration * position.percent;
      video.currentTime = timePoint;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(video.videoWidth, 1280); // Max width 1280px
          canvas.height = (canvas.width / video.videoWidth) * video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            frames.push(dataUrl);
          }
          resolve();
        };
      });
      
      // Add small delay between frames
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return frames;
  };

  const analyzeSwing = async () => {
    if (!uploadedVideo && !analysisText.trim()) return;

    // Show progress message
    const progressMessage: ChatMessageData = {
      id: Date.now().toString() + '_progress',
      type: 'ai',
      content: uploadedVideo ? 'Extracting swing frames...' : 'Analyzing your question...',
      timestamp: new Date()
    };

    const userMessage: ChatMessageData = {
      id: Date.now().toString(),
      type: 'user',
      content: analysisText.trim() || 'Please analyze my swing',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, progressMessage]);
    setAnalysisText('');
    setIsAnalyzing(true);

    try {
      let videoDataUrl = null;
      let frameCount = 0;
      
      // Convert video/image to base64 for AI analysis
      if (uploadedVideo) {
        if (uploadedVideo.type.startsWith('image/')) {
          // For images, convert directly to base64
          const reader = new FileReader();
          videoDataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(uploadedVideo);
          });
        } else if (uploadedVideo.type.startsWith('video/')) {
          // Update progress
          setMessages(prev => prev.map(msg => 
            msg.id === progressMessage.id 
              ? { ...msg, content: 'Extracting key swing positions...' }
              : msg
          ));

          // For videos, extract key frames
          const video = document.createElement('video');
          video.src = videoPreview;
          video.crossOrigin = 'anonymous';
          
          await new Promise<void>((resolve) => {
            video.onloadedmetadata = () => resolve();
          });

          if (video.duration < 1) {
            throw new Error('Video too short for analysis. Please upload a video showing your full swing.');
          }

          // Extract multiple key frames for better analysis
          const frames = await extractKeyFrames(video);
          frameCount = frames.length;
          
          if (frames.length === 0) {
            throw new Error('Could not extract frames from video. Please try a different video.');
          }

          // Use the best frame (usually impact or address) for primary analysis
          videoDataUrl = frames[Math.floor(frames.length / 2)] || frames[0];
        }
      }

      // Update progress
      setMessages(prev => prev.map(msg => 
        msg.id === progressMessage.id 
          ? { ...msg, content: uploadedVideo ? `Analyzing swing${frameCount > 1 ? ` (${frameCount} key positions)` : ''}...` : 'Getting AI response...' }
          : msg
      ));

      if (uploadedVideo && !videoDataUrl) {
        throw new Error('We couldn\'t process your video. Please re-upload or try with photos (face-on / down-the-line).');
      }
      
      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: userMessage.content,
          conversation: messages.filter(msg => msg.id !== progressMessage.id).slice(-4).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          detailMode: false,
          videoData: videoDataUrl,
          fileName: uploadedVideo?.name
        }
      });

      if (error) throw error;

      // Remove progress message and add AI response
      const aiMessage: ChatMessageData = {
        id: Date.now().toString() + '_ai',
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => prev.filter(msg => msg.id !== progressMessage.id).concat([aiMessage]));

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
      setMessages(prev => prev.filter(msg => msg.id !== progressMessage.id).concat([errorMessage]));
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
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Swing Analyses</h3>
          <Button variant="ghost" size="sm" onClick={() => setShowAnalyses(false)}>
            Back
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
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
                          {analysis.timestamp.toLocaleDateString()}
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
        </ScrollArea>
      </div>
    );
  }

  return (
    <>
      {messages.length === 0 && !uploadedVideo ? (
        <div className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="mb-6">
              Upload your swing for swing analysis<br />
              Get instant feedback and drills from pro AI.
            </p>
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Best results:</p>
              <div className="text-xs space-y-1">
                <p>• Face on or down the line, full body, good light</p>
                <p>• State the club and miss (e.g., Driver • Hook)</p>
                <p>• Optional: include swing speed or launch data</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {uploadedVideo && (
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {uploadedVideo.type.startsWith('video/') ? (
                    <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      <video 
                        src={videoPreview} 
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        onLoadedData={(e) => {
                          const video = e.target as HTMLVideoElement;
                          video.currentTime = 1; // Seek to 1 second for thumbnail
                        }}
                      />
                    </div>
                  ) : (
                    <img 
                      src={videoPreview} 
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{uploadedVideo.name}</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {uploadedVideo.type.startsWith('video/') ? 'Video loaded and ready for analysis' : 'Image loaded and ready for analysis'}
                  </p>
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
              onSaveToInsights={(msg) => {
                if (currentAnalysis) {
                  saveToSwingInsights();
                }
              }}
              onRequestDetail={(originalMessage) => {
                // Re-analyze with more detail
                setAnalysisText(originalMessage);
                const detailMessage: ChatMessageData = {
                  id: Date.now().toString(),
                  type: 'user',
                  content: originalMessage + " - Provide more detailed analysis",
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, detailMessage]);
                analyzeSwing();
              }}
            />
          ))}
          
          {isAnalyzing && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                  <span className="text-sm">Pro AI is analyzing...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Action Buttons - only show for last AI message with metadata */}
          {currentAnalysis && (
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveToSwingInsights}
                className="text-xs"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Save to Swing Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddingVoiceNote(true)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Voice Note
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share to Feed
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Hidden file input for parent to access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </>
  );
};

export default ProAI;