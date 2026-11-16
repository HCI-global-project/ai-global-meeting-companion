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
  // 마이크 하나로 녹음한 음성 발화의 화자('녹음 회차:번호'). 참여자가 누구인지 지정할 수 있다
  speakerKey?: string | null;
  speakerNumber?: string | null;
  // 서버가 아는 말한 사람. 채팅이거나 화자가 지정됐을 때 있다
  participantId?: string | null;
  // 진행 중인 문장에서 STT 가 아직 확정하지 않은 뒷부분. 확정되며 바뀔 수 있어 흐리게 보여 준다
  interimGuess?: string;
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
  // 주제·요약을 쓴 언어(회의 주 언어). 없으면 한국어로 본다
  language?: LanguageCode;
  // 그 언어가 아닌 참여자를 위한 주제·요약 번역
  translations?: Partial<Record<LanguageCode, { topic: string; summary: string }>>;
  updatedAt: string;
}

export interface OutcomeItem {
  // 서버가 주는 고정 id. 항목 순서가 바뀌어도 사용자가 바꾼 상태가 따라간다
  id: string;
  text: string;
  // 할 일의 담당자
  owner?: string | null;
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
  // 항목을 쓴 언어. 없으면 한국어로 본다
  language?: LanguageCode;
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
  // 세 문장을 쓴 언어(회의 주 언어). 없으면 한국어로 본다
  language?: LanguageCode;
  // 세 문장의 뜻을 참여자 언어로 옮긴 것
  gloss?: Partial<Record<LanguageCode, Record<OpinionStance, string>>>;
  // 실험 조건: 영어로 바로 말할 수 있는 문장
  english?: Record<OpinionStance, string> | null;
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
  // 이 탭의 참여자 id (features/pipeline/participantIdentity)
  participantId: string;
  roomCode: string;
  userName: string;
  userRole: string;
  uiLanguage: LanguageCode;
  speechTargetLanguage: LanguageCode;
}

export type AppView = 'meeting' | 'notes' | 'join';
