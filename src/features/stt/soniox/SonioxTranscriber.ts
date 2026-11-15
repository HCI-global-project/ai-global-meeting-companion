import { Segmenter } from '../segmentation/Segmenter';
import type { BoundaryRule, SegmentDraft, SttToken } from '../segmentation/types';
import type { TokenLog } from '../tokenLog';
import { buildSonioxConfig, SONIOX_URL, type MeetingSttContext } from './sonioxConfig';

// MediaRecorder 가 이 간격마다 webm 조각을 내보낸다. 짧을수록 전사가 빨리 오지만 메시지가 많아진다
const CHUNK_MS = 250;
// <end> 가 오지 않을 때를 대비한 안전망. 마지막 확정 토큰 뒤로 이만큼 조용하면 확정한다
const IDLE_FLUSH_MS = 2_000;

type SonioxRawToken = {
  text: string;
  is_final: boolean;
  start_ms?: number;
  end_ms?: number;
  speaker?: string;
  language?: string;
};
type SonioxResponse = { tokens?: SonioxRawToken[]; error_code?: number; error_message?: string };

export type TranscriberState = 'idle' | 'connecting' | 'listening' | 'error';

export interface SonioxTranscriberOptions {
  getApiKey: () => Promise<string>;
  rules: BoundaryRule[];
  languageHints: string[];
  context?: MeetingSttContext;
  model?: string;
  // 대면 회의에서 기기 하나로 멀리서 녹음하면 노이즈 제거가 발음을 뭉갤 수 있다. A/B 로 비교한다
  noiseSuppression?: boolean;
  log?: TokenLog;
  onSegment: (segment: SegmentDraft) => void;
  onInterim?: (text: string) => void;
  onStateChange?: (state: TranscriberState, error?: string) => void;
}

/**
 * 대면 회의용 실시간 전사. 한 기기가 방 전체 소리를 Soniox 로 보내고,
 * 받은 토큰을 분절기가 발화 단위로 끊는다. React 와 무관하게 쓸 수 있다.
 */
export class SonioxTranscriber {
  private readonly options: SonioxTranscriberOptions;
  private readonly segmenter: Segmenter;
  private socket: WebSocket | null = null;
  private recorder: MediaRecorder | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  // 오류로 닫힌 경우 정리 후에도 오류 상태를 유지한다
  private failed = false;

  constructor(options: SonioxTranscriberOptions) {
    this.options = options;
    this.segmenter = new Segmenter(options.rules, (segment) => {
      options.log?.recordSegment(segment);
      options.onSegment(segment);
    });
  }

  static get supported(): boolean {
    return typeof window !== 'undefined' && 'MediaRecorder' in window;
  }

  async start(): Promise<void> {
    if (this.socket) return;
    this.failed = false;
    this.setState('connecting');
    try {
      const [apiKey, stream] = await Promise.all([
        this.options.getApiKey(),
        navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: this.options.noiseSuppression ?? true,
            autoGainControl: true,
          },
        }),
      ]);
      this.open(apiKey, stream);
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e));
    }
  }

  /** 녹음을 멈추면 마지막 조각을 보낸 뒤 빈 메시지로 끝을 알린다. Soniox 가 남은 토큰을 보내고 닫는다 */
  stop(): void {
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    else this.socket?.close();
  }

  private open(apiKey: string, stream: MediaStream): void {
    const socket = new WebSocket(SONIOX_URL);
    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    this.socket = socket;
    this.recorder = recorder;

    socket.onopen = () => {
      const { languageHints, context, model } = this.options;
      socket.send(JSON.stringify(buildSonioxConfig({ apiKey, languageHints, context, model })));
      recorder.start(CHUNK_MS);
      this.setState('listening');
    };
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
    };
    recorder.onstop = () => {
      if (socket.readyState === WebSocket.OPEN) socket.send('');
    };
    socket.onmessage = (event) => this.receive(JSON.parse(String(event.data)) as SonioxResponse);
    socket.onerror = () => this.fail('Soniox 연결 오류');
    socket.onclose = () => {
      if (recorder.state !== 'inactive') recorder.stop();
      this.cleanup();
    };
  }

  private receive(response: SonioxResponse): void {
    if (response.error_code) {
      this.fail(`Soniox ${response.error_code}: ${response.error_message ?? ''}`);
      return;
    }
    if (!response.tokens?.length) return;
    const tokens = response.tokens.map(toToken);
    this.options.log?.recordTokens(tokens);
    this.options.onInterim?.(this.segmenter.push(tokens));
    if (tokens.some((t) => t.isFinal)) this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      this.segmenter.flush('idle');
      this.options.onInterim?.('');
    }, IDLE_FLUSH_MS);
  }

  private cleanup(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = null;
    this.recorder?.stream.getTracks().forEach((track) => track.stop());
    this.recorder = null;
    this.socket = null;
    this.segmenter.flush('stop');
    this.options.onInterim?.('');
    if (!this.failed) this.setState('idle');
  }

  private fail(message: string): void {
    this.failed = true;
    this.options.onStateChange?.('error', message);
    this.socket?.close();
    if (!this.socket) this.cleanup();
  }

  private setState(state: TranscriberState): void {
    this.options.onStateChange?.(state);
  }
}

function toToken(raw: SonioxRawToken): SttToken {
  return {
    text: raw.text,
    isFinal: raw.is_final,
    startMs: raw.start_ms,
    endMs: raw.end_ms,
    speaker: raw.speaker,
    language: raw.language,
  };
}
