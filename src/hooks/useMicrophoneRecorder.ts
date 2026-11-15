import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderStatus =
  | 'idle'
  | 'requesting'
  | 'recording'
  | 'stopped'
  | 'error';

export type RecorderErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'not-supported'
  | 'unknown';

export interface RecorderError {
  code: RecorderErrorCode;
  message: string;
}

export interface UseMicrophoneRecorderResult {
  status: RecorderStatus;
  error: RecorderError | null;
  audioUrl: string | null;
  audioBlob: Blob | null;
  mimeType: string | null;
  durationSeconds: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  releaseMicrophone: () => void;
}

const PREFERRED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
  'audio/ogg',
];

function getSupportedMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return undefined;
  }
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
}

function mapMediaError(err: unknown): RecorderError {
  if (err instanceof DOMException) {
    switch (err.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        return {
          code: 'permission-denied',
          message:
            'Microphone access was denied. Please allow microphone permission in your browser settings and try again.',
        };
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return {
          code: 'not-found',
          message:
            'No microphone was detected on this device. Connect a microphone and try again.',
        };
      case 'NotReadableError':
      case 'TrackStartError':
        return {
          code: 'not-readable',
          message:
            'Your microphone is currently in use by another application or could not be read.',
        };
      case 'NotSupportedError':
        return {
          code: 'not-supported',
          message:
            'Audio recording is not supported in this browser or insecure context.',
        };
      default:
        return {
          code: 'unknown',
          message: err.message || 'Unable to access the microphone.',
        };
    }
  }

  return {
    code: 'unknown',
    message:
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred while starting the microphone.',
  };
}

export function useMicrophoneRecorder(): UseMicrophoneRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopStreamTracks = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
  }, []);

  const revokeCurrentAudioUrl = useCallback(() => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const releaseMicrophone = useCallback(() => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop();
      } catch {
        // Ignore stop errors during cleanup
      }
    }
    mediaRecorderRef.current = null;
    stopStreamTracks();
  }, [stopStreamTracks, stopTimer]);

  const clearRecording = useCallback(() => {
    revokeCurrentAudioUrl();
    setAudioUrl(null);
    setAudioBlob(null);
    setMimeType(null);
    setDurationSeconds(0);
    setError(null);
    setStatus('idle');
  }, [revokeCurrentAudioUrl]);

  const startRecording = useCallback(async () => {
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      setError({
        code: 'not-supported',
        message:
          'Your browser does not support microphone recording via MediaRecorder.',
      });
      setStatus('error');
      return;
    }

    // Ensure any previous session is cleanly released before starting a new one
    releaseMicrophone();
    revokeCurrentAudioUrl();
    setAudioUrl(null);
    setAudioBlob(null);
    setMimeType(null);
    setDurationSeconds(0);
    setError(null);
    setStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // If the user navigated away while the permission prompt was open, release immediately
      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];

      const supportedMime = getSupportedMimeType();
      const recorder = supportedMime
        ? new MediaRecorder(stream, { mimeType: supportedMime })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        stopTimer();
        stopStreamTracks();
        if (!isMountedRef.current) return;
        setError({
          code: 'unknown',
          message: 'Microphone recording encountered an error and stopped.',
        });
        setStatus('error');
      };

      recorder.onstop = () => {
        stopTimer();
        stopStreamTracks();
        mediaRecorderRef.current = null;

        if (!isMountedRef.current) return;

        const resolvedMime =
          recorder.mimeType || supportedMime || 'audio/webm';
        const recordedBlob = new Blob(chunksRef.current, {
          type: resolvedMime,
        });

        if (recordedBlob.size === 0) {
          setError({
            code: 'unknown',
            message: 'No audio data was captured. Please try recording again.',
          });
          setStatus('error');
          return;
        }

        const nextUrl = URL.createObjectURL(recordedBlob);
        revokeCurrentAudioUrl();
        audioUrlRef.current = nextUrl;

        setAudioBlob(recordedBlob);
        setAudioUrl(nextUrl);
        setMimeType(resolvedMime);
        setStatus('stopped');
      };

      recorder.start(250);
      setStatus('recording');

      const startedAt = Date.now();
      timerRef.current = window.setInterval(() => {
        if (isMountedRef.current) {
          setDurationSeconds(Math.floor((Date.now() - startedAt) / 1000));
        }
      }, 500);
    } catch (err) {
      stopTimer();
      stopStreamTracks();
      if (!isMountedRef.current) return;
      setError(mapMediaError(err));
      setStatus('error');
    }
  }, [releaseMicrophone, revokeCurrentAudioUrl, stopStreamTracks, stopTimer]);

  const stopRecording = useCallback(() => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    } else {
      stopStreamTracks();
      setStatus((prev) => (prev === 'recording' ? 'idle' : prev));
    }
  }, [stopStreamTracks, stopTimer]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      releaseMicrophone();
      revokeCurrentAudioUrl();
    };
  }, [releaseMicrophone, revokeCurrentAudioUrl]);

  return {
    status,
    error,
    audioUrl,
    audioBlob,
    mimeType,
    durationSeconds,
    startRecording,
    stopRecording,
    clearRecording,
    releaseMicrophone,
  };
}
