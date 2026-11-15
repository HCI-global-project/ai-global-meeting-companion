export type LanguageCode = 'ko' | 'en' | 'ja' | 'my' | 'ru' | 'es';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  nativeLanguage: LanguageCode;
  languageLabel: string;
  badgeVariant: 'neutral' | 'lavender';
  isOnline: boolean;
}

export interface TranscriptEntry {
  id: string;
  speakerId: string;
  speakerName: string;
  timestamp: string;
  originalLanguage: LanguageCode | 'auto';
  originalText: string;
  translations: Partial<Record<LanguageCode, string>>;
  badgeVariant: 'neutral' | 'lavender';
  status?: 'interim' | 'final';
  // signal: '잠깐 기다려주세요' 같은 참여자 요청 알림, chat: 전사 패널에서 직접 입력한 채팅
  source?: 'microphone' | 'opinion' | 'stream' | 'demo' | 'signal' | 'chat';
  isAnonymous?: boolean;
}

/**
 * 회의 맥락 — 백엔드(live-context)가 발화를 모아 주기적으로 갱신한다.
 * 필드 구성은 Nuncheet의 live_context 테이블을 따른다.
 */
export interface LiveContext {
  currentTopic: string | null;
  rollingSummary: string;
  keywords: string[];
  openQuestions: string[];
  // 회의 언어(한국어)가 아닌 참여자를 위한 주제·요약 번역
  translations?: Partial<Record<LanguageCode, { topic: string; summary: string }>>;
  updatedAt: string;
}

export interface OutcomeItem {
  text: string;
  // 할 일의 담당자
  owner?: string;
  translations?: Partial<Record<LanguageCode, string>>;
}

/**
 * 회의 결과 누적 — 지금까지 정해진 것·할 일·아직 정해지지 않은 것.
 * 대화 맥락이 '지금'을 보여 준다면, 이건 회의가 남긴 결과를 쌓는다.
 */
export interface MeetingOutcome {
  decided: OutcomeItem[];
  actionItems: OutcomeItem[];
  undecided: OutcomeItem[];
  updatedAt: string;
}

export type OpinionStance = 'agree' | 'disagree' | 'alternative';

/**
 * 의견을 낼 만한 발화에 대해 바로 말할 수 있는 세 문장(동의/반대/다른 의견).
 * 필드 구성은 Nuncheet의 opinion_suggestions 테이블을 따른다.
 */
export interface OpinionSuggestion {
  id: string;
  segmentId: string;
  targetText: string;
  source: 'auto' | 'manual';
  agree: string;
  disagree: string;
  alternative: string;
  // 세 문장의 뜻을 참여자 언어로 옮긴 것
  gloss?: Partial<Record<LanguageCode, Record<OpinionStance, string>>>;
  createdAt: string;
}

export interface MeetingNote {
  id: string;
  author: string;
  timestamp: string;
  content: string;
  translatedContent?: Partial<Record<LanguageCode, string>>;
  isDemo?: boolean;
}

export interface DecisionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'Confirmed' | 'Pending Review';
  isDemo?: boolean;
}

export interface RoomSession {
  roomCode: string;
  userName: string;
  userRole: string;
  uiLanguage: LanguageCode;
  speechTargetLanguage: LanguageCode;
}

export type AppView = 'meeting' | 'notes' | 'join';
