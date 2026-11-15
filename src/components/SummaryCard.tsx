import React, { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, TranscriptEntry } from '../types/meeting';

interface SummaryCardProps {
  speechTargetLanguage: LanguageCode;
  isRecording: boolean;
  transcript: TranscriptEntry[];
  onOpenNotesReview: () => void;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  speechTargetLanguage,
  isRecording,
  transcript,
  onOpenNotesReview,
}) => {
  const { t } = useI18n();
  const [showSummary, setShowSummary] = useState(false);

  const isExpanded = showSummary || isRecording || transcript.length > 0;

  const realEntries = transcript.filter((item) => item.source !== 'demo');
  const demoEntries = transcript.filter((item) => item.source === 'demo');
  const activeEntries = realEntries.length > 0 ? realEntries : demoEntries;
  const isDemoOnly = realEntries.length === 0 && demoEntries.length > 0;

  const buildSessionSummaryPoints = (): string[] => {
    if (activeEntries.length === 0) return [];

    const speakers = Array.from(
      new Set(activeEntries.map((entry) => entry.speakerName))
    ).join(', ');
    const latestEntry = activeEntries[activeEntries.length - 1];
    const latestText =
      latestEntry.translations[speechTargetLanguage] || latestEntry.originalText;
    const clippedSnippet =
      latestText.length > 72 ? `${latestText.slice(0, 72)}...` : latestText;
    const opinionCount = activeEntries.filter(
      (entry) => entry.source === 'opinion'
    ).length;

    const points = [
      t.summary.speakersSummary(speakers, activeEntries.length),
      t.summary.latestTopic(latestEntry.speakerName, clippedSnippet),
    ];

    if (opinionCount > 0) {
      points.push(t.summary.opinionSummary(opinionCount));
    } else {
      const firstEntry = activeEntries[0];
      const firstText =
        firstEntry.translations[speechTargetLanguage] || firstEntry.originalText;
      const firstSnippet =
        firstText.length > 72 ? `${firstText.slice(0, 72)}...` : firstText;
      if (activeEntries.length > 1) {
        points.push(t.summary.latestTopic(firstEntry.speakerName, firstSnippet));
      }
    }

    return points;
  };

  const summaryItems = buildSessionSummaryPoints();

  return (
    <section className="bg-white border border-[#DFDDE9] rounded-[18px] px-5 sm:px-6 py-4 min-h-[104px] lg:min-h-[116px] flex flex-col justify-between">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="text-[17px] lg:text-[18px] font-medium text-[#5A5770] tracking-[-0.01em]">
            {t.summary.title}
          </h2>
          {summaryItems.length > 0 && (
            <span className="text-[11.5px] font-medium text-[#8E8BA3] truncate">
              · {isDemoOnly ? t.summary.demoSummaryLabel : t.summary.sessionSummaryLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[13px] text-[#8E8BA3] whitespace-nowrap shrink-0">
          <button
            type="button"
            onClick={() => setShowSummary((prev) => !prev)}
            className="hover:text-[#5B49EA] transition-colors cursor-pointer"
          >
            {isExpanded ? t.summary.hideSummary : t.summary.generateSummary}
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={onOpenNotesReview}
            className="hover:text-[#5B49EA] transition-colors cursor-pointer"
          >
            {t.summary.endMeeting}
          </button>
        </div>
      </div>

      {isExpanded ? (
        summaryItems.length > 0 ? (
          <ul className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {summaryItems.map((point, index) => (
              <li
                key={index}
                className="rounded-xl bg-[#F7F6FC] border border-[#EAE8F3] px-3.5 py-2 text-[12.5px] leading-relaxed text-[#4C4962] break-words"
              >
                {point}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-[#9A97AD]">{t.summary.emptyState}</p>
        )
      ) : (
        <div className="flex-1" />
      )}
    </section>
  );
};
