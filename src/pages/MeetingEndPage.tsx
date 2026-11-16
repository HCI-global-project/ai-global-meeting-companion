import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LavenderBackdrop } from '../components/LavenderBackdrop';
import { MeetingHeader } from '../components/MeetingHeader';
import { NotesReviewView } from '../components/NotesReviewView';
import type {
  DecisionItem,
  LanguageCode,
  MeetingNote,
  RoomSession,
  TranscriptEntry,
} from '../types/meeting';

interface MeetingEndPageProps {
  session: RoomSession;
  notes: MeetingNote[];
  transcript: TranscriptEntry[];
  decisions: DecisionItem[];
  onChangeLanguage: (lang: LanguageCode) => void;
  onChangeRoom: (room: string) => void;
  onAddNote: (content: string) => void;
  onAddDecision: (title: string) => void;
  onToggleDecisionStatus: (id: string) => void;
  onLoadDemoNotes: () => void;
  onLoadDemoDecisions: () => void;
  onExit: () => void;
}

export const MeetingEndPage: React.FC<MeetingEndPageProps> = ({
  session,
  notes,
  transcript,
  decisions,
  onChangeLanguage,
  onChangeRoom,
  onAddNote,
  onAddDecision,
  onToggleDecisionStatus,
  onLoadDemoNotes,
  onLoadDemoDecisions,
  onExit,
}) => {
  const navigate = useNavigate();

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
        <NotesReviewView
          notes={notes}
          transcript={transcript}
          decisions={decisions}
          speechTargetLanguage={session.speechTargetLanguage}
          userName={session.userName}
          onAddNote={onAddNote}
          onAddDecision={onAddDecision}
          onToggleDecisionStatus={onToggleDecisionStatus}
          onLoadDemoNotes={onLoadDemoNotes}
          onLoadDemoDecisions={onLoadDemoDecisions}
          onBackToMeeting={handleBackToMeeting}
        />
      </main>
    </div>
  );
};
