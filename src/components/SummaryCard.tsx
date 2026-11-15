import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { needsTranslation } from '../i18n/contentLanguage';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, MeetingOutcome, OutcomeItem } from '../types/meeting';

interface SummaryCardProps {
  outcome: MeetingOutcome | null;
  targetLanguage: LanguageCode;
  isDemo?: boolean;
}

/**
 * 회의 결과 누적 — 정해진 것 / 할 일 / 아직 정해지지 않은 것.
 * 대화 맥락이 '지금 무슨 얘기 중인지'라면, 요약은 회의가 지금까지 남긴 결과다.
 */
export const SummaryCard: React.FC<SummaryCardProps> = ({
  outcome,
  targetLanguage,
  isDemo = false,
}) => {
  const { t } = useI18n();
  const [collapsed, setCollapsed] = useState(false);

  const columns: { key: 'decided' | 'actionItems' | 'undecided'; label: string }[] = [
    { key: 'decided', label: t.summary.decided },
    { key: 'actionItems', label: t.summary.actionItems },
    { key: 'undecided', label: t.summary.undecided },
  ];

  return (
    <section className="rounded-4 border border-gray-100 bg-white px-5 py-4 flex flex-col gap-3">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="heading-06 text-gray-900">{t.summary.title}</h2>
          <span className="label-01 text-gray-500 truncate">
            {t.summary.subtitle}
            {isDemo && ` · ${t.summary.demoLabel}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1 h-8 px-2.5 rounded-2 label-01 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
        >
          {collapsed ? t.summary.expand : t.summary.collapse}
          <ChevronDown
            className={`size-icon-xs transition-transform ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </header>

      {!collapsed &&
        (!outcome ? (
          <p className="body-03 text-gray-400">{t.summary.emptyState}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {columns.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-1.5 rounded-3 bg-gray-50 px-4 py-3 max-h-[132px] overflow-y-auto loop-scroll">
                <span className="label-01 text-gray-500">
                  {label} {outcome[key].length > 0 && `· ${outcome[key].length}`}
                </span>
                {outcome[key].length === 0 ? (
                  <p className="body-04 text-gray-400">{t.summary.emptyColumn}</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {outcome[key].map((item) => (
                      <OutcomeRow
                        key={item.id}
                        item={item}
                        showTranslation={needsTranslation(targetLanguage, outcome.language)}
                        targetLanguage={targetLanguage}
                        showOwner={key === 'actionItems'}
                        noOwnerLabel={t.summary.noOwner}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        ))}
    </section>
  );
};

interface OutcomeRowProps {
  item: OutcomeItem;
  showTranslation: boolean;
  targetLanguage: LanguageCode;
  showOwner: boolean;
  noOwnerLabel: string;
}

const OutcomeRow: React.FC<OutcomeRowProps> = ({
  item,
  showTranslation,
  targetLanguage,
  showOwner,
  noOwnerLabel,
}) => {
  const translation = showTranslation ? item.translations?.[targetLanguage] : undefined;

  return (
    <li className="flex animate-[fade-up_0.25s_ease-out] items-start justify-between gap-2">
      <div className="min-w-0 flex flex-col gap-0.5">
        <span className="body-03 break-keep text-gray-800">{item.text}</span>
        {translation && <span className="body-04 break-keep text-primary-700">{translation}</span>}
      </div>
      {showOwner && (
        <span className="shrink-0 rounded-2 bg-white px-2 py-0.5 label-02 text-gray-600">
          {item.owner ?? noOwnerLabel}
        </span>
      )}
    </li>
  );
};
