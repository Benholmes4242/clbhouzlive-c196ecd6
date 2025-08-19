import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioRecording(audioBlob);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak your caddie note...",
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
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64String = btoa(String.fromCharCode(...uint8Array));

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
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording
  };
};