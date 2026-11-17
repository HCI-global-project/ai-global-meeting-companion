import type {
  LanguageCode,
  LiveContext,
  MeetingOutcome,
  OpinionSuggestion,
  TranscriptEntry,
} from './meeting';
import type { PipelineParticipant } from '../features/pipeline/PipelineClient';

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
  | TranscriptCorrectedEvent
  | TranslationDeltaEvent
  | ContextUpdatedEvent
  | OutcomeUpdatedEvent
  | OpinionSuggestedEvent
  | RosterEvent
  | SegmentSavedEvent
  | PongEvent
  | StreamErrorEvent;

/** 참여자·화자 지정·녹음 기기 상태. 회의 명단(useMeetingRoster)이 받는다 */
export type RosterEvent =
  | SessionSnapshotEvent
  | ParticipantJoinedEvent
  | SpeakerAssignedEvent
  | RecordingChangedEvent
  | RecordingDeniedEvent;

export interface SessionSnapshotEvent {
  type: 'session.snapshot';
  participants: PipelineParticipant[];
  speakers: Record<string, string>;
  recorderId: string | null;
}

export interface ParticipantJoinedEvent {
  type: 'participant.joined';
  participant: PipelineParticipant;
}

export interface SpeakerAssignedEvent {
  type: 'speaker.assigned';
  speakerKey: string;
  participantId: string | null;
}

export interface RecordingChangedEvent {
  type: 'recording.changed';
  recorderId: string | null;
}

/** 다른 기기가 이미 녹음 중이라 녹음을 시작하지 못했다 */
export interface RecordingDeniedEvent {
  type: 'recording.denied';
  recorderId: string | null;
  recorderName: string;
}

export interface SegmentSavedEvent {
  type: 'segment.saved';
  clientSegmentId: string | null;
  segmentId: string;
}

export interface PongEvent {
  type: 'pong';
}

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
  // 서버 임시 번역(실험): 방에 있는 언어별 번역. 빈 text 는 임시 줄을 지우라는 뜻이다
  translations?: Partial<Record<LanguageCode, string>>;
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
  // 서버는 음성(stream) 외에 채팅·의견·요청 알림도 같은 이벤트로 보낸다
  source?: TranscriptEntry['source'];
  isAnonymous?: boolean;
  speakerKey?: string | null;
  speakerNumber?: string | null;
  participantId?: string | null;
  // 서버가 발화를 저장한 시각(ISO). 화면에서 이어 말한 줄을 한 카드로 묶을 때 쓴다
  createdAt?: string;
}

/** 서버가 STT 오인식을 고친 뒤 보내는 보정본. 번역은 보정본 기준으로 다시 온다 */
export interface TranscriptCorrectedEvent {
  type: 'transcript.corrected';
  segmentId: string;
  text: string;
}

export interface TranslationDeltaEvent {
  type: 'translation.delta';
  /** Segment ID of an existing interim or final transcript segment */
  segmentId: string;
  targetLanguage: LanguageCode;
  translatedText: string;
  isFinal?: boolean;
}

export interface ContextUpdatedEvent {
  type: 'context.updated';
  context: LiveContext;
}

export interface OutcomeUpdatedEvent {
  type: 'outcome.updated';
  outcome: MeetingOutcome;
}

export interface OpinionSuggestedEvent {
  type: 'opinion.suggested';
  suggestion: OpinionSuggestion;
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
