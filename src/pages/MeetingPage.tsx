import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnonymousOpinionModal } from '../components/AnonymousOpinionModal';
import { LiveContextCard } from '../components/LiveContextCard';
import { LiveTranscriptPanel } from '../components/LiveTranscriptPanel';
import { MeetingNoticeStack } from '../components/MeetingNoticeStack';
import { MeetingHeader } from '../components/MeetingHeader';
import { OpinionSuggestionCard } from '../components/OpinionSuggestionCard';
import { QuickActionBar } from '../components/QuickActionBar';
import { ToastStack } from '../components/ToastStack';
import { PipelineRequestError } from '../features/pipeline/FastApiPipelineClient';
import { isRosterEvent } from '../features/roster/roster';
import { useLiveTranscription } from '../hooks/useLiveTranscription';
import { useMeetingConnection } from '../hooks/useMeetingConnection';
import { useMeetingNotices } from '../hooks/useMeetingNotices';
import { useMeetingRoster } from '../hooks/useMeetingRoster';
import { MIC_TOAST, STREAM_TOAST, useMeetingStatusToasts } from '../hooks/useMeetingStatusToasts';
import { useToasts } from '../hooks/useToasts';
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
import type { IncomingTranscriptEvent } from '../types/streaming';

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
  // 아래 세 가지는 서버에 연결되지 않았을 때 내 화면에만 띄우는 대체 동작이다
  onSendChat: (text: string) => void;
  onRequestWait: () => void;
  onPublishOpinion: (
    originalText: string,
    translations: Partial<Record<LanguageCode, string>>,
    isAnonymous: boolean
  ) => void;
  onOpinionSuggested: (suggestion: OpinionSuggestion) => void;
}

const SPEAKER_HINT_MS = 4000;
const PRIMARY_LANGUAGE: LanguageCode = 'ko';

