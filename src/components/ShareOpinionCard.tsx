import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  EyeOff,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { LanguageCode } from '../types/meeting';
import { PencilTrayIcon } from './LoopIcons';

interface SubmittedOpinionItem {
  id: string;
  text: string;
  isAnonymous: boolean;
  timestamp: string;
}

interface ShareOpinionCardProps {
  userName: string;
  targetLanguage: LanguageCode;
  onPublishOpinion: (
    originalText: string,
    translations: Partial<Record<LanguageCode, string>>,
    isAnonymous: boolean
  ) => void;
}

const QUICK_AI_SUGGESTIONS: {
  original: string;
  translations: Record<LanguageCode, string>;
}[] = [
  {
    original: 'Friday at 2 PM works well for the design review.',
    translations: {
      ko: '금요일 오후 2시에 디자인 리뷰를 진행하는 것이 좋겠습니다.',
      en: 'Friday at 2 PM works well for the design review.',
      ja: '金曜日の午後2時はデザインレビューに最適です。',
      my: 'သောကြာနေ့ နေ့လယ် ၂ နာရီသည် ဒီဇိုင်းပြန်လည်သုံးသပ်ရန် အဆင်ပြေပါသည်။',
      ru: 'Пятница в 14:00 отлично подходит для обзора дизайна.',
      es: 'El viernes a las 14:00 funciona bien para la revisión de diseño.',
    },
  },
  {
    original: 'Could we clarify which prototype flows we are testing on Friday?',
    translations: {
      ko: '금요일에 어떤 프로토타입 플로우를 테스트할지 명확히 할 수 있을까요?',
      en: 'Could we clarify which prototype flows we are testing on Friday?',
      ja: '金曜日にどのプロトタイプフローをテストするか明確にできますか？',
      my: 'သောကြာနေ့တွင် မည်သည့် ပရိုတိုတိုက်အဆင့်များကို စမ်းသပ်မည်ကို ရှင်းလင်းပေးနိုင်မလား။',
      ru: 'Можем ли мы уточнить, какие сценарии прототипа мы тестируем в пятницу?',
      es: '¿Podríamos aclarar qué flujos del prototipo probaremos el viernes?',
    },
  },
];

const MAX_OPINION_LENGTH = 400;

