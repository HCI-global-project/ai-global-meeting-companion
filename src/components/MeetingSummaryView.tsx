import React from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, EyeOff, HelpCircle, Loader2 } from 'lucide-react';
import { localizeItem } from '../features/outcome/localizeOutcome';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, MeetingOutcome, OutcomeItem, TranscriptEntry } from '../types/meeting';

interface MeetingSummaryViewProps {
  outcome: MeetingOutcome | null;
  transcript: TranscriptEntry[];
  speechTargetLanguage: LanguageCode;
  // 마지막 발화까지 정리하는 중(회의 종료 직후 몇 초)
  finalizing: boolean;
  onBackToMeeting: () => void;
}

/**
 * 회의 종료 화면: AI 가 회의 중에 모은 결과(정해진 것·할 일·아직 못 정한 것)를 내 언어로 보여 주고,
 * 옆에 회의 기록 전체를 둬서 맞는지 확인할 수 있게 한다.
 */
export const MeetingSummaryView: React.FC<MeetingSummaryViewProps> = ({
  outcome,
  transcript,
  speechTargetLanguage,
  finalizing,
  onBackToMeeting,
}) => {
  const { t } = useI18n();
  // '잠깐 기다려주세요' 같은 요청 알림은 기록에 남기지 않는다
  const historyItems = transcript.filter((item) => item.source !== 'signal');
  const isEmpty =
    !outcome ||
    outcome.decided.length + outcome.actionItems.length + outcome.undecided.length === 0;

  const renderItem = (item: OutcomeItem, withOwner: boolean) => {
    const { text, original } = localizeItem(item, outcome?.language, speechTargetLanguage);
    return (
      <li key={item.id} className="rounded-2 bg-gray-50 border border-gray-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <p className="body-03 text-gray-800 break-words min-w-0">{text}</p>
          {withOwner && (
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 label-01 ${
                item.owner ? 'bg-primary-50 text-primary-600' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {item.owner ? t.meetingEnd.owner(item.owner) : t.meetingEnd.noOwner}
            </span>
          )}
        </div>
        {original && <p className="label-01 text-gray-400 mt-0.5 break-words">{original}</p>}
      </li>
    );
  };

  const renderGroup = (
    title: string,
    icon: React.ReactNode,
    items: OutcomeItem[],
    withOwner = false
  ) => (
    <div className="flex flex-col gap-2.5">
      <h3 className="inline-flex items-center gap-2 title-03 text-gray-700">
        {icon}
        <span>{title}</span>
        {items.length > 0 && <span className="body-05 text-gray-500">· {items.length}</span>}
      </h3>
      {items.length === 0 ? (
        <p className="label-01 text-gray-400 px-1">{t.meetingEnd.emptyGroup}</p>
      ) : (
        <ul className="flex flex-col gap-2">{items.map((item) => renderItem(item, withOwner))}</ul>
      )}
    </div>
  );

  return (
    <div className="max-w-[1380px] mx-auto px-4 sm:px-6 py-6">
      <div className="bg-white border border-gray-100 rounded-5 shadow-03 p-5 sm:p-8 flex flex-col gap-5">
        <div>
          <button
            type="button"
            onClick={onBackToMeeting}
            className="inline-flex items-center gap-1.5 body-02 text-gray-600 hover:text-primary-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-icon-xs" />
            <span>{t.meetingEnd.backToMeeting}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* 회의 정리: 정해진 것 · 할 일 · 아직 정하지 못한 것 */}
          <section className="lg:col-span-7 bg-white border border-gray-100 rounded-4 p-5 sm:p-6 flex flex-col gap-5">
            <div>
              <h2 className="heading-05 text-gray-700">{t.meetingEnd.summaryTitle}</h2>
              <p className="label-01 text-gray-500 mt-1">{t.meetingEnd.summaryHint}</p>
              {finalizing && (
                <p role="status" className="mt-2 inline-flex items-center gap-1.5 body-04 text-primary-500">
                  <Loader2 className="size-icon-xs animate-spin" />
                  <span>{t.meetingEnd.finalizing}</span>
                </p>
              )}
            </div>

            {isEmpty && !finalizing ? (
              <div className="rounded-3 bg-gray-50 border border-gray-100 px-4 py-8 flex flex-col items-center justify-center text-center">
                <p className="body-02 text-gray-700">{t.meetingEnd.noOutcomeTitle}</p>
                <p className="label-01 text-gray-400 mt-1 max-w-md">{t.meetingEnd.noOutcomeBody}</p>
              </div>
            ) : (
              <>
                {renderGroup(
                  t.meetingEnd.decidedTitle,
                  <CheckCircle2 className="size-icon-xs text-primary-500" />,
                  outcome?.decided ?? []
                )}
                {renderGroup(
                  t.meetingEnd.actionItemsTitle,
                  <ClipboardList className="size-icon-xs text-primary-500" />,
                  outcome?.actionItems ?? [],
                  true
                )}
                {renderGroup(
                  t.meetingEnd.undecidedTitle,
                  <HelpCircle className="size-icon-xs text-gray-400" />,
                  outcome?.undecided ?? []
                )}
              </>
            )}
          </section>

          {/* 회의 기록 전체: 정리가 맞는지 확인할 때 본다 */}
          <section className="lg:col-span-5 bg-white border border-gray-100 rounded-4 p-5 sm:p-6 flex flex-col">
            <div className="flex items-baseline gap-2 mb-4">
              <h2 className="heading-06 text-gray-700">{t.meetingEnd.transcriptTitle}</h2>
              {historyItems.length > 0 && (
                <span className="body-05 text-gray-500">· {historyItems.length}</span>
              )}
            </div>

            {historyItems.length === 0 ? (
              <div className="h-[155px] rounded-3 bg-gray-50 border border-gray-100 px-4 flex flex-col items-center justify-center text-center">
                <p className="body-02 text-gray-700">{t.meetingEnd.noHistoryTitle}</p>
                <p className="label-01 text-gray-400 mt-1">{t.meetingEnd.noHistoryBody}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 max-h-[520px] overflow-y-auto loop-scroll pr-1">
                {historyItems.map((item) => {
                  const translated =
                    item.originalLanguage === speechTargetLanguage
                      ? undefined
                      : item.translations[speechTargetLanguage];
                  const displaySpeaker = item.isAnonymous
                    ? t.anonymousOpinion.anonymousSpeaker
                    : item.speakerName;
                  return (
                    <div key={item.id} className="rounded-2 bg-gray-50 border border-gray-100 px-4 py-2.5">
                      <div className="flex items-center justify-between label-01 text-gray-500 gap-2">
                        <span className="font-medium text-gray-800 inline-flex items-center gap-1.5 min-w-0">
                          {item.isAnonymous && <EyeOff className="size-3 text-primary-500 shrink-0" />}
                          <span className="truncate">{displaySpeaker}</span>
                          {item.source === 'demo' && (
                            <span className="label-01 text-gray-500 shrink-0">· {t.stream.demoBadge}</span>
                          )}
                        </span>
                        <span className="tabular-nums shrink-0">{item.timestamp}</span>
                      </div>
                      <p className="body-04 text-gray-800 mt-1 break-words">{item.originalText}</p>
                      {translated && <p className="label-01 text-gray-400 break-words">{translated}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
