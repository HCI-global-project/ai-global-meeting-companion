import React from 'react';
import { AlertCircle, Info, Loader2, X } from 'lucide-react';
import type { Toast, ToastTone } from '../hooks/useToasts';
import { useI18n } from '../i18n/I18nContext';

interface ToastStackProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

// 알림은 종류를 한눈에 구분하는 게 목적이라 tone 마다 색을 나눈다
const TONE_CLASS: Record<ToastTone, { box: string; icon: string; text: string }> = {
  progress: {
    box: 'bg-gray-50 border-gray-100',
    icon: 'bg-gray-100 text-gray-600',
    text: 'text-gray-700',
  },
  info: {
    box: 'bg-primary-50 border-primary-100',
    icon: 'bg-primary-100 text-primary-600',
    text: 'text-primary-600',
  },
  error: {
    box: 'bg-red-50 border-red-100',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
};

const TONE_ICON: Record<ToastTone, React.ReactNode> = {
  progress: <Loader2 className="size-3.5 animate-spin" />,
  info: <Info className="size-3.5" />,
  error: <AlertCircle className="size-3.5" />,
};

export const ToastStack: React.FC<ToastStackProps> = ({ toasts, onDismiss }) => {
  const { t } = useI18n();
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const tone = TONE_CLASS[toast.tone];
        // 오류만 직접 닫는다. 진행·안내는 상태가 바뀌거나 시간이 지나면 사라진다
        const closable = toast.tone === 'error';
        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-full items-center gap-2.5 rounded-full border py-1.5 pl-1.5 shadow-01 ${tone.box} ${
              closable ? 'pr-1.5' : 'pr-4'
            }`}
          >
            <span className={`grid size-6 shrink-0 place-items-center rounded-full ${tone.icon}`}>
              {TONE_ICON[toast.tone]}
            </span>
            <span className={`body-02 min-w-0 ${tone.text}`}>{toast.message}</span>
            {closable && (
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label={t.common.close}
                className={`grid size-6 shrink-0 place-items-center rounded-full hover:bg-white/70 cursor-pointer ${tone.text}`}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
