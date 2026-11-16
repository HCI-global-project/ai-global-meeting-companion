import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, EyeOff, Plus } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type {
  DecisionItem,
  LanguageCode,
  MeetingNote,
  TranscriptEntry,
} from '../types/meeting';

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
  // '잠깐 기다려주세요' 같은 요청 알림은 번역 기록에 남기지 않는다
  const historyItems = transcript.filter((item) => item.source !== 'signal');

  const [noteInput, setNoteInput] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const [decisionInput, setDecisionInput] = useState('');
  const [decisionError, setDecisionError] = useState<string | null>(null);

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
      <div className="bg-white border border-gray-100 rounded-5 shadow-03 p-5 sm:p-8 flex flex-col gap-5">
        {/* Subtle Back Return Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToMeeting}
            className="inline-flex items-center gap-1.5 body-02 text-gray-600 hover:text-primary-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-icon-xs" />
            <span>{t.meetingEnd.backToMeeting}</span>
          </button>
        </div>

        {/* Meeting Notes Card */}
        <section className="bg-white border border-gray-100 rounded-4 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-baseline gap-2">
              <h2 className="heading-05 text-gray-700">
                {t.meetingEnd.notesTitle}
              </h2>
              {notes.length > 0 && (
                <span className="body-05 text-gray-500">
                  · {notes.length}
                </span>
              )}
            </div>
          </div>

            <div className="flex flex-col gap-4">
              {notes.length === 0 ? (
                <div className="rounded-3 bg-gray-50 border border-gray-100 px-4 py-6 flex flex-col items-center justify-center text-center">
                  <p className="body-02 text-gray-700">
                    {t.meetingEnd.noNotesTitle}
                  </p>
                  <p className="label-01 text-gray-400 mt-1">
                    {t.meetingEnd.noNotesBody}
                  </p>
                  <button
                    type="button"
                    onClick={onLoadDemoNotes}
                    className="mt-2.5 body-05 text-primary-500 hover:text-primary-600 cursor-pointer"
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
                        className="rounded-2 bg-gray-50 border border-gray-100 px-4 py-3"
                      >
                        <div className="flex items-center justify-between label-01 text-gray-500 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {note.author}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="tabular-nums">{note.timestamp}</span>
                          </div>
                          {note.isDemo && (
                            <span className="label-01 text-gray-500">
                              {t.stream.demoBadge}
                            </span>
                          )}
                        </div>
                        <p className="body-03 text-gray-800 break-words">
                          {note.content}
                        </p>
                        {translated && translated !== note.content && (
                          <p className="body-04 text-gray-400 mt-0.5 break-words">
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
                    className={`flex-1 min-w-0 h-[45px] rounded-2 bg-gray-50 border focus:outline-none px-4 body-03 text-gray-800 placeholder:text-gray-400 ${
                      noteError
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-gray-200 focus:border-primary-400'
                    }`}
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 h-[45px] rounded-2 bg-primary-500 hover:bg-primary-600 text-white px-4 body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="size-icon-xs" />
                    <span>{t.meetingEnd.addNoteButton}</span>
                  </button>
                </div>

                {noteError && (
                  <p
                    role="alert"
                    className="inline-flex items-center gap-1.5 body-04 text-red-500"
                  >
                    <AlertCircle className="size-icon-xs shrink-0" />
                    <span>{noteError}</span>
                  </p>
                )}
              </form>
            </div>
        </section>

        {/* Bottom 2-Column Split: Translation History & Review Decisions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Translation History */}
          <section className="lg:col-span-5 bg-white border border-gray-100 rounded-4 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="heading-06 text-gray-700">
                  {t.meetingEnd.translationHistoryTitle}
                </h2>
                {historyItems.length > 0 && (
                  <span className="body-05 text-gray-500">
                    · {historyItems.length}
                  </span>
                )}
              </div>
            </div>

            {historyItems.length === 0 ? (
              <div className="h-[155px] rounded-3 bg-gray-50 border border-gray-100 px-4 flex flex-col items-center justify-center text-center">
                <p className="body-02 text-gray-700">
                  {t.meetingEnd.noHistoryTitle}
                </p>
                <p className="label-01 text-gray-400 mt-1">
                  {t.meetingEnd.noHistoryBody}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[210px] overflow-y-auto loop-scroll pr-1">
                {historyItems.map((item) => {
                  const translated =
                    item.originalLanguage === speechTargetLanguage
                      ? undefined
                      : item.translations[speechTargetLanguage];
                  const displaySpeaker = item.isAnonymous
                    ? t.anonymousOpinion.anonymousSpeaker
                    : item.speakerName;
                  return (
                    <div
                      key={item.id}
                      className="rounded-2 bg-gray-50 border border-gray-100 px-4 py-2.5"
                    >
                      <div className="flex items-center justify-between label-01 text-gray-500 gap-2">
                        <span className="font-medium text-gray-800 inline-flex items-center gap-1.5 min-w-0">
                          {item.isAnonymous && (
                            <EyeOff className="size-3 text-primary-500 shrink-0" />
                          )}
                          <span className="truncate">{displaySpeaker}</span>
                          {item.source === 'demo' && (
                            <span className="label-01 text-gray-500 shrink-0">
                              · {t.stream.demoBadge}
                            </span>
                          )}
                        </span>
                        <span className="tabular-nums shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="body-04 text-gray-800 mt-1 break-words">
                        {item.originalText}
                      </p>
                      {translated && (
                        <p className="label-01 text-gray-400 break-words">
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
          <section className="lg:col-span-7 bg-white border border-gray-100 rounded-4 p-5 sm:p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-baseline gap-2">
                <h2 className="heading-06 text-gray-700">
                  {t.meetingEnd.reviewDecisionsTitle}
                </h2>
                {decisions.length > 0 && (
                  <span className="body-05 text-gray-500">
                    · {decisions.length}
                  </span>
                )}
              </div>
            </div>

              <div className="flex flex-col gap-3">
                {decisions.length === 0 ? (
                  <div className="rounded-3 bg-gray-50 border border-gray-100 px-4 py-5 flex flex-col items-center justify-center text-center">
                    <p className="body-02 text-gray-700">
                      {t.meetingEnd.noDecisionsTitle}
                    </p>
                    <p className="label-01 text-gray-400 mt-1 max-w-md">
                      {t.meetingEnd.noDecisionsBody}
                    </p>
                    <button
                      type="button"
                      onClick={onLoadDemoDecisions}
                      className="mt-2.5 body-05 text-primary-500 hover:text-primary-600 cursor-pointer"
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
                        className="w-full text-left rounded-2 bg-gray-50 hover:bg-primary-50 border border-gray-100 px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="body-02 text-gray-800 truncate">
                              {decision.title}
                            </p>
                            {decision.isDemo && (
                              <span className="label-01 text-gray-500 shrink-0">
                                {t.stream.demoBadge}
                              </span>
                            )}
                          </div>
                          <p className="label-01 text-gray-500 mt-0.5 truncate">
                            {decision.owner === '—'
                              ? decision.dueDate
                              : `${t.meetingEnd.ownerPrefix} ${decision.owner} · ${decision.dueDate}`}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 body-05 shrink-0 ${
                            decision.status === 'Confirmed'
                              ? 'text-primary-500'
                              : 'text-gray-500'
                          }`}
                        >
                          <CheckCircle2 className="size-icon-xs" />
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
                      className={`flex-1 min-w-0 h-[45px] rounded-2 bg-gray-50 border focus:outline-none px-4 body-03 text-gray-800 placeholder:text-gray-400 ${
                        decisionError
                          ? 'border-red-400 focus:border-red-500'
                          : 'border-gray-200 focus:border-primary-400'
                      }`}
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 h-[45px] rounded-2 bg-primary-500 hover:bg-primary-600 text-white px-4 body-02 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="size-icon-xs" />
                      <span>{t.meetingEnd.addDecisionButton}</span>
                    </button>
                  </div>

                  {decisionError && (
                    <p
                      role="alert"
                      className="inline-flex items-center gap-1.5 body-04 text-red-500"
                    >
                      <AlertCircle className="size-icon-xs shrink-0" />
                      <span>{decisionError}</span>
                    </p>
                  )}
                </form>
              </div>
          </section>
        </div>
      </div>
    </div>
  );
};