export const ShareOpinionCard: React.FC<ShareOpinionCardProps> = ({
  userName,
  targetLanguage,
  onPublishOpinion,
}) => {
  const { t } = useI18n();
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [polishedNote, setPolishedNote] = useState<string | null>(null);
  const [submittedOpinions, setSubmittedOpinions] = useState<SubmittedOpinionItem[]>([]);
  const [showSubmittedState, setShowSubmittedState] = useState(false);
  const [lastWasAnonymous, setLastWasAnonymous] = useState(false);

  const handlePolishWithAI = () => {
    const trimmed = draft.trim();
    setValidationError(null);
    if (!trimmed) {
      setDraft(QUICK_AI_SUGGESTIONS[0].original);
      setPolishedNote(t.shareOpinion.aiSuggestedNote);
      return;
    }
    setDraft(
      trimmed.endsWith('.') || trimmed.endsWith('?')
        ? trimmed
        : `${trimmed}.`
    );
    setPolishedNote(t.shareOpinion.aiRefinedNote);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();

    if (!text) {
      setValidationError(t.shareOpinion.validationEmpty);
      return;
    }
    if (text.length < 2) {
      setValidationError(t.shareOpinion.validationTooShort);
      return;
    }
    if (text.length > MAX_OPINION_LENGTH) {
      setValidationError(t.shareOpinion.validationTooLong);
      return;
    }

    const matchedSuggestion = QUICK_AI_SUGGESTIONS.find(
      (s) => s.original === text
    );
    const translations: Partial<Record<LanguageCode, string>> =
      matchedSuggestion ? matchedSuggestion.translations : {};

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    onPublishOpinion(text, translations, isAnonymous);

    setSubmittedOpinions((prev) => [
      {
        id: `op-${Date.now()}`,
        text,
        isAnonymous,
        timestamp: `${hh}:${mm}`,
      },
      ...prev,
    ]);
    setLastWasAnonymous(isAnonymous);
    setShowSubmittedState(true);
    setDraft('');
    setValidationError(null);
    setPolishedNote(null);
  };

  const handleCollapse = () => {
    setIsComposing(false);
    setShowSubmittedState(false);
    setValidationError(null);
    setPolishedNote(null);
  };

  return (
    <section className="bg-white border border-gray-100 rounded-4 p-4 lg:p-5 h-full min-h-0 flex flex-col">
      <div className="shrink-0 flex items-center justify-between mb-3 gap-2">
        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="heading-06 text-gray-700 truncate">
            {t.shareOpinion.title}
          </h2>
          {submittedOpinions.length > 0 && (
            <span className="label-02 text-primary-500 shrink-0">
              · {submittedOpinions.length}
            </span>
          )}
        </div>

        {(isComposing || showSubmittedState) && (
          <button
            type="button"
            onClick={handleCollapse}
            className="text-gray-500 hover:text-gray-800 p-1 rounded-2 transition-colors cursor-pointer shrink-0"
            aria-label={t.shareOpinion.closeAria}
          >
            <X className="size-icon-xs" />
          </button>
        )}
      </div>

      {!isComposing && !showSubmittedState ? (
        <button
          type="button"
          onClick={() => setIsComposing(true)}
          className="w-full flex-1 min-h-[76px] rounded-3 bg-gray-100 hover:bg-gray-200 transition-colors flex flex-col items-center justify-center gap-1.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          aria-label={t.shareOpinion.openAria}
        >
          <PencilTrayIcon className="w-9 h-9 lg:w-10 lg:h-10 text-gray-500" />
          {submittedOpinions.length > 0 && (
            <span className="label-02 text-gray-600">
              {t.shareOpinion.submittedHistoryLabel(submittedOpinions.length)}
            </span>
          )}
        </button>
      ) : showSubmittedState ? (
        <div className="flex-1 min-h-0 flex flex-col gap-2.5 overflow-y-auto loop-scroll pr-0.5">
          <div
            role="status"
            className="rounded-2 border border-primary-200 bg-primary-50 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="size-icon-xs text-primary-500 shrink-0" />
              <span className="body-05 text-gray-800 truncate">
                {lastWasAnonymous
                  ? t.shareOpinion.submittedAnonymouslyBanner
                  : t.shareOpinion.submittedBanner}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowSubmittedState(false);
                setIsComposing(true);
              }}
              className="body-05 text-primary-500 hover:text-primary-600 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {t.shareOpinion.shareAnother}
            </button>
          </div>

          <div className="flex flex-col gap-2 min-h-0">
            {submittedOpinions.map((item) => (
              <div
                key={item.id}
                className="rounded-2 bg-gray-50 border border-gray-100 px-3 py-2"
              >
                <div className="flex items-center justify-between label-01 text-gray-500 mb-0.5">
                  <span className="font-medium text-gray-700 inline-flex items-center gap-1">
                    {item.isAnonymous && <EyeOff className="size-3 text-primary-500" />}
                    <span>
                      {item.isAnonymous ? t.shareOpinion.anonymousSpeaker : userName}
                    </span>
                  </span>
                  <span className="tabular-nums">{item.timestamp}</span>
                </div>
                <p className="body-04 text-gray-800 break-words">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 flex flex-col justify-between gap-2 overflow-y-auto loop-scroll pr-0.5"
        >
          <div className="flex flex-col gap-1.5">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (validationError) setValidationError(null);
              }}
              rows={2}
              placeholder={t.shareOpinion.placeholder(
                isAnonymous ? t.shareOpinion.anonymousSpeaker : userName
              )}
              aria-invalid={Boolean(validationError)}
              className={`w-full rounded-2 bg-gray-50 border focus:outline-none px-4 py-2 body-04 text-gray-800 placeholder:text-gray-400 resize-none ${
                validationError
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-gray-200 focus:border-primary-400'
              }`}
              autoFocus
            />

            {validationError && (
              <p
                role="alert"
                className="inline-flex items-center gap-1.5 body-04 text-red-500"
              >
                <AlertCircle className="size-icon-xs shrink-0" />
                <span>{validationError}</span>
              </p>
            )}

            {polishedNote && !validationError && (
              <p className="label-01 text-primary-500">{polishedNote}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
            <label className="inline-flex items-center gap-1.5 label-01 text-gray-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="size-icon-xs rounded-1 border-gray-300 text-primary-500 accent-primary-500 cursor-pointer"
              />
              <EyeOff className="size-icon-xs text-gray-600" />
              <span>{t.shareOpinion.submitAnonymously}</span>
            </label>

            <span className="label-01 text-gray-400 tabular-nums">
              {draft.length}/{MAX_OPINION_LENGTH}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePolishWithAI}
                className="inline-flex items-center gap-1 body-05 text-primary-500 bg-primary-50 hover:bg-primary-100 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="size-icon-xs" />
                <span>{t.shareOpinion.aiDraft}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = QUICK_AI_SUGGESTIONS[1];
                  setDraft(next.original);
                  setValidationError(null);
                  setPolishedNote(
                    t.shareOpinion.previewLabel(
                      targetLanguage.toUpperCase(),
                      next.translations[targetLanguage]
                    )
                  );
                }}
                className="inline-flex items-center label-01 text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {t.shareOpinion.askScope}
              </button>
            </div>

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 body-05 text-white bg-primary-500 hover:bg-primary-600 rounded-2 px-3 h-8 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="size-icon-xs" />
              <span>{t.shareOpinion.send}</span>
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
