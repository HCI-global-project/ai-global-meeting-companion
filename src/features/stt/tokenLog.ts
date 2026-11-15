import type { SegmentDraft, SttToken } from './segmentation/types';

interface TokenFrame {
  atMs: number;
  tokens: SttToken[];
}

/**
 * 실제 회의의 Soniox 토큰과 분절 결과를 모은다.
 * 내려받은 JSON 은 분절 규칙 테스트 데이터(fixture)와 발화 길이 분석(api/eval/segment_stats.py)에 쓴다.
 */
export class TokenLog {
  private readonly startedAt = performance.now();
  private readonly frames: TokenFrame[] = [];
  private readonly segments: SegmentDraft[] = [];
  private readonly meta: Record<string, unknown>;

  constructor(meta: Record<string, unknown> = {}) {
    this.meta = meta;
  }

  recordTokens(tokens: SttToken[]): void {
    if (tokens.length) this.frames.push({ atMs: Math.round(performance.now() - this.startedAt), tokens });
  }

  recordSegment(segment: SegmentDraft): void {
    this.segments.push(segment);
  }

  get size(): number {
    return this.frames.length;
  }

  toJSON() {
    return { meta: { ...this.meta, recordedAt: new Date().toISOString() }, frames: this.frames, segments: this.segments };
  }

  download(filename = `soniox-log-${Date.now()}.json`): void {
    const blob = new Blob([JSON.stringify(this.toJSON(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
