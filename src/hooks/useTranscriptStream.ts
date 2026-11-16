import { useCallback, useEffect, useRef, useState } from 'react';
import { DemoTranscriptStreamTransport } from '../services/demoTranscriptStream';
import type {
  LanguageCode,
  LiveContext,
  MeetingOutcome,
  OpinionSuggestion,
  TranscriptEntry,
} from '../types/meeting';
import type {
  IncomingTranscriptEvent,
  StreamConnectionState,
} from '../types/streaming';

interface UseTranscriptStreamOptions {
  speechTargetLanguage: LanguageCode;
  onFinalSegment: (entry: TranscriptEntry) => void;
  // 서버가 STT 오인식을 고친 보정본을 보냈을 때
  onCorrectSegment?: (segmentId: string, text: string) => void;
  onUpdateSegmentTranslation?: (
    segmentId: string,
    targetLanguage: LanguageCode,
    translatedText: string
  ) => void;
  onContextUpdated?: (context: LiveContext) => void;
  onOutcomeUpdated?: (outcome: MeetingOutcome) => void;
  onOpinionSuggested?: (suggestion: OpinionSuggestion) => void;
}

export interface StreamErrorInfo {
  code: string;
  message: string;
}

export interface UseTranscriptStreamResult {
  connectionState: StreamConnectionState;
  streamError: StreamErrorInfo | null;
  interimSegment: TranscriptEntry | null;
  isDemoMode: boolean;
  startDemoStream: () => void;
  stopStream: () => void;
  connectBackendWebSocket: (wsUrl: string) => void;
  handleIncomingEvent: (event: IncomingTranscriptEvent) => void;
  clearError: () => void;
}

