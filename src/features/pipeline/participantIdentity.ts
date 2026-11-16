const STORAGE_KEY = 'loop.participantId';

/**
 * 이 탭의 참여자 id. 새로고침해도 같은 사람으로 다시 들어가도록 sessionStorage 에 둔다.
 * 탭 단위라서 한 PC 에서 탭 두 개를 열면 참여자 두 명이 된다(시험할 때 편하다).
 */
export function getParticipantId(): string {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
    const id = `p-${crypto.randomUUID().slice(0, 8)}`;
    window.sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 이번 탭에서만 쓰는 id 를 쓴다
    return `p-${Math.random().toString(36).slice(2, 10)}`;
  }
}
