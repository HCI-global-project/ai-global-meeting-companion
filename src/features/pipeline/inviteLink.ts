const CODE_KEY = 'loop.accessCode';

// 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 이번 방문 동안만 기억한다
let memoryCode: string | null = null;

export interface InviteParams {
  code: string | null;
  room: string | null;
}

/**
 * 초대 링크(…/?code=<접속 코드>&room=<방 코드>)를 읽는다.
 * 접속 코드는 이 브라우저에 기억해 둬서, 링크 없이 다시 들어와도 묻지 않는다.
 * 로그인이 생기기 전 임시 장치다. 서버의 ACCESS_CODE 와 같아야 회의에 들어갈 수 있다.
 */
export function readInvite(search: string = globalThis.location?.search ?? ''): InviteParams {
  const params = new URLSearchParams(search);
  const code = params.get('code')?.trim() || null;
  if (code) remember(code);
  return { code, room: params.get('room')?.trim() || null };
}

/** 요청에 붙일 접속 코드. 초대 링크로 들어온 적이 없으면 null */
export function currentAccessCode(): string | null {
  try {
    return globalThis.localStorage?.getItem(CODE_KEY) ?? memoryCode;
  } catch {
    return memoryCode;
  }
}

function remember(code: string): void {
  memoryCode = code;
  try {
    globalThis.localStorage?.setItem(CODE_KEY, code);
  } catch {
    // memoryCode 로 이번 방문 동안은 쓴다
  }
}
