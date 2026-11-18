import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LavenderBackdrop } from '../components/LavenderBackdrop';
import { MeetingHeader } from '../components/MeetingHeader';
import { MeetingSummaryView } from '../components/MeetingSummaryView';
import { createPipelineClient } from '../features/pipeline/createPipelineClient';
import type { LanguageCode, MeetingOutcome, RoomSession, TranscriptEntry } from '../types/meeting';

interface MeetingEndPageProps {
  session: RoomSession;
  transcript: TranscriptEntry[];
  outcome: MeetingOutcome | null;
  onOutcomeUpdated: (outcome: MeetingOutcome) => void;
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeRoom: (room: string) => void;
  onExit: () => void;
}

export const MeetingEndPage: React.FC<MeetingEndPageProps> = ({
  session,
  transcript,
  outcome,
  onOutcomeUpdated,
  onChangeLanguage,
  onChangeRoom,
  onExit,
}) => {
  const navigate = useNavigate();
  const client = useMemo(() => createPipelineClient(), []);
  const { roomCode } = session;

  // 들어오자마자 서버에 마무리를 부탁한다. 회의 결과는 발화를 모아 정리해서, 그냥 두면 마지막 결정이 빠져 있다
  const [finalizing, setFinalizing] = useState(true);
  useEffect(() => {
    let cancelled = false;
    client
      .finalizeOutcome(roomCode)
      .then((next) => {
        if (!cancelled && next) onOutcomeUpdated(next);
      })
      // 서버에 못 닿으면 회의 중에 받아 둔 결과를 그대로 보인다
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFinalizing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [client, roomCode, onOutcomeUpdated]);

  const handleBackToMeeting = () => {
    navigate('/meeting');
  };

  const handleExit = () => {
    onExit();
    navigate('/');
  };

  return (
    <div className="min-h-screen w-full flex flex-col relative">
      <LavenderBackdrop />

      <MeetingHeader
        session={session}
        isRecording={false}
        activeView="notes"
        onChangeLanguage={onChangeLanguage}
        onChangeRoom={onChangeRoom}
        onToggleRecording={handleBackToMeeting}
        onSwitchView={(view) => {
          if (view === 'meeting') {
            handleBackToMeeting();
          }
        }}
        onExit={handleExit}
      />

      <main className="flex-1">
        <MeetingSummaryView
          outcome={outcome}
          transcript={transcript}
          speechTargetLanguage={session.speechTargetLanguage}
          finalizing={finalizing}
          onBackToMeeting={handleBackToMeeting}
        />
      </main>
    </div>
  );
};
