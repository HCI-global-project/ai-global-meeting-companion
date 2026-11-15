import React from 'react';
import { needsTranslation } from '../i18n/contentLanguage';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode, LiveContext } from '../types/meeting';

interface LiveContextCardProps {
  context: LiveContext | null;
  targetLanguage: LanguageCode;
  isDemo?: boolean;
}

/**
 * 지금 무슨 이야기를 하고 있는지 — 주제·키워드·요약·미해결 질문.
 * 백엔드가 발화를 모아 주기적으로 갱신한 결과를 그대로 보여 준다.
 */
export const LiveContextCard: React.FC<LiveContextCardProps> = ({
  context,
  targetLanguage,
  isDemo = false,
}) => {
  const { t } = useI18n();
  // 맥락을 쓴 언어와 같은 언어를 쓰는 사람에게는 번역을 따로 보여 주지 않는다
  const translation =
    context && needsTranslation(targetLanguage, context.language)
      ? context.translations?.[targetLanguage]
      : undefined;

  return (
    <section className="h-full min-h-0 flex flex-col gap-4 rounded-4 border border-gray-100 bg-white p-5">
      <header className="shrink-0 flex items-baseline gap-2">
        <h2 className="heading-06 text-gray-900">{t.context.title}</h2>
        {isDemo && <span className="label-02 text-gray-500">· {t.context.demoLabel}</span>}
      </header>

      {!context ? (
        <p className="body-03 text-gray-400">{t.context.emptyState}</p>
      ) : (
        // 칸을 넘치면 카드 안에서만 스크롤한다
        <div className="flex-1 min-h-0 overflow-y-auto loop-scroll pr-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="label-01 text-gray-500">{t.context.currentTopic}</span>
            <p className="title-02 text-gray-900">{context.currentTopic ?? t.context.topicPending}</p>
            {translation?.topic && <p className="body-03 text-primary-700">{translation.topic}</p>}
          </div>

          {context.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {context.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="animate-[fade-up_0.25s_ease-out] rounded-2 bg-gray-50 px-3 py-1 body-03 text-gray-700"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          <p className="body-03 text-gray-700">{context.rollingSummary}</p>
          {translation?.summary && (
            <p className="-mt-2 body-03 text-primary-700">{translation.summary}</p>
          )}

          {context.openQuestions.length > 0 && (
            <div className="flex flex-col gap-1.5 rounded-3 bg-gray-20 p-3">
              <span className="label-01 text-gray-500">{t.context.openQuestions}</span>
              <ul className="flex flex-col gap-1">
                {context.openQuestions.map((question) => (
                  <li key={question} className="body-04 text-gray-700">
                    · {question}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
