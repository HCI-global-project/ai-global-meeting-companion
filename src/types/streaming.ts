import type { LanguageCode } from './meeting';

/**
 * Connection lifecycle states for the real-time transcription & translation stream.
 */
export type StreamConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'listening'
  | 'error';

/**
 * Discriminated union of backend-to-frontend streaming events
 * (compatible with WebSocket messages or Server-Sent Events).
 */
export type IncomingTranscriptEvent =
  | StreamStatusEvent
  | TranscriptInterimEvent
  | TranscriptFinalEvent
  | TranslationDeltaEvent
  | StreamErrorEvent;

export interface StreamStatusEvent {
  type: 'status';
  state: StreamConnectionState;
  message?: string;
}

export interface TranscriptInterimEvent {
  type: 'transcript.interim';
  /** Stable identifier shared across interim updates and the corresponding final event */
  segmentId: string;
  speakerId: string;
  speakerName: string;
  /** Display timestamp, e.g. "14:22" */
  timestamp: string;
  sourceLanguage: LanguageCode | 'auto';
  /** In-progress recognized speech */
  text: string;
  /** Optional in-progress translation for the active target language */
  targetLanguage?: LanguageCode;
  translatedText?: string;
  badgeVariant?: 'neutral' | 'lavender';
  source?: 'stream' | 'demo';
}

export interface TranscriptFinalEvent {
  type: 'transcript.final';
  /** Matches the interim segmentId so the UI smoothly replaces interim with final */
  segmentId: string;
  speakerId: string;
  speakerName: string;
  timestamp: string;
  sourceLanguage: LanguageCode | 'auto';
  /** Finalized recognized speech */
  text: string;
  /** Optional single-target translation */
  targetLanguage?: LanguageCode;
  translatedText?: string;
  /** Optional multi-language translation map */
  translations?: Partial<Record<LanguageCode, string>>;
  badgeVariant?: 'neutral' | 'lavender';
  source?: 'stream' | 'demo';
}

export interface TranslationDeltaEvent {
  type: 'translation.delta';
  /** Segment ID of an existing interim or final transcript segment */
  segmentId: string;
  targetLanguage: LanguageCode;
  translatedText: string;
  isFinal?: boolean;
}

export interface StreamErrorEvent {
  type: 'error';
  code: string;
  message: string;
  recoverable?: boolean;
}

/**
 * Client-side adapter contract for connecting either Demo mode or a real backend transport.
 */
export interface TranscriptStreamTransport {
  connect: (
    onEvent: (event: IncomingTranscriptEvent) => void
  ) => void | Promise<void>;
  disconnect: () => void;
}
