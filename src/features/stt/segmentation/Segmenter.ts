import type { BoundaryRule, SegmentDraft, SegmentState, SttToken } from './types';

// Soniox 가 보내는 특수 토큰. <end> 는 발화 끝(endpoint), <fin> 은 수동 확정 표시
const END_TOKEN = '<end>';
const FIN_TOKEN = '<fin>';

/**
 * STT 토큰을 발화 단위로 끊는다. 언제 끊을지는 규칙 목록이 정한다.
 * final 토큰은 누적하고, interim 토큰은 화면 표시용으로만 쓰고 매번 버린다.
 */
export class Segmenter {
  private text = '';
  private speaker: string | null = null;
  private lastToken: SttToken | null = null;
  private startMs: number | undefined;
  private languageChars = new Map<string, number>();
  private readonly rules: BoundaryRule[];
  private readonly onSegment: (segment: SegmentDraft) => void;

  constructor(rules: BoundaryRule[], onSegment: (segment: SegmentDraft) => void) {
    this.rules = rules;
    this.onSegment = onSegment;
  }

  /** 토큰 묶음을 받아 화면에 보여 줄 진행 중 문장(확정 + 미확정)을 돌려준다 */
  push(tokens: SttToken[]): string {
    let pending = '';
    for (const token of tokens) {
      if (token.text === END_TOKEN) {
        this.flush('endpoint');
        continue;
      }
      if (token.text === FIN_TOKEN) continue;
      if (!token.isFinal) {
        pending += token.text;
        continue;
      }
      this.accept(token);
    }
    return (this.text + pending).trim();
  }

  /** 지금까지 쌓인 것을 발화로 내보낸다(쉼 타이머, 녹음 종료) */
  flush(reason: string): void {
    const text = this.text.trim();
    if (text) {
      this.onSegment({
        text,
        speaker: this.speaker ?? '',
        language: this.dominantLanguage(),
        startMs: this.startMs,
        endMs: this.lastToken?.endMs,
        reason,
      });
    }
    this.text = '';
    this.startMs = undefined;
    this.languageChars.clear();
    // 화자와 마지막 토큰 시각은 다음 발화의 판단(화자 전환·쉼)에 필요해서 남긴다
  }

  get hasPending(): boolean {
    return this.text.trim().length > 0;
  }

  private accept(token: SttToken): void {
    const before = this.rules.find((rule) => rule.cutBefore?.(this.state(), token));
    if (before) this.flush(before.name);

    if (!this.text.trim() && token.startMs !== undefined) this.startMs = token.startMs;
    this.text += token.text;
    if (token.speaker) this.speaker = token.speaker;
    if (token.language && token.text.trim()) {
      const chars = this.languageChars.get(token.language) ?? 0;
      this.languageChars.set(token.language, chars + token.text.trim().length);
    }
    this.lastToken = token;

    const after = this.rules.find((rule) => rule.cutAfter?.(this.state()));
    if (after) this.flush(after.name);
  }

  private state(): SegmentState {
    return {
      text: this.text,
      speaker: this.speaker,
      language: this.dominantLanguage(),
      lastToken: this.lastToken,
    };
  }

  private dominantLanguage(): string | undefined {
    let best: string | undefined;
    let bestChars = 0;
    for (const [language, chars] of this.languageChars) {
      if (chars > bestChars) [best, bestChars] = [language, chars];
    }
    return best;
  }
}
