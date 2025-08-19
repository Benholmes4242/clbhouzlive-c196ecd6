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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load saved analyses from localStorage
  React.useEffect(() => {
    const savedAnalyses = JSON.parse(localStorage.getItem('clbhouz_swing_analyses') || '[]');
    setAnalyses(savedAnalyses);
  }, []);

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

  React.useEffect(() => {
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

  const analyzeSwing = async () => {
    if (!uploadedVideo && !analysisText.trim()) return;

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
      // Prepare the system prompt for swing analysis
      const systemPrompt = "You are a professional golf swing analyzer. Analyze the uploaded swing and respond in the Fast Answer format. Focus on observable issues tied to impact laws. Provide quick fixes with setup/feel cues and suggest one simple drill. Always include the ::clbhz_meta:: section for saving.";

      // For now, we'll simulate the analysis since we need video upload to ChatGPT integration
      // In production, you'd upload the video and send it to the AI service
      
      const { data, error } = await supabase.functions.invoke('clbhouz-pro-ai', {
        body: {
          message: `${systemPrompt}\n\nUser request: ${userMessage.content}`,
          conversation: messages.slice(-6).map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.content
          })),
          detailMode: false
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
    <div className="flex-1 flex flex-col min-h-0">
      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div className="p-4 min-h-full flex flex-col">
            {messages.length === 0 && !uploadedVideo ? (
              <div className="py-6">
                <div className="text-center text-muted-foreground">
                  <p className="mb-4">
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
              <div className="space-y-4 flex-1">
                {uploadedVideo && (
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {uploadedVideo.type.startsWith('video/') ? (
                          <div className="w-32 h-32 rounded-lg overflow-hidden">
                            <video 
                              src={videoPreview} 
                              className="w-full h-full object-cover"
                              controls
                              preload="metadata"
                              poster=""
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
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                        <span className="text-sm">Analyzing your swing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input area */}
      <div className="p-4 border-t flex-shrink-0 bg-background">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs flex-1"
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload Swing Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalyses(true)}
            className="text-xs"
          >
            <BookOpen className="h-3 w-3 mr-1" />
            Analyses ({analyses.length})
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={analysisText}
            onChange={(e) => setAnalysisText(e.target.value)}
            placeholder={isVoiceNoteRecording ? "Recording voice note..." : currentGolfClub ? `Adding note to ${currentGolfClub}...` : uploadedVideo ? "Optional: Add context or question about your swing..." : "Say something or type a message..."}
            onKeyPress={(e) => e.key === 'Enter' && !isVoiceNoteRecording && (uploadedVideo || analysisText.trim()) && analyzeSwing()}
            disabled={isAnalyzing || isVoiceNoteRecording}
            className="flex-1"
          />
          
          {/* Send button - shows when video is uploaded or text is entered */}
          {(uploadedVideo || analysisText.trim()) && !isVoiceNoteRecording && (
            <Button
              onClick={analyzeSwing}
              disabled={isAnalyzing}
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          
          {/* Voice button - shows when no video uploaded and no text */}
          {!uploadedVideo && !analysisText.trim() && (
            <Button
              onClick={() => {
                if (isVoiceNoteRecording) {
                  stopRecording();
                } else if (isRecording) {
                  setIsVoiceNoteRecording(true);
                  startRecording();
                } else {
                  setIsVoiceNoteRecording(true);
                  startRecording();
                }
              }}
              disabled={isAnalyzing || isProcessing}
              size="sm"
              variant={isVoiceNoteRecording ? "default" : "outline"}
            >
              {isVoiceNoteRecording ? (
                <Send className="h-4 w-4" />
              ) : isRecording || isProcessing ? (
                <Mic className="h-4 w-4 opacity-50" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        
        {currentGolfClub && (
          <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            Currently logging notes for {currentGolfClub}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ProAI;