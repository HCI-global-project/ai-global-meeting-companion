/** getUserMedia 실패를 화면 문구(t.transcript.micErrors)로 바꿀 수 있는 코드로 분류한다 */
export type MicErrorCode =
  | 'permission-denied'
  | 'not-found'
  | 'not-readable'
  | 'not-supported'
  | 'unknown';

export function micErrorCode(err: unknown): MicErrorCode | null {
  if (!(err instanceof DOMException)) return null;
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'permission-denied';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'not-found';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'not-readable';
    case 'NotSupportedError':
      return 'not-supported';
    default:
      return 'unknown';
  }
}
