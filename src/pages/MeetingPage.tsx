import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnonymousOpinionModal } from '../components/AnonymousOpinionModal';
import { LiveContextCard } from '../components/LiveContextCard';
import { LiveTranscriptPanel } from '../components/LiveTranscriptPanel';
import { MeetingHeader } from '../components/MeetingHeader';
import { OpinionSuggestionCard } from '../components/OpinionSuggestionCard';
import { QuickActionBar } from '../components/QuickActionBar';
import { useMicrophoneRecorder } from '../hooks/useMicrophoneRecorder';
import { useTranscriptStream } from '../hooks/useTranscriptStream';
import { useI18n } from '../i18n/I18nContext';
import type {
  LanguageCode,
  LiveContext,
  MeetingOutcome,
  OpinionSuggestion,
  RoomSession,
  TranscriptEntry,
} from '../types/meeting';

interface MeetingPageProps {
  session: RoomSession;
  transcript: TranscriptEntry[];
  liveContext: LiveContext | null;
  suggestions: OpinionSuggestion[];
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeRoom: (room: string) => void;
  onAddFinalStreamEntry: (entry: TranscriptEntry) => void;
  onCorrectSegment: (segmentId: string, text: string) => void;
  onUpdateSegmentTranslation: (
    segmentId: string,
    targetLanguage: LanguageCode,
    translatedText: string
  ) => void;
  onContextUpdated: (context: LiveContext) => void;
  onOutcomeUpdated: (outcome: MeetingOutcome) => void;
  onSendChat: (text: string) => void;
  onOpinionSuggested: (suggestion: OpinionSuggestion) => void;
  onRequestWait: () => void;
  onPublishOpinion: (
    originalText: string,
    translations: Partial<Record<LanguageCode, string>>,
    isAnonymous: boolean
  ) => void;
}

const TOAST_MS = 2000;

export const MeetingPage: React.FC<MeetingPageProps> = ({
  session,
  transcript,
  liveContext,
  suggestions,
  onChangeLanguage,
  onChangeRoom,
  onAddFinalStreamEntry,
  onCorrectSegment,
  onUpdateSegmentTranslation,
  onContextUpdated,
  onOutcomeUpdated,
  onSendChat,
  onOpinionSuggested,
  onRequestWait,
  onPublishOpinion,
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isAnonymousModalOpen, setIsAnonymousModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const {
    status: recorderStatus,
    durationSeconds,
    startRecording,
    stopRecording,
    releaseMicrophone,
  } = useMicrophoneRecorder();

  const {
    connectionState,
    streamError,
    interimSegment,
    isDemoMode,
    startDemoStream,
    stopStream,
    clearError: clearStreamError,
  } = useTranscriptStream({
    speechTargetLanguage: session.speechTargetLanguage,
    onFinalSegment: onAddFinalStreamEntry,
    onCorrectSegment,
    onUpdateSegmentTranslation,
    onContextUpdated,
    onOutcomeUpdated,
    onOpinionSuggested,
  });

  useEffect(
    () => () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    },
    []
  );

  const isRecording = recorderStatus === 'recording';
  const isRequesting = recorderStatus === 'requesting';
  const hasDemoData = transcript.some((entry) => entry.source === 'demo');

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), TOAST_MS);
  };

  const handleEndMeeting = () => {
    releaseMicrophone();
    stopStream();
    navigate('/meeting-end');
  };

  const handleSubmitAnonymous = (text: string) => {
    onPublishOpinion(text, {}, true);
    setIsAnonymousModalOpen(false);
    showToast(t.anonymousOpinion.submitted);
  };

  return (
    <div className="min-h-dvh min-[720px]:h-dvh w-full flex flex-col bg-gray-50 min-[720px]:overflow-hidden">
      <div className="shrink-0">
        <MeetingHeader
          session={session}
          isRecording={isRecording}
          isRequesting={isRequesting}
          recordingSeconds={durationSeconds}
          activeView="meeting"
          onChangeLanguage={onChangeLanguage}
          onChangeRoom={onChangeRoom}
          onToggleRecording={isRecording ? stopRecording : () => void startRecording()}
          onSwitchView={(view) => {
            if (view === 'notes') {
              handleEndMeeting();
            }
          }}
          // 회의 중 나가기는 회의 종료 화면(노트·번역 기록·결정 사항)으로 간다
          onExit={handleEndMeeting}
        />
      </div>

      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* 왼쪽 실시간 전사(약 58%) + 오른쪽 보조 패널(약 42%) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 min-[720px]:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4 items-stretch">
          <div className="min-h-0 flex flex-col">
            <LiveTranscriptPanel
              entries={transcript}
              interimSegment={interimSegment}
              connectionState={connectionState}
              streamError={streamError}
              isDemoMode={isDemoMode}
              speechTargetLanguage={session.speechTargetLanguage}
              onStartDemoStream={startDemoStream}
              onStopStream={stopStream}
              onClearStreamError={clearStreamError}
              onSendChat={onSendChat}
            />
          </div>

          {/* 오른쪽 칸: 빠른 요청은 고정, 의견 추천·대화 맥락은 남은 높이를 반씩 나눠 갖고 각자 안에서 스크롤 */}
          <aside className="min-h-0 flex flex-col gap-4">
            <div className="shrink-0">
              <QuickActionBar
                onRequestWait={onRequestWait}
                onOpenAnonymousOpinion={() => setIsAnonymousModalOpen(true)}
              />
            </div>
            <div className="flex-1 min-h-0 min-[720px]:min-h-[200px]">
              <OpinionSuggestionCard
                suggestions={suggestions}
                targetLanguage={session.speechTargetLanguage}
                isDemo={hasDemoData}
              />
            </div>
            <div className="flex-1 min-h-0 min-[720px]:min-h-[200px]">
              <LiveContextCard
                context={liveContext}
                targetLanguage={session.speechTargetLanguage}
                isDemo={hasDemoData}
              />
            </div>
          </aside>
        </div>
      </main>

      <AnonymousOpinionModal
        open={isAnonymousModalOpen}
        onClose={() => setIsAnonymousModalOpen(false)}
        onSubmit={handleSubmitAnonymous}
      />

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-full bg-gray-800 px-4 py-2 body-02 text-white shadow-01"
        >
          {toast}
        </div>
      )}
    </div>
  );
};
