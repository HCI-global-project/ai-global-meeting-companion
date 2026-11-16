import { useCallback, useEffect, useRef, useState } from 'react';

export type ToastTone = 'progress' | 'info' | 'error';

export interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
  /** 지나면 저절로 사라진다. 없으면 닫기 전까지 남는다 */
  durationMs?: number;
}

const MAX_TOASTS = 3;

/**
 * 화면 아래에 쌓이는 토스트 목록. 같은 id 로 다시 띄우면 그 자리를 바꾼다
 * (예: 'connection' 하나가 연결 중 → 듣는 중 → 오류로 이어진다).
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast: Toast) => {
      const timer = timers.current.get(toast.id);
      if (timer) window.clearTimeout(timer);
      timers.current.delete(toast.id);
      if (toast.durationMs) {
        timers.current.set(
          toast.id,
          window.setTimeout(() => dismiss(toast.id), toast.durationMs)
        );
      }
      setToasts((prev) => {
        const rest = prev.filter((item) => item.id !== toast.id);
        return [...rest, toast].slice(-MAX_TOASTS);
      });
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return { toasts, show, dismiss };
}
