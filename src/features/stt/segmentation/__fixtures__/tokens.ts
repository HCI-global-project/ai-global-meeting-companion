import type { SttToken } from '../types';

interface SpeakOptions {
  speaker?: string;
  language?: string;
  // 이 말을 시작하기 전 쉰 시간
  gapBeforeMs?: number;
  msPerChar?: number;
  // Soniox 처럼 어절을 두 조각으로 나눠 보낸다("볼게" + "요")
  splitWords?: boolean;
}

/**
 * 테스트용 토큰 시퀀스를 만든다. 실제 Soniox 로그가 모이면 그 JSON 으로 바꿔 쓸 수 있다.
 * 새 어절은 공백으로 시작하고, 시각은 이어서 흐른다.
 */
export class TokenScript {
  private clockMs = 0;
  readonly tokens: SttToken[] = [];

  speak(text: string, options: SpeakOptions = {}): this {
    const { speaker = '1', language = 'ko', gapBeforeMs = 0, msPerChar = 80, splitWords = false } = options;
    this.clockMs += gapBeforeMs;
    text.split(' ').forEach((word, index) => {
      const pieces = splitWords && word.length >= 2 ? [word.slice(0, -1), word.slice(-1)] : [word];
      pieces.forEach((piece, pieceIndex) => {
        const lead = (index > 0 || this.tokens.length > 0) && pieceIndex === 0 ? ' ' : '';
        const startMs = this.clockMs;
        this.clockMs += piece.length * msPerChar;
        this.tokens.push({ text: lead + piece, isFinal: true, startMs, endMs: this.clockMs, speaker, language });
      });
    });
    return this;
  }

  end(): this {
    this.tokens.push({ text: '<end>', isFinal: true });
    return this;
  }
}
