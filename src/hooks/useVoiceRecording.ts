import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceRecordingProps {
  onTranscriptionComplete?: (text: string) => void;
}

export const useVoiceRecording = ({ onTranscriptionComplete }: UseVoiceRecordingProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Feature detect MIME type
      const supported = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, supported ? { mimeType: supported } : undefined);

      audioChunksRef.current = [];
      let safetyTimer: number | null = null;

      // Add 60s safety cap
      mediaRecorderRef.current.onstart = () => { 
        safetyTimer = window.setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }, 60_000); 
      };

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        if (safetyTimer) window.clearTimeout(safetyTimer);
        
        try {
          const blob = new Blob(audioChunksRef.current, { type: supported ?? 'audio/webm' });
          
          // Simpler base64 conversion via FileReader
          const base64String = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onerror = () => reject(r.error);
            r.onload = () => resolve(((r.result as string) || '').split(',')[1] || '');
            r.readAsDataURL(blob);
          });

          // Send to voice-to-text edge function
          const { data, error } = await supabase.functions.invoke('voice-to-text', {
            body: { audio: base64String }
          });

          if (error) throw error;

          const transcribedText = data.text;

          if (transcribedText && transcribedText.trim()) {
            onTranscriptionComplete?.(transcribedText);
            
            toast({
              title: "Voice note recorded",
              description: `"${transcribedText.slice(0, 50)}${transcribedText.length > 50 ? '...' : ''}"`,
            });
          } else {
            toast({
              title: "No speech detected",
              description: "Please try recording again and speak clearly",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          toast({
            title: "Transcription failed",
            description: "Failed to convert speech to text. Please try again.",
            variant: "destructive"
          });
        } finally {
          // Always stop tracks to release microphone
          stream.getTracks().forEach(t => t.stop());
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak your note...",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to record voice notes",
        variant: "destructive"
      });
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      toast({
        title: "Processing recording",
        description: "Converting speech to text...",
      });
    }
  }, [isRecording]);

  const processAudioRecording = async (audioBlob: Blob) => {
    // This function is no longer needed as processing is handled inline in onstop
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording
  };
};