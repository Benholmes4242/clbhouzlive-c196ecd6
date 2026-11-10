import { useState, useRef, useCallback, useEffect } from 'react';
import { AppLog } from '@/lib/logger';

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  mimeType: string | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  error: string | null;
  /** Live mic stream while recording; null when idle. Consumers can attach
   *  an AnalyserNode for waveform rendering. */
  stream: MediaStream | null;
}

export const useVoiceRecorder = (): UseVoiceRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Revoke object URL on change or unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setMimeType(null);
      setAudioUrl(null);
      setDuration(0);
      chunksRef.current = [];

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);

      // Device negotiation owns format; the blob must describe recorded bytes,
      // not the preferred WebM format (WebKit may choose MP4 instead).
      const chosenType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg;codecs=opus']
        .find(type => MediaRecorder.isTypeSupported(type));
      const mediaRecorder = chosenType
        ? new MediaRecorder(mediaStream, { mimeType: chosenType })
        : new MediaRecorder(mediaStream);
      setMimeType(mediaRecorder.mimeType || chosenType || null);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (chunksRef.current.length > 0) {
          const recordedType = mediaRecorder.mimeType || chosenType || '';
          const blob = new Blob(chunksRef.current, { type: recordedType });
          setMimeType(recordedType || null);
          setAudioBlob(blob);
          setAudioUrl(URL.createObjectURL(blob));
        }

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setStream(null);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      startTimer();
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    } catch (err: unknown) {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setStream(null);
      setIsRecording(false);
      stopTimer();
      AppLog.error('[useVoiceRecorder]', 'Error starting recording:', err);
      setError((err instanceof Error ? err.message : undefined) || 'Could not access microphone');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
      
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    stopTimer();
  }, []);

  const resetRecording = useCallback(() => {
    setAudioBlob(null);
    setMimeType(null);
    setAudioUrl(null);
    setDuration(0);
    chunksRef.current = [];
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isRecording, isPaused]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    mimeType,
    audioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    error,
    stream,
  };
};