function clock(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

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
  const { toasts, show: showToast, dismiss: dismissToast } = useToasts();
  const { roster, handleRosterEvent, assignLocally } = useMeetingRoster();
  const speakerHintShownRef = useRef(false);
  const { notices, notify, dismiss: dismissNotice } = useMeetingNotices();
  // 이미 본 줄. 들어오기 전 줄과 불러온 지난 기록에는 알림을 띄우지 않는다
  const seenEntryIdsRef = useRef(new Set(transcript.map((entry) => entry.id)));

  const {
    connectionState,
    streamError,
    interimSegment: demoInterim,
    isDemoMode,
    startDemoStream,
    stopStream,
    handleIncomingEvent,
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

  const pipeline = useMeetingConnection({ session, onEvent: handlePipelineEvent });
  const online = pipeline.status === 'open';

  const languageHints = [
    // lab 처럼 영어는 늘 넣는다. 한국어 회의 중에도 영어로 잠깐 말하는 경우가 있다
    ...new Set([PRIMARY_LANGUAGE, 'en', ...roster.participants.map((p) => p.language)]),
  ];
  const live = useLiveTranscription({
    client: pipeline.client,
    getConnection: pipeline.getConnection,
    selfId: session.participantId,
    recorderId: roster.recorderId,
    languageHints,
    participantNames: roster.participants.map((p) => p.name),
  });

  // 서버 이벤트를 받을 곳으로 나눈다: 명단, 짧게 알릴 오류, 나머지는 전사 스트림
  function handlePipelineEvent(event: IncomingTranscriptEvent) {
    if (isRosterEvent(event)) {
      handleRosterEvent(event);
      // 녹음 자리를 (다시) 받았으면 끊긴 사이 저장되지 못한 발화를 다시 보낸다
      if (event.type === 'recording.changed' && event.recorderId === session.participantId) {
        live.resendUnsaved();
      }
      if (event.type === 'recording.denied') {
        live.cancelRequest();
        showToast({
          id: 'recorder-busy',
          tone: 'info',
          message: t.live.recorderBusy(event.recorderName),
          durationMs: SPEAKER_HINT_MS,
        });
      }
      return;
    }
    if (event.type === 'segment.saved') {
      live.markSaved(event.clientSegmentId);
      return;
    }
    if (event.type === 'status' || event.type === 'pong') return;
    // 녹음 중인데 서버가 이 연결을 녹음 기기로 모르면 조용히 자리를 다시 맡는다
    if (event.type === 'error' && event.code === 'NOT_RECORDER') {
      live.reclaim();
      return;
    }
    if (event.type === 'error' && event.recoverable) {
      showToast({ id: 'server-error', tone: 'error', message: event.message });
      return;
    }
    handleIncomingEvent(event);
  }

  // 늦게 들어왔거나 다시 붙었을 때 지난 발화·맥락을 채운다. 같은 id 는 App 에서 덮어쓴다
  const { client } = pipeline;
  const { roomCode } = session;
  useEffect(() => {
    if (!online) return;
    let cancelled = false;
    client
      .fetchState(roomCode)
      .then((state) => {
        if (cancelled) return;
        state.segments.forEach((segment) => {
          seenEntryIdsRef.current.add(segment.segmentId);
          handleIncomingEvent(segment);
        });
        if (state.context) onContextUpdated(state.context);
        if (state.outcome) onOutcomeUpdated(state.outcome);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [online, client, roomCode, handleIncomingEvent, onContextUpdated, onOutcomeUpdated]);

  useMeetingStatusToasts({
    pipelineStatus: pipeline.status,
    liveState: live.state,
    liveFailure: live.failure,
    streamError,
    show: showToast,
    dismiss: dismissToast,
  });

  const isRecording = live.state === 'listening';
  const isRequesting = live.state === 'requesting' || live.state === 'connecting';
  const otherRecorder =
    roster.recorderId && roster.recorderId !== session.participantId
      ? roster.participants.find((p) => p.id === roster.recorderId)
      : undefined;
  const hasDemoData = transcript.some((entry) => entry.source === 'demo');

  // 녹음 기기에서만 보이는 말하는 중인 문장. 데모 스트림이 돌면 데모 쪽을 보여 준다
  const interimSegment: TranscriptEntry | null =
    demoInterim ??
    (live.interimText
      ? {
          id: 'live-interim',
          speakerId: 'live',
          speakerName: '',
          timestamp: clock(),
          originalLanguage: 'auto',
          originalText: live.interimText,
          translations: {},
          badgeVariant: 'neutral',
          status: 'interim',
          source: 'stream',
        }
      : null);

  // 지정 안 된 화자가 처음 보이면 이름을 눌러 지정할 수 있다고 한 번만 알려 준다
  const hasUnassignedSpeaker = transcript.some(
    (entry) => entry.speakerKey && !roster.speakers[entry.speakerKey]
  );
  useEffect(() => {
    if (!hasUnassignedSpeaker || speakerHintShownRef.current) return;
    speakerHintShownRef.current = true;
    showToast({
      id: 'speaker-hint',
      tone: 'info',
      message: t.speakers.assignHint,
      durationMs: SPEAKER_HINT_MS,
    });
  }, [hasUnassignedSpeaker, showToast, t]);

  // 새로 들어온 '잠깐 기다려 주세요'·익명 의견은 헤더 아래 알림으로 띄운다
  useEffect(() => {
    for (const entry of transcript) {
      if (seenEntryIdsRef.current.has(entry.id)) continue;
      seenEntryIdsRef.current.add(entry.id);
      if (entry.source === 'signal') notify({ entryId: entry.id, kind: 'wait' });
      else if (entry.source === 'opinion' && entry.isAnonymous) {
        notify({ entryId: entry.id, kind: 'anonymous' });
      }
    }
  }, [transcript, notify]);

  // 사용량 한도에 걸렸으면 몇 초 뒤 다시 되는지 알려 준다. 조용히 실패하지 않게
  const sendFailed = (error?: unknown) => {
    const limited = error instanceof PipelineRequestError && error.status === 429;
    const message = limited ? t.live.slowDown(error.retryAfterSeconds ?? 60) : t.live.sendFailed;
    showToast({ id: 'send-failed', tone: 'error', message });
  };

  const handleAssignSpeaker = (speakerKey: string, participantId: string | null) => {
    assignLocally(speakerKey, participantId);
    pipeline.getConnection()?.assignSpeaker(speakerKey, participantId);
  };

  const handleSendChat = (text: string) => {
    if (!online) return onSendChat(text);
    pipeline.client
      .sendMessage(roomCode, { participantId: session.participantId, text, kind: 'chat' })
      .catch(sendFailed);
  };

  const handleRequestWait = () => {
    if (!online) return onRequestWait();
    pipeline.client.requestWait(roomCode).catch(sendFailed);
  };

  // 보낸 의견도 헤더 아래 알림으로 보이므로 따로 '보냈어요' 토스트는 띄우지 않는다
  const handleSubmitAnonymous = (text: string) => {
    setIsAnonymousModalOpen(false);
    if (!online) {
      onPublishOpinion(text, {}, true);
      return;
    }
    pipeline.client
      .sendMessage(roomCode, {
        participantId: session.participantId,
        text,
        kind: 'opinion',
        anonymous: true,
      })
      .catch(sendFailed);
  };

  // 오류 토스트를 닫으면 그 오류 상태도 함께 지운다
  const handleDismissToast = (id: string) => {
    dismissToast(id);
    if (id === STREAM_TOAST) clearStreamError();
    if (id === MIC_TOAST) live.clearFailure();
  };

  const handleEndMeeting = () => {
    live.stop();
    stopStream();
    navigate('/meeting-end');
  };

  return (
    <div className="min-h-dvh min-[720px]:h-dvh w-full flex flex-col bg-gray-50 min-[720px]:overflow-hidden">
      <div className="shrink-0">
        <MeetingHeader
          session={session}
          isRecording={isRecording}
          isRequesting={isRequesting}
          recordingSeconds={live.seconds}
          recordingLockedBy={otherRecorder?.name ?? null}
          recordingUnavailable={!online}
          activeView="meeting"
          onChangeLanguage={onChangeLanguage}
          onChangeRoom={onChangeRoom}
          onToggleRecording={isRecording || isRequesting ? live.stop : live.start}
          onSwitchView={(view) => {
            if (view === 'notes') {
              handleEndMeeting();
            }
          }}
          // 회의 중 나가기는 회의 종료 화면(노트·번역 기록·결정 사항)으로 간다
          onExit={handleEndMeeting}
        />
      </div>

      <main className="relative flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        <MeetingNoticeStack
          notices={notices}
          entries={transcript}
          targetLanguage={session.speechTargetLanguage}
          onDismiss={dismissNotice}
        />

        {/* 왼쪽 실시간 전사(약 58%) + 오른쪽 보조 패널(약 42%) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 min-[720px]:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4 items-stretch">
          <div className="min-h-0 flex flex-col">
            <LiveTranscriptPanel
              entries={transcript}
              interimSegment={interimSegment}
              connectionState={connectionState}
              isDemoMode={isDemoMode}
              speechTargetLanguage={session.speechTargetLanguage}
              onStartDemoStream={startDemoStream}
              onStopStream={stopStream}
              onSendChat={handleSendChat}
              roster={roster}
              selfId={session.participantId}
              onAssignSpeaker={handleAssignSpeaker}
            />
          </div>

          {/* 오른쪽 칸: 빠른 요청 버튼은 위에 고정하고, 그 아래 카드들은 lab 처럼 내용만큼 높이를 갖고
              넘치면 함께 스크롤한다. 카드마다 높이를 반씩 나누면 둘 다 일부만 보여 읽을 수 없었다 */}
          <aside className="min-h-0 flex flex-col gap-4">
            <div className="shrink-0">
              <QuickActionBar
                onRequestWait={handleRequestWait}
                onOpenAnonymousOpinion={() => setIsAnonymousModalOpen(true)}
              />
            </div>
            <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto loop-scroll">
            <div className="shrink-0">
              <OpinionSuggestionCard
                suggestions={suggestions}
                targetLanguage={session.speechTargetLanguage}
                isDemo={hasDemoData}
              />
            </div>
            <div className="shrink-0">
              <LiveContextCard
                context={liveContext}
                targetLanguage={session.speechTargetLanguage}
                isDemo={hasDemoData}
              />
            </div>
            </div>
          </aside>
        </div>
      </main>

      <AnonymousOpinionModal
        open={isAnonymousModalOpen}
        onClose={() => setIsAnonymousModalOpen(false)}
        onSubmit={handleSubmitAnonymous}
      />

      <ToastStack toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};
