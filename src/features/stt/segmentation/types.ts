/** STT 가 보내는 토큰 하나. Soniox 토큰을 그대로 옮긴 모양이다. 단어 조각일 수 있다. */
export interface SttToken {
  text: string;
  isFinal: boolean;
  startMs?: number;
  endMs?: number;
  speaker?: string;
  language?: string;
  // Soniox 가 매긴 확신도(0~1). 없는 말을 지어낸 토큰은 낮게 나오는지 TokenLog 로 보려고 남긴다
  confidence?: number;
}

/** 분절기가 확정한 발화 하나 */
export interface SegmentDraft {
  text: string;
  speaker: string;
  // 발화 안에서 가장 많이 나온 언어
  language?: string;
  startMs?: number;
  endMs?: number;
  // 어떤 규칙이 끊었는지. 발화 길이 분석에 쓴다
  reason: string;
}

/** 규칙이 판단에 쓰는, 지금 쌓이고 있는 발화의 상태 */
export interface SegmentState {
  readonly text: string;
  readonly speaker: string | null;
  readonly language: string | undefined;
  readonly lastToken: SttToken | null;
}

/**
 * 끊는 규칙. 둘 중 필요한 것만 구현한다.
 * - cutBefore: 다음 확정 토큰을 붙이기 전에 끊을지
 * - cutAfter: 토큰을 붙인 직후 끊을지
 * - cutOnEndpoint: Soniox 가 발화 끝(<end>)을 알렸을 때 끊을지
 */
export interface BoundaryRule {
  readonly name: string;
  cutBefore?(state: SegmentState, next: SttToken): boolean;
  cutAfter?(state: SegmentState): boolean;
  cutOnEndpoint?(state: SegmentState): boolean;
}
