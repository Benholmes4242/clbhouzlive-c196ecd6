import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Trash2, Mic, MicOff } from 'lucide-react';
import ChatMessageComponent from './ChatMessage';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProAiPanelProps {
  isRecording: boolean;
  isProcessing: boolean;
  startRecording: () => void;
  stopRecording: () => void;
}

interface ChatMessageData {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  metadata?: any;
}

const ProAiPanel: React.FC<ProAiPanelProps> = ({
  isRecording,
  isProcessing,
  startRecording,
  stopRecording
}) => {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [swingContext, setSwingContext] = useState('');
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File too large",
          description: "Please upload a video smaller than 100MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedVideo(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
    }
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setUploadedVideo(null);
    setVideoPreview('');
    setSwingContext('');
  };

  const analyzeVideo = async () => {
    if (!uploadedVideo) return;

    setIsAnalyzing(true);
    
    try {
      // Extract frames from video for analysis
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      video.src = videoPreview;
      
      await new Promise((resolve) => {
        video.onloadeddata = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const extractedFrames: string[] = [];
      const frameCount = Math.min(5, Math.floor(video.duration));
      
      for (let i = 0; i < frameCount; i++) {
        video.currentTime = (video.duration / frameCount) * i;
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const frameData = canvas.toDataURL('image/jpeg', 0.8);
          extractedFrames.push(frameData);
        }
      }

      const userMessage: ChatMessageData = {
        id: Date.now().toString(),
        type: 'user',
        content: `Analyzing swing video${swingContext ? `: ${swingContext}` : ''}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

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
        content: data.response || 'Analysis complete!',
        timestamp: new Date(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, aiMessage]);

      toast({
        title: "Analysis Complete",
        description: "Your swing has been analyzed by Pro AI",
      });

    } catch (error) {
      console.error('Error analyzing video:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full min-h-0">
      <div className="px-6 py-8 space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">
            Upload your swing for swing analysis
          </h3>
          <p className="text-muted-foreground mb-6">
            Get instant feedback and drills from Pro AI.
          </p>

          <ul className="text-left list-disc space-y-1 pl-6 text-sm text-muted-foreground max-w-md mx-auto">
            <li>State the club and typical miss (e.g., Driver + Hook)</li>
            <li>Include swing speed or ball flight if known</li>
          </ul>
        </div>

        {/* Video Upload Area */}
        {!uploadedVideo ? (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              Upload your swing video (max 100MB)
            </p>
            <Button
              onClick={() => document.getElementById('video-upload')?.click()}
              className="mx-auto"
            >
              Select Video
            </Button>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video
                src={videoPreview}
                controls
                className="w-full max-h-64 rounded-lg"
              />
              <Button
                onClick={removeVideo}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Swing Context Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Swing Context (optional)
              </label>
              <Textarea
                value={swingContext}
                onChange={(e) => setSwingContext(e.target.value)}
                placeholder="e.g., Driver, tends to hook, 95mph swing speed, down-the-line view"
                className="min-h-[80px]"
              />
            </div>

            <Button
              onClick={analyzeVideo}
              disabled={isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Analyzing...
                </div>
              ) : (
                'Analyze Swing'
              )}
            </Button>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h4 className="font-medium">Analysis Results</h4>
            {messages.map((message, index) => (
              <ChatMessageComponent
                key={message.id || index}
                message={message}
                onSaveToInsights={() => {}}
                onRequestDetail={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProAiPanel;