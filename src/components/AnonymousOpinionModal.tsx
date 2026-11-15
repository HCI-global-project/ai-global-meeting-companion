import React, { useEffect, useState } from 'react';
import { AlertCircle, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface AnonymousOpinionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => void;
}

const MAX_OPINION_LENGTH = 400;

export const AnonymousOpinionModal: React.FC<AnonymousOpinionModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const { t } = useI18n();
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 모달이 떠 있는 동안 배경 스크롤을 막고 Esc로 닫는다
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleClose = () => {
    setDraft('');
    setError(null);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return setError(t.anonymousOpinion.validationEmpty);
    if (text.length < 2) return setError(t.anonymousOpinion.validationTooShort);
    if (text.length > MAX_OPINION_LENGTH) return setError(t.anonymousOpinion.validationTooLong);
    onSubmit(text);
    setDraft('');
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-gray-800/50 flex items-center justify-center px-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        role="dialog"
        aria-modal="true"
        aria-labelledby="anonymous-opinion-title"
        className="w-full max-w-[480px] rounded-4 bg-white p-6 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="size-14 rounded-full bg-primary-50 text-primary-500 flex items-center justify-center">
            <EyeOff className="size-icon-md" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="anonymous-opinion-title" className="heading-05 text-gray-900">
              {t.anonymousOpinion.title}
            </h2>
            <p className="body-03 text-gray-600">{t.anonymousOpinion.description}</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            rows={4}
            maxLength={MAX_OPINION_LENGTH + 50}
            placeholder={t.anonymousOpinion.placeholder}
            aria-invalid={Boolean(error)}
            autoFocus
            className={`w-full rounded-2 border bg-white px-4 py-3 body-03 text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none ${
              error ? 'border-red-400' : 'border-gray-200 focus:border-primary-500'
            }`}
          />
          <div className="flex items-center justify-between gap-2 px-1">
            {error ? (
              <p role="alert" className="inline-flex items-center gap-1 body-04 text-red-500">
                <AlertCircle className="size-icon-xs shrink-0" />
                <span>{error}</span>
              </p>
            ) : (
              <span />
            )}
            <span className="label-01 text-gray-400 tabular-nums">
              {draft.length}/{MAX_OPINION_LENGTH}
            </span>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="w-1/3 h-12 rounded-2 bg-gray-100 hover:bg-gray-200 text-gray-600 title-02 transition-colors cursor-pointer"
          >
            {t.anonymousOpinion.cancel}
          </button>
          <button
            type="submit"
            className="flex-1 h-12 rounded-2 bg-primary-500 hover:opacity-90 text-white title-02 transition-opacity cursor-pointer"
          >
            {t.anonymousOpinion.submit}
          </button>
        </div>
      </form>
    </div>
  );
};
