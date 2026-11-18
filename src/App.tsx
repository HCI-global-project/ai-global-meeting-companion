/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getParticipantId } from './features/pipeline/participantIdentity';
import { I18nProvider } from './i18n/I18nContext';
import { TRANSLATIONS } from './i18n/translations';
import { LoginPage } from './pages/LoginPage';
import { MeetingEndPage } from './pages/MeetingEndPage';
import { MeetingPage } from './pages/MeetingPage';
import type {
  LanguageCode,
  LiveContext,
  MeetingOutcome,
  OpinionSuggestion,
  RoomSession,
  TranscriptEntry,
} from './types/meeting';

export default function App() {
  const [session, setSession] = useState<RoomSession>(() => ({
    participantId: getParticipantId(),
    roomCode: 'Lab-5',
    userName: 'Joe',
    userRole: 'designer',
    uiLanguage: 'ko',
    speechTargetLanguage: 'ko',
  }));

  // Real session state starts empty so hardcoded mock records never masquerade as meeting data
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [outcome, setOutcome] = useState<MeetingOutcome | null>(null);
  const [liveContext, setLiveContext] = useState<LiveContext | null>(null);
  // 최신 추천이 앞에 온다
  const [suggestions, setSuggestions] = useState<OpinionSuggestion[]>([]);

  const handleChangeUiLanguage = (lang: LanguageCode) => {
    setSession((prev) => ({
      ...prev,
      uiLanguage: lang,
    }));
  };

  const handleChangeHeaderLanguage = (lang: LanguageCode) => {
    setSession((prev) => ({
      ...prev,
      uiLanguage: lang,
      speechTargetLanguage: lang,
    }));
  };

  const handleAddFinalStreamEntry = useCallback((entry: TranscriptEntry) => {
    setTranscript((prev) => {
      const existingIdx = prev.findIndex((item) => item.id === entry.id);
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = entry;
        return next;
      }
      return [...prev, entry];
    });
  }, []);

  // 보정본으로 원문만 바꾼다. 번역은 보정본 기준으로 다시 올 때까지 이전 것을 둔다
  const handleCorrectSegment = useCallback((segmentId: string, text: string) => {
    setTranscript((prev) =>
      prev.map((item) => (item.id === segmentId ? { ...item, originalText: text } : item))
    );
  }, []);

  const handleUpdateSegmentTranslation = useCallback(
    (segmentId: string, targetLanguage: LanguageCode, translatedText: string) => {
      setTranscript((prev) =>
        prev.map((item) =>
          item.id === segmentId
            ? {
                ...item,
                translations: {
                  ...item.translations,
                  [targetLanguage]: translatedText,
                },
              }
            : item
        )
      );
    },
    []
  );

  const handleContextUpdated = useCallback((context: LiveContext) => {
    setLiveContext(context);
  }, []);

  // 회의 결과는 회의 화면에 따로 보이지 않고, 회의 종료 화면의 '회의 정리'로 모인다
  const handleOutcomeUpdated = useCallback((next: MeetingOutcome) => {
    setOutcome(next);
  }, []);

  const handleOpinionSuggested = useCallback((suggestion: OpinionSuggestion) => {
    setSuggestions((prev) =>
      prev.some((item) => item.id === suggestion.id) ? prev : [suggestion, ...prev]
    );
  }, []);

  // '잠깐 기다려주세요' — 누가 보냈는지 남기지 않는 요청 알림
  const handleRequestWait = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setTranscript((prev) => [
      ...prev,
      {
        id: `t-signal-${Date.now()}`,
        speakerId: 'p-anonymous',
        speakerName: '',
        timestamp: `${hh}:${mm}`,
        originalLanguage: 'auto',
        originalText: '',
        translations: {},
        badgeVariant: 'neutral',
        status: 'final',
        source: 'signal',
        isAnonymous: true,
      },
    ]);
  };

  const handleSendChat = (text: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    setTranscript((prev) => [
      ...prev,
      {
        id: `t-chat-${Date.now()}`,
        speakerId: 'p-self',
        speakerName: session.userName,
        timestamp: `${hh}:${mm}`,
        originalLanguage: 'auto',
        originalText: text,
        translations: {},
        badgeVariant: 'lavender',
        status: 'final',
        source: 'chat',
      },
    ]);
  };

  const handlePublishOpinion = (
    originalText: string,
    translations: Partial<Record<LanguageCode, string>>,
    isAnonymous: boolean
  ) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const newEntry: TranscriptEntry = {
      id: `t-opinion-${Date.now()}`,
      speakerId: isAnonymous ? 'p-anonymous' : 'p-self',
      speakerName: isAnonymous
        ? TRANSLATIONS[session.uiLanguage].anonymousOpinion.anonymousSpeaker
        : session.userName,
      timestamp: `${hh}:${mm}`,
      originalLanguage: 'auto',
      originalText,
      translations,
      badgeVariant: 'neutral',
      status: 'final',
      source: 'opinion',
      isAnonymous,
    };

    setTranscript((prev) => [...prev, newEntry]);
  };

  const handleExitSession = useCallback(() => {
    setTranscript([]);
    setOutcome(null);
    setLiveContext(null);
    setSuggestions([]);
  }, []);

  return (
    <I18nProvider
      uiLanguage={session.uiLanguage}
      onChangeUiLanguage={handleChangeUiLanguage}
    >
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <LoginPage
                session={session}
                onStartSession={(nextSession) => {
                  setSession(nextSession);
                }}
              />
            }
          />
          <Route
            path="/meeting"
            element={
              <MeetingPage
                session={session}
                transcript={transcript}
                onChangeLanguage={handleChangeHeaderLanguage}
                onChangeRoom={(room) =>
                  setSession((prev) => ({ ...prev, roomCode: room }))
                }
                onAddFinalStreamEntry={handleAddFinalStreamEntry}
                onCorrectSegment={handleCorrectSegment}
                onUpdateSegmentTranslation={handleUpdateSegmentTranslation}
                liveContext={liveContext}
                suggestions={suggestions}
                onContextUpdated={handleContextUpdated}
                onOutcomeUpdated={handleOutcomeUpdated}
                onSendChat={handleSendChat}
                onOpinionSuggested={handleOpinionSuggested}
                onRequestWait={handleRequestWait}
                onPublishOpinion={handlePublishOpinion}
              />
            }
          />
          <Route
            path="/meeting-end"
            element={
              <MeetingEndPage
                session={session}
                transcript={transcript}
                outcome={outcome}
                onOutcomeUpdated={handleOutcomeUpdated}
                onChangeLanguage={handleChangeHeaderLanguage}
                onChangeRoom={(room) =>
                  setSession((prev) => ({ ...prev, roomCode: room }))
                }
                onExit={handleExitSession}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </I18nProvider>
  );
}
