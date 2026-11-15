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
  source?: 'microphone' | 'opinion' | 'stream' | 'demo';
  isAnonymous?: boolean;
}

export interface ContextDocument {
  id: string;
  title: string;
  type: 'agenda' | 'brief' | 'glossary';
  summary: string;
  updatedAt: string;
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
