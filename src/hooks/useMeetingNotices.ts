import { useCallback, useEffect, useRef, useState } from 'react';

export interface MeetingNotice {
  /** 알림이 가리키는 전사 줄 id. 번역이 늦게 와도 그 줄에서 최신 글을 읽는다 */
  entryId: string;
  kind: 'wait' | 'anonymous';
}

const NOTICE_MS = 8000;
const MAX_NOTICES = 3;

/**
 * '잠깐 기다려 주세요'·익명 의견 알림. 대화창은 빨리 흘러가서 놓치기 쉬워
 * 헤더 아래에 잠깐 띄운다. 지난 기록을 불러올 때는 쓰지 않는다.
 */
export function useMeetingNotices() {
  const [notices, setNotices] = useState<MeetingNotice[]>([]);
  const timers = useRef(new Map<string, number>());

  const dismiss = useCallback((entryId: string) => {
    const timer = timers.current.get(entryId);
    if (timer) window.clearTimeout(timer);
    timers.current.delete(entryId);
    setNotices((prev) => prev.filter((n) => n.entryId !== entryId));
  }, []);

  const notify = useCallback(
    (notice: MeetingNotice) => {
      if (timers.current.has(notice.entryId)) return;
      timers.current.set(
        notice.entryId,
        window.setTimeout(() => dismiss(notice.entryId), NOTICE_MS)
      );
      setNotices((prev) => [...prev, notice].slice(-MAX_NOTICES));
    },
    [dismiss]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return { notices, notify, dismiss };
}
