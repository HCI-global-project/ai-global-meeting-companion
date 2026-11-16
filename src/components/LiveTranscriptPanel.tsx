import React, { useLayoutEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { speakerOf, type Roster } from '../features/roster/roster';
import { groupTurns } from '../features/transcript/groupTurns';
import { useI18n } from '../i18n/I18nContext';
import { SpeakerAssignMenu } from './SpeakerAssignMenu';
import type { LanguageCode, TranscriptEntry } from '../types/meeting';
import type { StreamConnectionState } from '../types/streaming';

interface LiveTranscriptPanelProps {
  entries: TranscriptEntry[];
  interimSegment: TranscriptEntry | null;
  connectionState: StreamConnectionState;
  isDemoMode: boolean;
  speechTargetLanguage: LanguageCode;
  onStartDemoStream: () => void;
  onStopStream: () => void;
  onSendChat: (text: string) => void;
  roster: Roster;
  selfId: string;
  onAssignSpeaker: (speakerKey: string, participantId: string | null) => void;
}

const MEETING_LANGUAGE: LanguageCode = 'ko';
// 맨 아래에서 이 정도 안쪽이면 '맨 아래를 보고 있다'로 본다
const STICK_TO_BOTTOM_PX = 80;
// 번역이 오기 전 자리. 1~2초 뒤 번역으로 바뀐다
const PENDING_TRANSLATION = '…';

export const LiveTranscriptPanel: React.FC<LiveTranscriptPanelProps> = ({
  entries,
  interimSegment,
  connectionState,
  isDemoMode,
  speechTargetLanguage,
  onStartDemoStream,
  onStopStream,
  onSendChat,
  roster,
  selfId,
  onAssignSpeaker,
}) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [chatDraft, setChatDraft] = useState('');
  // '잠깐 기다려 주세요'·익명 의견은 대화창이 아니라 헤더 아래 알림으로 띄운다(회의 기록에는 남는다)
  const visibleEntries = entries.filter(
    (entry) => entry.source !== 'signal' && !(entry.source === 'opinion' && entry.isAnonymous)
  );

  // 같은 사람이 이어 말한 줄은 한 카드로 묶는다(groupTurns 참고). 줄이 확정돼도 글자가 튀지 않는다
  const turns = groupTurns(visibleEntries, interimSegment);

  // 맨 아래를 보고 있을 때만 따라 내려간다. 위로 올려 앞 내용을 읽는 중이면 끌어내리지 않는다
  const stickToBottomRef = useRef(true);
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    stickToBottomRef.current =
      container.scrollHeight - container.scrollTop - container.clientHeight < STICK_TO_BOTTOM_PX;
  };
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (container && stickToBottomRef.current) container.scrollTop = container.scrollHeight;
  });

  const isStreamActive =
    connectionState === 'connecting' || connectionState === 'listening';

  // 회의 언어는 한국어. 언어를 알 수 없는 발화(직접 녹음·의견)도 한국어로 본다
  const needsTranslation = (entry: TranscriptEntry) =>
    (entry.originalLanguage === 'auto' ? MEETING_LANGUAGE : entry.originalLanguage) !==
    speechTargetLanguage;

  // 이어 붙일 카드가 없을 때(첫 발화, 오래 쉰 뒤, 앞 카드가 꽉 참) 말하는 중인 글자만 담는 카드
  const renderInterimCard = (interim: TranscriptEntry) => (
    <article
      key={`interim-${interim.id}`}
      aria-live="polite"
      className="rounded-3 border border-dashed border-primary-200 bg-gray-20 px-4 py-4 flex flex-col items-start"
    >
      <div className="flex items-center gap-2 flex-wrap">
        {interim.speakerName && (
          <div
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1 body-02 text-gray-800 tabular-nums ${
              interim.badgeVariant === 'lavender' ? 'bg-primary-300' : 'bg-gray-200'
            }`}
          >
            <span>{interim.speakerName}</span>
            <span>{interim.timestamp}</span>
          </div>
        )}
        <span className="body-05 text-primary-500">{t.stream.interimBadge}</span>
        {interim.source === 'demo' && (
          <span className="label-01 text-gray-500">· {t.stream.demoBadge}</span>
        )}
      </div>

      <p className="mt-2.5 body-01 text-gray-800">{interim.originalText}</p>

      {needsTranslation(interim) && interim.translations[speechTargetLanguage] && (
        <p className="mt-0.5 body-03 text-gray-400">{interim.translations[speechTargetLanguage]}</p>
      )}
    </article>
  );

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    onSendChat(text);
    setChatDraft('');
  };

  return (
    <section className="flex flex-col gap-3 h-full min-h-0">
      {/* Header Pill Bar */}
      <div className="shrink-0 bg-white border border-gray-100 rounded-4 px-5 sm:px-6 py-3 flex items-center justify-between gap-2.5 flex-wrap">
        <h2 className="heading-06 text-gray-700">
          {t.transcript.title}
        </h2>

        <div className="flex items-center gap-2 shrink-0">
          {/* Clearly Labeled Demo Stream Toggle */}
          {isDemoMode && isStreamActive ? (
            <button
              type="button"
              onClick={onStopStream}
              className="inline-flex items-center gap-1.5 body-05 text-gray-700 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Square className="size-3 fill-current" />
              <span>{t.stream.stopDemoButton}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartDemoStream}
              className="inline-flex items-center gap-1.5 body-05 text-gray-700 hover:text-primary-500 bg-gray-50 hover:bg-primary-50 border border-gray-200 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="size-3 fill-current" />
              <span>{t.stream.demoButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* 전사 목록은 이 안에서만 스크롤한다. 연결·마이크 상태는 회의 화면 토스트로 띄운다 */}
      <div className="bg-white border border-gray-100 rounded-4 flex-1 min-h-[260px] min-[720px]:min-h-0 flex flex-col overflow-hidden">
        {/* Scrollable Transcript Feed */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 min-h-0 overflow-y-auto loop-scroll px-5 sm:px-6 py-5 flex flex-col gap-5"
        >
          {/* Transcript Feed: Finalized Segments + In-Progress Interim Segment */}
          {visibleEntries.length > 0 || interimSegment ? (
            <div className="flex flex-col gap-6">
              {turns.map((turn) => {
                const entry = turn.entries[0];
                // 확정된 줄이 아직 없는 카드: 말하는 중인 글자만 있다(새 화자이거나 첫 발화)
                if (!entry) return renderInterimCard(turn.interim!);

                const translating = turn.entries.some(needsTranslation);
                const interim = turn.interim;

                return (
                  <article key={turn.id} className="flex flex-col items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.speakerKey && !entry.isAnonymous ? (
                        <SpeakerAssignMenu
                          label={
                            speakerOf(entry, roster)?.name ??
                            t.speakers.unassigned(entry.speakerNumber ?? '?')
                          }
                          timestamp={entry.timestamp}
                          chipClassName="bg-gray-200 hover:bg-gray-300"
                          assignedId={roster.speakers[entry.speakerKey]}
                          participants={roster.participants}
                          selfId={selfId}
                          onAssign={(participantId) =>
                            onAssignSpeaker(entry.speakerKey!, participantId)
                          }
                        />
                      ) : (
                        <div
                          className={`inline-flex items-center gap-2 rounded-full px-4 py-1 body-02 text-gray-800 tabular-nums ${
                            entry.badgeVariant === 'lavender'
                              ? 'bg-primary-300'
                              : 'bg-gray-200'
                          }`}
                        >
                          <span>
                            {entry.isAnonymous
                              ? t.anonymousOpinion.anonymousSpeaker
                              : speakerOf(entry, roster)?.name ?? entry.speakerName}
                          </span>
                          <span>{entry.timestamp}</span>
                        </div>
                      )}

                      {entry.source === 'demo' && (
                        <span className="label-02 text-gray-500">
                          {t.stream.demoBadge}
                        </span>
                      )}
                      {entry.source === 'chat' && (
                        <span className="label-02 text-gray-500">
                          {t.chat.badge}
                        </span>
                      )}
                      {interim && (
                        <span className="body-05 text-primary-500">
                          {t.stream.interimBadge}
                        </span>
                      )}
                    </div>

                    {/* 원문은 한 문단으로 잇는다. 말하는 중인 글자는 끝에 옅게 붙어 있다가 확정되면 진해진다 */}
                    <p className="mt-3 body-01 text-gray-800" aria-live={interim ? 'polite' : undefined}>
                      {turn.entries.map((e, i) => (
                        <span key={e.id}>
                          {i > 0 && ' '}
                          {e.originalText}
                        </span>
                      ))}
                      {interim && <span className="text-gray-400"> {interim.originalText}</span>}
                    </p>

                    {/* 번역도 한 문단으로 잇는다. 아직 안 온 줄은 '…' 로 자리만 둔다 */}
                    {translating && (
                      <p className="mt-0.5 body-03 text-gray-400">
                        {turn.entries.filter(needsTranslation).map((e, i) => (
                          <span key={e.id} className={e.translations[speechTargetLanguage] ? undefined : 'text-gray-300'}>
                            {i > 0 && ' '}
                            {e.translations[speechTargetLanguage] ?? PENDING_TRANSLATION}
                          </span>
                        ))}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
              <p className="body-01 text-gray-700">
                {t.transcript.emptyStateTitle}
              </p>
              <p className="mt-1.5 max-w-md body-04 text-gray-400">
                {t.transcript.emptyStateBody}
              </p>
            </div>
          )}
        </div>

        {/* 말로 끼어들기 어려울 때 채팅으로 — 발화와 같은 흐름에 들어간다 */}
        <form
          onSubmit={handleSendChat}
          className="shrink-0 flex gap-2 border-t border-gray-100 p-3"
        >
          <input
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder={t.chat.placeholder}
            maxLength={400}
            className="h-[45px] min-w-0 flex-1 rounded-2 border border-gray-100 bg-white px-4 body-03 text-gray-900 placeholder:text-gray-400 hover:bg-gray-50 focus:bg-white focus:border-primary-300 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!chatDraft.trim()}
            className="h-[45px] shrink-0 rounded-2 bg-gray-100 hover:bg-gray-200 px-4 title-03 text-gray-600 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t.chat.send}
          </button>
        </form>
      </div>
    </section>
  );
};
