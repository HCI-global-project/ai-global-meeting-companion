import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, EyeOff, Plus, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type {
  DecisionItem,
  LanguageCode,
  MeetingNote,
  TranscriptEntry,
} from '../types/meeting';
import {
  BookmarkOutlineIcon,
  ClockOutlineIcon,
  PencilTrayIcon,
} from './LoopIcons';

interface NotesReviewViewProps {
  notes: MeetingNote[];
  transcript: TranscriptEntry[];
  decisions: DecisionItem[];
  speechTargetLanguage: LanguageCode;
  userName: string;
  onAddNote: (content: string) => void;
  onAddDecision: (title: string) => void;
  onToggleDecisionStatus: (id: string) => void;
  onLoadDemoNotes: () => void;
  onLoadDemoDecisions: () => void;
  onBackToMeeting: () => void;
}

export const NotesReviewView: React.FC<NotesReviewViewProps> = ({
  notes,
  transcript,
  decisions,
  speechTargetLanguage,
  userName,
  onAddNote,
  onAddDecision,
  onToggleDecisionStatus,
  onLoadDemoNotes,
  onLoadDemoDecisions,
  onBackToMeeting,
}) => {
  const { t } = useI18n();
  const [notesOpen, setNotesOpen] = useState(notes.length > 0);
  const [historyOpen, setHistoryOpen] = useState(transcript.length > 0);
  const [decisionsOpen, setDecisionsOpen] = useState(decisions.length > 0);

  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const [decisionInput, setDecisionInput] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

  useEffect(() => {
    if (notes.length > 0) setNotesOpen(true);
  }, [notes.length]);

  useEffect(() => {
    if (transcript.length > 0) setHistoryOpen(true);
  }, [transcript.length]);

  useEffect(() => {
    if (decisions.length > 0) setDecisionsOpen(true);
  }, [decisions.length]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed) {
      setNoteError(t.meetingEnd.noteValidationEmpty);
      return;
    }
    onAddNote(trimmed);
    setNoteInput('');
    setNoteError(null);
  };

  const handleSaveDecision = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = decisionInput.trim();
    if (!trimmed) {
      setDecisionError(t.meetingEnd.decisionValidationEmpty);
      return;
    }
    onAddDecision(trimmed);
    setDecisionInput('');
    setDecisionError(null);
  };

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6">
      {/* Large Rounded White Container over Lavender Backdrop */}
      <div className="bg-white/95 backdrop-blur-sm border border-[#EAE8F3] rounded-[28px] shadow-[0_12px_40px_rgba(91,73,234,0.06)] p-5 sm:p-8 flex flex-col gap-5">
        {/* Subtle Back Return Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToMeeting}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#7D7994] hover:text-[#5B49EA] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.meetingEnd.backToMeeting}</span>
          </button>
        </div>

        {/* Meeting Notes Card */}
        <section className="bg-white border border-[#DFDDE9] rounded-[18px] p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[20px] sm:text-[22px] font-medium text-[#5A5770] tracking-[-0.01em]">
                {t.meetingEnd.notesTitle}
              </h2>
              {notes.length > 0 && (
                <span className="text-[12px] font-medium text-[#8E8BA3]">
                  · {notes.length}
                </span>
              )}
            </div>

            {notesOpen && (
              <button
                type="button"
                onClick={() => setNotesOpen(false)}
                className="text-[#8E8BA3] hover:text-[#4C4962] p-1 rounded-lg transition-colors cursor-pointer"
                aria-label={t.meetingEnd.collapseNotesAria}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {!notesOpen ? (
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="w-full h-[200px] sm:h-[210px] rounded-[18px] bg-[#E6E5EC] hover:bg-[#DDDCE6] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B49EA]"
              aria-label={t.meetingEnd.openNotesAria}
            >
              <PencilTrayIcon className="w-12 h-12 text-[#8E8BA3]" />
            </button>
          ) : (
            <div className="flex flex-col gap-4">
              {notes.length === 0 ? (
                <div className="rounded-[14px] bg-[#F7F6FC] border border-[#EAE8F3] px-4 py-6 flex flex-col items-center justify-center text-center">
                  <p className="text-[13.5px] font-medium text-[#5A5770]">
                    {t.meetingEnd.noNotesTitle}
                  </p>
                  <p className="text-[12px] text-[#9A97AD] mt-1">
                    {t.meetingEnd.noNotesBody}
                  </p>
                  <button
                    type="button"
                    onClick={onLoadDemoNotes}
                    className="mt-2.5 text-[12px] font-medium text-[#5B49EA] hover:text-[#4735D4] cursor-pointer"
                  >
                    {t.meetingEnd.loadSampleDemo}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 max-h-[190px] overflow-y-auto loop-scroll pr-1">
                  {notes.map((note) => {
                    const translated = note.translatedContent?.[speechTargetLanguage];
                    return (
                      <div
                        key={note.id}
                        className="rounded-xl bg-[#F7F6FC] border border-[#EAE8F3] px-4 py-3"
                      >
                        <div className="flex items-center justify-between text-[12px] text-[#8E8BA3] mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[#5A5770]">
                              {note.author}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{note.timestamp}</span>
                          </div>
                          {note.isDemo && (
                            <span className="text-[11px] text-[#8E8BA3]">
                              {t.stream.demoBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[14px] text-[#3E3B52] break-words">
                          {note.content}
                        </p>
                        {translated && translated !== note.content && (
                          <p className="text-[13px] text-[#9A97AD] mt-0.5 break-words">
                            {translated}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <form onSubmit={handleSaveNote} noValidate className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => {
                      setNoteInput(e.target.value);
                      if (noteError) setNoteError(null);
                    }}
                    placeholder={t.meetingEnd.addNotePlaceholder(userName)}
                    aria-invalid={Boolean(noteError)}
                    className={`flex-1 min-w-0 rounded-xl bg-[#F7F6FC] border focus:outline-none px-4 py-2.5 text-[14px] text-[#3E3B52] placeholder:text-[#9A97AD] ${
                      noteError
                        ? 'border-[#C94A63] focus:border-[#B43C54]'
                        : 'border-[#DFDDE9] focus:border-[#7C6CEB]'
                    }`}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B49EA] hover:bg-[#4B3AD8] text-white px-4 py-2.5 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.meetingEnd.addNoteButton}</span>
                  </button>
                </div>

                {noteError && (
                  <p
                    role="alert"
                    className="inline-flex items-center gap-1.5 text-[12px] text-[#B43C54] font-medium"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{noteError}</span>
                  </p>
                )}
              </form>
            </div>
          )}
        </section>

        {/* Bottom 2-Column Split: Translation History & Review Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Translation History */}
          <section className="lg:col-span-5 bg-white border border-[#DFDDE9] rounded-[18px] p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-[18px] font-medium text-[#5A5770] tracking-[-0.01em]">
                  {t.meetingEnd.translationHistoryTitle}
                </h2>
                {transcript.length > 0 && (
                  <span className="text-[12px] font-medium text-[#8E8BA3]">
                    · {transcript.length}
                  </span>
                )}
              </div>

              {historyOpen && (
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="text-[#8E8BA3] hover:text-[#4C4962] p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label={t.meetingEnd.collapseHistoryAria}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!historyOpen ? (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="w-full h-[155px] rounded-[18px] bg-[#E6E5EC] hover:bg-[#DDDCE6] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B49EA]"
                aria-label={t.meetingEnd.openHistoryAria}
              >
                <ClockOutlineIcon className="w-11 h-11 text-[#8E8BA3]" />
              </button>
            ) : transcript.length === 0 ? (
              <div className="h-[155px] rounded-[18px] bg-[#F7F6FC] border border-[#EAE8F3] px-4 flex flex-col items-center justify-center text-center">
                <p className="text-[13.5px] font-medium text-[#5A5770]">
                  {t.meetingEnd.noHistoryTitle}
                </p>
                <p className="text-[12px] text-[#9A97AD] mt-1">
                  {t.meetingEnd.noHistoryBody}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[210px] overflow-y-auto loop-scroll pr-1">
                {transcript.map((item) => {
                  const translated = item.translations[speechTargetLanguage];
                  const displaySpeaker = item.isAnonymous
                    ? t.shareOpinion.anonymousSpeaker
                    : item.speakerName;
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl bg-[#F7F6FC] border border-[#EAE8F3] px-3.5 py-2.5"
                    >
                      <div className="flex items-center justify-between text-[12px] text-[#8E8BA3] gap-2">
                        <span className="font-medium text-[#4C4962] inline-flex items-center gap-1.5 min-w-0">
                          {item.isAnonymous && (
                            <EyeOff className="w-3 h-3 text-[#5B49EA] shrink-0" />
                          )}
                          <span className="truncate">{displaySpeaker}</span>
                          {item.source === 'demo' && (
                            <span className="text-[11px] font-normal text-[#8E8BA3] shrink-0">
                              · {t.stream.demoBadge}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="text-[13px] text-[#3E3B52] mt-1 break-words">
                        {item.originalText}
                      </p>
                      {translated && (
                        <p className="text-[12.5px] text-[#9A97AD] break-words">
                          {translated}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Review Decisions */}
          <section className="lg:col-span-7 bg-white border border-[#DFDDE9] rounded-[18px] p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="text-[18px] font-medium text-[#5A5770] tracking-[-0.01em]">
                  {t.meetingEnd.reviewDecisionsTitle}
                </h2>
                {decisions.length > 0 && (
                  <span className="text-[12px] font-medium text-[#8E8BA3]">
                    · {decisions.length}
                  </span>
                )}
              </div>

              {decisionsOpen && (
                <button
                  type="button"
                  onClick={() => setDecisionsOpen(false)}
                  className="text-[#8E8BA3] hover:text-[#4C4962] p-1 rounded-lg transition-colors cursor-pointer"
                  aria-label={t.meetingEnd.collapseDecisionsAria}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!decisionsOpen ? (
              <button
                type="button"
                onClick={() => setDecisionsOpen(true)}
                className="w-full h-[155px] rounded-[18px] bg-[#E6E5EC] hover:bg-[#DDDCE6] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5B49EA]"
                aria-label={t.meetingEnd.openDecisionsAria}
              >
                <BookmarkOutlineIcon className="w-11 h-11 text-[#8E8BA3]" />
              </button>
            ) : (
              <div className="flex flex-col gap-3.5">
                {decisions.length === 0 ? (
                  <div className="rounded-[14px] bg-[#F7F6FC] border border-[#EAE8F3] px-4 py-5 flex flex-col items-center justify-center text-center">
                    <p className="text-[13.5px] font-medium text-[#5A5770]">
                      {t.meetingEnd.noDecisionsTitle}
                    </p>
                    <p className="text-[12px] text-[#9A97AD] mt-1 max-w-md">
                      {t.meetingEnd.noDecisionsBody}
                    </p>
                    <button
                      type="button"
                      onClick={onLoadDemoDecisions}
                      className="mt-2.5 text-[12px] font-medium text-[#5B49EA] hover:text-[#4735D4] cursor-pointer"
                    >
                      {t.meetingEnd.loadSampleDemo}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5 max-h-[160px] overflow-y-auto loop-scroll pr-1">
                    {decisions.map((decision) => (
                      <button
                        key={decision.id}
                        type="button"
                        onClick={() => onToggleDecisionStatus(decision.id)}
                        className="w-full text-left rounded-xl bg-[#F7F6FC] hover:bg-[#F1EFFB] border border-[#EAE8F3] px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[14px] font-medium text-[#3E3B52] truncate">
                              {decision.title}
                            </p>
                            {decision.isDemo && (
                              <span className="text-[11px] text-[#8E8BA3] shrink-0">
                                {t.stream.demoBadge}
                              </span>
                            )}
                          </div>
                          <p className="text-[12px] text-[#8E8BA3] mt-0.5 truncate">
                            {t.meetingEnd.ownerPrefix} {decision.owner} · {decision.dueDate}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 text-[12px] font-medium shrink-0 ${
                            decision.status === 'Confirmed'
                              ? 'text-[#5B49EA]'
                              : 'text-[#8E8BA3]'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>
                            {decision.status === 'Confirmed'
                              ? t.meetingEnd.statusConfirmed
                              : t.meetingEnd.statusPending}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <form
                  onSubmit={handleSaveDecision}
                  noValidate
                  className="flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={decisionInput}
                      onChange={(e) => {
                        setDecisionInput(e.target.value);
                        if (decisionError) setDecisionError(null);
                      }}
                      placeholder={t.meetingEnd.addDecisionPlaceholder}
                      aria-invalid={Boolean(decisionError)}
                      className={`flex-1 min-w-0 rounded-xl bg-[#F7F6FC] border focus:outline-none px-4 py-2 text-[13.5px] text-[#3E3B52] placeholder:text-[#9A97AD] ${
                        decisionError
                          ? 'border-[#C94A63] focus:border-[#B43C54]'
                          : 'border-[#DFDDE9] focus:border-[#7C6CEB]'
                      }`}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B49EA] hover:bg-[#4B3AD8] text-white px-3.5 py-2 text-[13px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.meetingEnd.addDecisionButton}</span>
                    </button>
                  </div>

                  {decisionError && (
                    <p
                      role="alert"
                      className="inline-flex items-center gap-1.5 text-[12px] text-[#B43C54] font-medium"
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{decisionError}</span>
                    </p>
                  )}
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
