import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ConversationContextCard } from '../components/ConversationContextCard';
import { LiveTranscriptPanel } from '../components/LiveTranscriptPanel';
import { MeetingHeader } from '../components/MeetingHeader';
import { ParticipantsGrid } from '../components/ParticipantsGrid';
import { ShareOpinionCard } from '../components/ShareOpinionCard';
import { SummaryCard } from '../components/SummaryCard';
import {
  MOCK_CONTEXT_DOCUMENTS,
  MOCK_PARTICIPANTS,
} from '../data/mockMeetingData';
import { useMicrophoneRecorder } from '../hooks/useMicrophoneRecorder';
import { useTranscriptStream } from '../hooks/useTranscriptStream';
import type { LanguageCode, RoomSession, TranscriptEntry } from '../types/meeting';

interface MeetingPageProps {
  session: RoomSession;
  transcript: TranscriptEntry[];
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeRoom: (room: string) => void;
  onAddTranscriptText: (recognizedText: string) => void;
  onAddFinalStreamEntry: (entry: TranscriptEntry) => void;
  onUpdateSegmentTranslation: (
    segmentId: string,
    targetLanguage: LanguageCode,
    translatedText: string
  ) => void;
  onPublishOpinion: (
    originalText: string,
    translations: Partial<Record<LanguageCode, string>>,
    isAnonymous: boolean
  ) => void;
  onExit: () => void;
}

export const MeetingPage: React.FC<MeetingPageProps> = ({
  session,
  transcript,
  onChangeLanguage,
  onChangeRoom,
  onAddTranscriptText,
  onAddFinalStreamEntry,
  onUpdateSegmentTranslation,
  onPublishOpinion,
  onExit,
}) => {
  const navigate = useNavigate();
  const {
    status: recorderStatus,
    error: recorderError,
    audioUrl,
    audioBlob,
    mimeType,
    durationSeconds,
    startRecording,
    stopRecording,
    clearRecording,
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
    onUpdateSegmentTranslation,
  });

  const isRecording = recorderStatus === 'recording';
  const isRequesting = recorderStatus === 'requesting';

  const handleEndMeeting = () => {
    releaseMicrophone();
    stopStream();
    navigate('/meeting-end');
  };

  const handleExit = () => {
    releaseMicrophone();
    stopStream();
    onExit();
    navigate('/');
  };

  const matchedSelfParticipant = MOCK_PARTICIPANTS.find(
    (p) => p.name.toLowerCase() === session.userName.trim().toLowerCase()
  );
  const activeSpeakerId =
    interimSegment?.speakerId ||
    (isRecording && matchedSelfParticipant ? matchedSelfParticipant.id : undefined);

  return (
    <div className="min-h-dvh min-[720px]:h-dvh w-full flex flex-col bg-gray-50 min-[720px]:overflow-hidden">
      <div className="shrink-0">
        <MeetingHeader
          session={session}
          isRecording={isRecording}
          isRequesting={isRequesting}
          activeView="meeting"
          onChangeLanguage={onChangeLanguage}
          onChangeRoom={onChangeRoom}
          onToggleRecording={
            isRecording ? handleEndMeeting : () => void startRecording()
          }
          onSwitchView={(view) => {
            if (view === 'notes') {
              handleEndMeeting();
            }
          }}
          onExit={handleExit}
        />
      </div>

      <main className="flex-1 min-h-0 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4">
        {/* Two-Column Desktop Dashboard: ~58% Left Transcript + ~42% Right Sidecar */}
        <div className="flex-1 min-h-0 grid grid-cols-1 min-[720px]:grid-cols-[minmax(0,58fr)_minmax(0,42fr)] gap-4 items-stretch">
          {/* Left Column (~58%) */}
          <div className="min-h-0 flex flex-col">
            <LiveTranscriptPanel
              entries={transcript}
              interimSegment={interimSegment}
              connectionState={connectionState}
              streamError={streamError}
              isDemoMode={isDemoMode}
              speechTargetLanguage={session.speechTargetLanguage}
              speakerName={session.userName}
              recorderStatus={recorderStatus}
              recorderError={recorderError}
              audioUrl={audioUrl}
              audioBlob={audioBlob}
              mimeType={mimeType}
              durationSeconds={durationSeconds}
              onStartDemoStream={startDemoStream}
              onStopStream={stopStream}
              onClearStreamError={clearStreamError}
              onStartRecording={() => void startRecording()}
              onStopRecording={stopRecording}
              onClearRecording={clearRecording}
              onAddTranscriptText={onAddTranscriptText}
            />
          </div>

          {/* Right Column (~42%) */}
          <div className="min-h-0 flex flex-col gap-4">
            <div className="shrink-0">
              <ParticipantsGrid
                participants={MOCK_PARTICIPANTS}
                activeSpeakerId={activeSpeakerId}
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <ShareOpinionCard
                userName={session.userName}
                targetLanguage={session.speechTargetLanguage}
                onPublishOpinion={onPublishOpinion}
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col">
              <ConversationContextCard documents={MOCK_CONTEXT_DOCUMENTS} />
            </div>
          </div>
        </div>

        {/* Full-Width Bottom Summary */}
        <div className="shrink-0">
          <SummaryCard
            speechTargetLanguage={session.speechTargetLanguage}
            isRecording={isRecording || isDemoMode}
            transcript={transcript}
            onOpenNotesReview={handleEndMeeting}
          />
        </div>
      </main>
    </div>
  );
};
