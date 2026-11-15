import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, OpinionStance, OpinionSuggestion } from '../types/meeting';

interface OpinionSuggestionCardProps {
  // 최신 추천이 앞에 온다. 회의 중에는 가장 최근 것만 보여 준다
  suggestions: OpinionSuggestion[];
  targetLanguage: LanguageCode;
  isDemo?: boolean;
}

const STANCES: OpinionStance[] = ['agree', 'disagree', 'alternative'];

/**
 * 의견을 낼 만한 발화가 나오면 바로 말할 수 있는 세 문장(동의/반대/다른 의견).
 * 누르면 클립보드로 복사된다.
 */
export const OpinionSuggestionCard: React.FC<OpinionSuggestionCardProps> = ({
  suggestions,
  targetLanguage,
  isDemo = false,
}) => {
  const { t } = useI18n();
  const latest = suggestions[0];

  return (
    <section className="h-full min-h-0 flex flex-col gap-4 rounded-4 border border-gray-100 bg-white p-5">
      <header className="shrink-0 flex items-baseline gap-2">
        <h2 className="heading-06 text-gray-900">{t.opinion.title}</h2>
        {isDemo && <span className="label-02 text-gray-500">· {t.opinion.demoLabel}</span>}
      </header>

      {!latest ? (
        <p className="body-03 text-gray-400">{t.opinion.emptyState}</p>
      ) : (
        // 칸을 넘치면 카드 안에서만 스크롤한다
        <div className="flex-1 min-h-0 overflow-y-auto loop-scroll pr-1">
          <SuggestionGroup key={latest.id} suggestion={latest} targetLanguage={targetLanguage} />
        </div>
      )}
    </section>
  );
};

interface SuggestionGroupProps {
  suggestion: OpinionSuggestion;
  targetLanguage: LanguageCode;
}

const SuggestionGroup: React.FC<SuggestionGroupProps> = ({ suggestion, targetLanguage }) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState<OpinionStance | null>(null);
  const timerRef = useRef<number | null>(null);
  // 회의 언어(한국어) 사용자에게는 뜻풀이가 필요 없다
  const gloss = targetLanguage === 'ko' ? undefined : suggestion.gloss?.[targetLanguage];

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const copy = async (stance: OpinionStance) => {
    try {
      await navigator.clipboard.writeText(suggestion[stance]);
    } catch {
      return;
    }
    setCopied(stance);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="flex animate-[fade-up_0.25s_ease-out] flex-col gap-2">
      {/* 어떤 발화에 대한 추천인지 — 추천은 대화보다 조금 늦게 뜬다 */}
      <p className="line-clamp-2 body-04 text-gray-500">“{suggestion.targetText}”</p>

      {STANCES.map((stance) => (
        <button
          key={stance}
          type="button"
          onClick={() => void copy(stance)}
          title={t.opinion.copyHint}
          className="flex flex-col items-start gap-1 rounded-3 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 cursor-pointer"
        >
          <span className={`label-01 ${copied === stance ? 'text-primary-500' : 'text-gray-500'}`}>
            {copied === stance ? t.opinion.copied : t.opinion[stance]}
          </span>
          <span className="body-02 break-keep text-gray-800">{suggestion[stance]}</span>
          {gloss && <span className="body-04 break-keep text-primary-700">{gloss[stance]}</span>}
        </button>
      ))}
    </div>
  );
};
