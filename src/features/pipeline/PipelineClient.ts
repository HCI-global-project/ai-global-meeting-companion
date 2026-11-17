import type { SegmentDraft } from '../stt/segmentation/types';
import type { LanguageCode, LiveContext, MeetingOutcome } from '../../types/meeting';
import type { IncomingTranscriptEvent, TranscriptFinalEvent } from '../../types/streaming';

/**
 * 프론트가 AI 처리를 부르는 유일한 창구.
 * 지금은 FastAPI 구현만 있다. 서버리스(Supabase Edge Function)로 돌아가야 하면
 * 같은 인터페이스로 구현체를 하나 더 만들고 createPipelineClient 에서 고르면 된다.
 */
export interface PipelineParticipant {
  id: string;
  name: string;
  role: string;
  language: LanguageCode;
  // Supabase 익명 로그인 사용자 id. 있으면 추천을 RLS 로 본인에게만 보인다
  userId?: string;
}

export interface MeetingState {
  primaryLanguage: LanguageCode;
  languages: LanguageCode[];
  segments: TranscriptFinalEvent[];
  context: LiveContext | null;
  outcome: MeetingOutcome | null;
}

export interface PipelineConnection {
  /** 녹음 기기를 맡겠다고 알린다. 서버가 recording.changed 또는 recording.denied 로 답한다 */
  startRecording(): void;
  stopRecording(): void;
  /** 녹음 기기: 분절기가 확정한 발화를 보낸다 */
  sendSegment(segment: SegmentDraft, clientSegmentId?: string): void;
  /** 녹음 기기: 아직 확정 전인 글자. 서버 실험 설정이 켜져 있으면 다른 화면에 임시 번역과 함께 보인다 */
  sendInterim(text: string, language?: string): void;
  /** '화자 2 = 민지'. participantId 가 null 이면 지정 해제 */
  assignSpeaker(speakerKey: string, participantId: string | null): void;
  /** 녹음 기기: 회의 주제·용어를 알려 보정 정확도를 높인다 */
  configure(info: { topic?: string; terms?: string[] }): void;
  close(): void;
}

export interface ConnectHandlers {
  onOpen?: () => void;
  onEvent: (event: IncomingTranscriptEvent) => void;
  // 서버가 닫은 이유 코드. 4403 이면 접속 코드가 없거나 틀렸다(다시 붙지 않는다)
  onClose?: (code?: number) => void;
}

export interface PipelineClient {
  getSonioxKey(participantId?: string): Promise<string>;
  connect(meetingId: string, participant: PipelineParticipant, handlers: ConnectHandlers): PipelineConnection;
  sendMessage(
    meetingId: string,
    message: { participantId: string; text: string; kind: 'chat' | 'opinion'; anonymous?: boolean }
  ): Promise<void>;
  requestWait(meetingId: string): Promise<void>;
  requestOpinion(meetingId: string, participantId: string, segmentId: string): Promise<void>;
  addNote(
    meetingId: string,
    note: { author: string; content: string; language?: LanguageCode }
  ): Promise<{ id: string; translatedContent: Partial<Record<LanguageCode, string>> }>;
  fetchState(meetingId: string): Promise<MeetingState>;
}
