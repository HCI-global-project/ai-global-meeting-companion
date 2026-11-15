/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { INITIAL_NOTES, MOCK_DECISIONS } from './data/mockMeetingData';
import { I18nProvider } from './i18n/I18nContext';
import { TRANSLATIONS } from './i18n/translations';
import { LoginPage } from './pages/LoginPage';
import { MeetingEndPage } from './pages/MeetingEndPage';
import { MeetingPage } from './pages/MeetingPage';
import type {
  DecisionItem,
  LanguageCode,
  LiveContext,
  MeetingNote,
  MeetingOutcome,
  OpinionSuggestion,
  RoomSession,
  TranscriptEntry,
} from './types/meeting';

export default function App() {
  const [session, setSession] = useState<RoomSession>({
    roomCode: 'Lab-5',
    userName: 'Joe',
    userRole: 'designer',
    uiLanguage: 'ko',
    speechTargetLanguage: 'ko',
  });

  // Real session state starts empty so hardcoded mock records never masquerade as meeting data
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [decisions, setDecisions] = useState<DecisionItem[]>([]);
  const [liveContext, setLiveContext] = useState<LiveContext | null>(null);
  const [outcome, setOutcome] = useState<MeetingOutcome | null>(null);
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

  const handleAddTranscriptText = useCallback(
    (recognizedText: string) => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      const newEntry: TranscriptEntry = {
        id: `t-mic-${Date.now()}`,
        speakerId: 'p-self',
        speakerName: session.userName,
        timestamp: `${hh}:${mm}`,
        originalLanguage: 'auto',
        originalText: recognizedText,
        translations: {},
        badgeVariant: 'lavender',
        status: 'final',
        source: 'microphone',
      };

      setTranscript((prev) => [...prev, newEntry]);
    },
    [session.userName]
  );

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

  // 회의 결과가 갱신되면 회의 종료 화면의 결정 사항에도 반영한다 (직접 추가한 항목은 유지)
  const handleOutcomeUpdated = useCallback(
    (next: MeetingOutcome) => {
      setOutcome(next);
      const now = new Date();
      const stamp = `${session.roomCode} · ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const fromOutcome: DecisionItem[] = [
        ...next.decided.map((item, idx) => ({
          id: `outcome-decided-${idx}`,
          title: item.text,
          owner: '—',
          dueDate: stamp,
          status: 'Confirmed' as const,
        })),
        ...next.actionItems.map((item, idx) => ({
          id: `outcome-action-${idx}`,
          title: item.text,
          owner: item.owner ?? '—',
          dueDate: stamp,
          status: 'Pending Review' as const,
        })),
      ];
      setDecisions((prev) => {
        // 사용자가 이미 상태를 바꾼 항목은 그 상태를 지킨다
        const prevStatus = new Map(prev.map((d) => [`${d.id}|${d.title}`, d.status]));
        const merged = fromOutcome.map((d) => ({
          ...d,
          status: prevStatus.get(`${d.id}|${d.title}`) ?? d.status,
        }));
        return [...merged, ...prev.filter((d) => !d.id.startsWith('outcome-'))];
      });
    },
    [session.roomCode]
  );

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

  const handleAddNote = (content: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const newNote: MeetingNote = {
      id: `note-${Date.now()}`,
      author: session.userName,
      timestamp: `${hh}:${mm}`,
      content,
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleAddDecision = (title: string) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const newDecision: DecisionItem = {
      id: `dec-${Date.now()}`,
      title,
      owner: session.userName,
      dueDate: `${session.roomCode} · ${hh}:${mm}`,
      status: 'Pending Review',
    };
    setDecisions((prev) => [newDecision, ...prev]);
  };

  const handleToggleDecisionStatus = (id: string) => {
    setDecisions((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === 'Confirmed' ? 'Pending Review' : 'Confirmed',
            }
          : item
      )
    );
  };

  const handleLoadDemoNotes = () => {
    setNotes((prev) => {
      const existingIds = new Set(prev.map((n) => n.id));
      const tagged = INITIAL_NOTES.filter((n) => !existingIds.has(n.id)).map(
        (n) => ({ ...n, isDemo: true })
      );
      return [...prev, ...tagged];
    });
  };

  const handleLoadDemoDecisions = () => {
    setDecisions((prev) => {
      const existingIds = new Set(prev.map((d) => d.id));
      const tagged = MOCK_DECISIONS.filter((d) => !existingIds.has(d.id)).map(
        (d) => ({ ...d, isDemo: true })
      );
      return [...prev, ...tagged];
    });
  };

  const handleExitSession = useCallback(() => {
    setTranscript([]);
    setNotes([]);
    setDecisions([]);
    setLiveContext(null);
    setOutcome(null);
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
                onAddTranscriptText={handleAddTranscriptText}
                onAddFinalStreamEntry={handleAddFinalStreamEntry}
                onUpdateSegmentTranslation={handleUpdateSegmentTranslation}
                liveContext={liveContext}
                outcome={outcome}
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
                notes={notes}
                transcript={transcript}
                decisions={decisions}
                onChangeLanguage={handleChangeHeaderLanguage}
                onChangeRoom={(room) =>
                  setSession((prev) => ({ ...prev, roomCode: room }))
                }
                onAddNote={handleAddNote}
                onAddDecision={handleAddDecision}
                onToggleDecisionStatus={handleToggleDecisionStatus}
                onLoadDemoNotes={handleLoadDemoNotes}
                onLoadDemoDecisions={handleLoadDemoDecisions}
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
