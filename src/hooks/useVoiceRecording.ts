/**
 * useVoiceRecording — Dual-mode hook:
 *   Mode 1 (default): Voice Comment — records audio, uploads to storage, returns URL
 *   Mode 2: Transcribe — sends to voice-to-text, returns transcribed text
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type VoiceMode = 'voice-comment' | 'transcribe';

interface UseVoiceRecordingProps {
  onTranscriptionComplete?: (text: string) => void;
  onVoiceNoteComplete?: (mediaUrl: string, durationSeconds: number) => void;
  mode?: VoiceMode;
}

export const useVoiceRecording = ({
  onTranscriptionComplete,
  onVoiceNoteComplete,
  mode = 'transcribe',
}: UseVoiceRecordingProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const supported = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, supported ? { mimeType: supported } : undefined);
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      setRecordingDuration(0);

      // Timer for duration display
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      let safetyTimer: number | null = null;

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
        if (timerRef.current) window.clearInterval(timerRef.current);

        const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

        try {
          const blob = new Blob(audioChunksRef.current, { type: supported ?? 'audio/webm' });

          if (mode === 'voice-comment') {
            // Upload to Supabase Storage
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const commentId = uuidv4();
            const filePath = `${user.id}/${commentId}.webm`;

            const { error: uploadError } = await supabase.storage
              .from('comment-voice-notes')
              .upload(filePath, blob, {
                contentType: supported ?? 'audio/webm',
                upsert: false,
              });

            if (uploadError) throw uploadError;

            onVoiceNoteComplete?.(filePath, durationSeconds);

            toast.success("Voice note recorded", { description: `${durationSeconds}s voice note ready to send` });
          } else {
            // Transcribe mode — send to voice-to-text
            const base64String = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onerror = () => reject(r.error);
              r.onload = () => resolve(((r.result as string) || '').split(',')[1] || '');
              r.readAsDataURL(blob);
            });

            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64String },
            });

            if (error) throw error;

            const transcribedText = data.text;

            if (transcribedText && transcribedText.trim()) {
              onTranscriptionComplete?.(transcribedText);
              toast.success("Voice note recorded", { description: `"${transcribedText.slice(0, 50)}${transcribedText.length > 50 ? '...' : ''}"` });
            } else {
              toast.error("No speech detected", { description: "Please try recording again and speak clearly" });
            }
          }
        } catch (error) {
          console.error('Error processing audio:', error);
          toast.error(mode === 'voice-comment' ? "Upload failed" : "Transcription failed", { description: "Please try again." });
        } finally {
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);

      toast("Recording started", { description: "Speak your note..." });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error("Microphone access denied", { description: "Please allow microphone access to record voice notes" });
    }
  }, [mode, onTranscriptionComplete, onVoiceNoteComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);

      toast(mode === 'voice-comment' ? "Uploading voice note..." : "Converting speech to text...");
    }
  }, [isRecording, mode]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Remove the onstop handler to prevent processing
      mediaRecorderRef.current.onstop = () => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
