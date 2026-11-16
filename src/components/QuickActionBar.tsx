import React, { useEffect, useRef, useState } from 'react';
import { EyeOff, Hand } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface QuickActionBarProps {
  onRequestWait: () => void;
  onOpenAnonymousOpinion: () => void;
}

// 같은 요청이 연달아 쌓이지 않도록 잠깐 막아 둔다
const WAIT_COOLDOWN_MS = 4000;

export const QuickActionBar: React.FC<QuickActionBarProps> = ({
  onRequestWait,
  onOpenAnonymousOpinion,
}) => {
  const { t } = useI18n();
  const [waitSent, setWaitSent] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    []
  );

  const handleWait = () => {
    if (waitSent) return;
    onRequestWait();
    setWaitSent(true);
    timerRef.current = window.setTimeout(() => setWaitSent(false), WAIT_COOLDOWN_MS);
  };

  const buttonClass =
    'flex-1 min-w-0 h-12 rounded-3 bg-white border border-gray-100 hover:bg-gray-50 body-02 text-gray-700 inline-flex items-center justify-center gap-1.5 px-3 transition-colors cursor-pointer disabled:cursor-default';

  return (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={handleWait}
        disabled={waitSent}
        className={`${buttonClass} ${waitSent ? 'bg-primary-50 hover:bg-primary-50 text-primary-600' : ''}`}
      >
        <Hand className="size-icon-xs shrink-0" />
        <span className="truncate">{waitSent ? t.quickActions.waitSent : t.quickActions.waitPlease}</span>
      </button>
      <button type="button" onClick={onOpenAnonymousOpinion} className={buttonClass}>
        <EyeOff className="size-icon-xs shrink-0" />
        <span className="truncate">{t.quickActions.anonymousOpinion}</span>
      </button>
    </div>
  );
};