export function useTranscriptStream({
  speechTargetLanguage,
  onFinalSegment,
  onCorrectSegment,
  onUpdateSegmentTranslation,
  onContextUpdated,
  onOutcomeUpdated,
  onOpinionSuggested,
}: UseTranscriptStreamOptions): UseTranscriptStreamResult {
  const [connectionState, setConnectionState] =
    useState<StreamConnectionState>('disconnected');
  const [streamError, setStreamError] = useState<StreamErrorInfo | null>(null);
  const [interimSegment, setInterimSegment] = useState<TranscriptEntry | null>(
    null
  );
  const [isDemoMode, setIsDemoMode] = useState(false);

  const targetLangRef = useRef<LanguageCode>(speechTargetLanguage);
  const onFinalRef = useRef(onFinalSegment);
  const onCorrectRef = useRef(onCorrectSegment);
  onCorrectRef.current = onCorrectSegment;

  const onTranslationDeltaRef = useRef(onUpdateSegmentTranslation);
  const onContextRef = useRef(onContextUpdated);
  const onOutcomeRef = useRef(onOutcomeUpdated);
  const onSuggestionRef = useRef(onOpinionSuggested);

  // 스트림 콜백이 항상 최신 값·핸들러를 쓰도록 렌더 후에 맞춰 둔다
  useEffect(() => {
    targetLangRef.current = speechTargetLanguage;
    onFinalRef.current = onFinalSegment;
    onTranslationDeltaRef.current = onUpdateSegmentTranslation;
    onContextRef.current = onContextUpdated;
    onOutcomeRef.current = onOutcomeUpdated;
    onSuggestionRef.current = onOpinionSuggested;
  });

  const demoTransportRef = useRef<DemoTranscriptStreamTransport | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleIncomingEvent = useCallback((event: IncomingTranscriptEvent) => {
    switch (event.type) {
      case 'status': {
        setConnectionState(event.state);
        if (event.state !== 'error') {
          setStreamError(null);
        } else if (event.message) {
          setStreamError({
            code: 'STREAM_STATUS_ERROR',
            message: event.message,
          });
        }
        break;
      }

      case 'transcript.interim': {
        const translations: Partial<Record<LanguageCode, string>> = {};
        if (event.targetLanguage && event.translatedText) {
          translations[event.targetLanguage] = event.translatedText;
        }

        setInterimSegment({
          id: event.segmentId,
          speakerId: event.speakerId,
          speakerName: event.speakerName,
          timestamp: event.timestamp,
          originalLanguage: event.sourceLanguage,
          originalText: event.text,
          translations,
          badgeVariant: event.badgeVariant ?? 'neutral',
          status: 'interim',
          source: event.source ?? 'stream',
        });
        break;
      }

      case 'transcript.final': {
        const mergedTranslations: Partial<Record<LanguageCode, string>> = {
          ...(event.translations ?? {}),
        };
        if (event.targetLanguage && event.translatedText) {
          mergedTranslations[event.targetLanguage] = event.translatedText;
        }

        const finalEntry: TranscriptEntry = {
          id: event.segmentId,
          speakerId: event.speakerId,
          speakerName: event.speakerName,
          timestamp: event.timestamp,
          originalLanguage: event.sourceLanguage,
          originalText: event.text,
          translations: mergedTranslations,
          badgeVariant: event.badgeVariant ?? 'neutral',
          status: 'final',
          source: event.source ?? 'stream',
          isAnonymous: event.isAnonymous,
          speakerKey: event.speakerKey,
          speakerNumber: event.speakerNumber,
          participantId: event.participantId,
          createdAt: event.createdAt,
        };

        setInterimSegment((prev) =>
          prev?.id === event.segmentId ? null : prev
        );
        onFinalRef.current(finalEntry);
        break;
      }

      case 'transcript.corrected': {
        onCorrectRef.current?.(event.segmentId, event.text);
        break;
      }

      case 'translation.delta': {
        setInterimSegment((prev) => {
          if (!prev || prev.id !== event.segmentId) return prev;
          return {
            ...prev,
            translations: {
              ...prev.translations,
              [event.targetLanguage]: event.translatedText,
            },
          };
        });
        onTranslationDeltaRef.current?.(
          event.segmentId,
          event.targetLanguage,
          event.translatedText
        );
        break;
      }

      case 'context.updated': {
        onContextRef.current?.(event.context);
        break;
      }

      case 'outcome.updated': {
        onOutcomeRef.current?.(event.outcome);
        break;
      }

      case 'opinion.suggested': {
        onSuggestionRef.current?.(event.suggestion);
        break;
      }

      case 'error': {
        setConnectionState('error');
        setStreamError({
          code: event.code,
          message: event.message,
        });
        if (!event.recoverable) {
          setInterimSegment(null);
        }
        break;
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    if (demoTransportRef.current) {
      demoTransportRef.current.disconnect();
      demoTransportRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsDemoMode(false);
    setInterimSegment(null);
    setStreamError(null);
    setConnectionState('disconnected');
  }, []);

  const startDemoStream = useCallback(() => {
    stopStream();
    setIsDemoMode(true);
    const transport = new DemoTranscriptStreamTransport(
      () => targetLangRef.current
    );
    demoTransportRef.current = transport;
    transport.connect(handleIncomingEvent);
  }, [handleIncomingEvent, stopStream]);

  const connectBackendWebSocket = useCallback(
    (wsUrl: string) => {
      stopStream();
      setIsDemoMode(false);
      setStreamError(null);
      setConnectionState('connecting');

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          setConnectionState('listening');
        };

        socket.onmessage = (msgEvent) => {
          try {
            const parsed = JSON.parse(
              String(msgEvent.data)
            ) as IncomingTranscriptEvent;
            handleIncomingEvent(parsed);
          } catch {
            handleIncomingEvent({
              type: 'error',
              code: 'INVALID_EVENT_PAYLOAD',
              message: 'Received malformed streaming event from backend.',
              recoverable: true,
            });
          }
        };

        socket.onerror = () => {
          handleIncomingEvent({
            type: 'error',
            code: 'WEBSOCKET_ERROR',
            message: 'Unable to connect to the live streaming backend.',
            recoverable: false,
          });
        };

        socket.onclose = () => {
          wsRef.current = null;
          setConnectionState((prev) =>
            prev === 'error' ? 'error' : 'disconnected'
          );
          setInterimSegment(null);
        };
      } catch (err) {
        setConnectionState('error');
        setStreamError({
          code: 'WEBSOCKET_INIT_FAILED',
          message:
            err instanceof Error
              ? err.message
              : 'Failed to initialize WebSocket connection.',
        });
      }
    },
    [handleIncomingEvent, stopStream]
  );

  const clearError = useCallback(() => {
    setStreamError(null);
    setConnectionState((prev) => (prev === 'error' ? 'disconnected' : prev));
  }, []);

  useEffect(() => {
    return () => {
      if (demoTransportRef.current) {
        demoTransportRef.current.disconnect();
        demoTransportRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    connectionState,
    streamError,
    interimSegment,
    isDemoMode,
    startDemoStream,
    stopStream,
    connectBackendWebSocket,
    handleIncomingEvent,
    clearError,
  };
}
