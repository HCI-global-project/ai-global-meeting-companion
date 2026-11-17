export type SendInterim = (text: string, language?: string) => void;

// 확정 전 글자는 토큰마다(초당 여러 번) 바뀐다. 다른 화면에 전하고 번역하기엔 이 정도 간격이면 충분하다
export const INTERIM_SEND_INTERVAL_MS = 700;

/**
 * 녹음 기기의 확정 전 글자를 서버로 보내는 간격을 조절한다(임시 번역 실험).
 * 바뀔 때마다 보내지 않고, 간격 안에 바뀐 것 중 가장 최신 것만 보낸다.
 * 빈 글자(줄 확정·녹음 끝)는 기다리지 않고 바로 보내 다른 화면의 임시 줄을 지운다.
 */
export function createInterimSender(send: SendInterim, intervalMs = INTERIM_SEND_INTERVAL_MS) {
  let lastSentAt = -Infinity;
  let lastSent = '';
  let pending: { text: string; language?: string } | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    timer = null;
    if (!pending) return;
    const { text, language } = pending;
    pending = null;
    if (text === lastSent) return;
    lastSent = text;
    lastSentAt = Date.now();
    send(text, language);
  };

  return {
    push(text: string, language?: string) {
      if (!text) {
        if (timer) clearTimeout(timer);
        timer = null;
        pending = null;
        if (lastSent) {
          lastSent = '';
          send('');
        }
        return;
      }
      pending = { text, language };
      if (timer) return;
      const wait = lastSentAt + intervalMs - Date.now();
      if (wait <= 0) flush();
      else timer = setTimeout(flush, wait);
    },
    stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
