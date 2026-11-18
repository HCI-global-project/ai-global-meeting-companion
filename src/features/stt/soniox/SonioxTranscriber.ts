import { Segmenter } from '../segmentation/Segmenter';
import type { BoundaryRule, SegmentDraft, SttToken } from '../segmentation/types';
import { micErrorCode, type MicErrorCode } from '../micErrors';
import type { TokenLog } from '../tokenLog';
import { buildSonioxConfig, SONIOX_URL, type MeetingSttContext } from './sonioxConfig';

// MediaRecorder 가 이 간격마다 webm 조각을 내보낸다. 짧을수록 전사가 빨리 오지만 메시지가 많아진다
const CHUNK_MS = 250;
// <end> 가 오지 않을 때를 대비한 안전망. 마지막 확정 토큰 뒤로 이만큼 조용하면 확정한다(lab 과 같은 5초)
const IDLE_FLUSH_MS = 5_000;
// Soniox 는 조용할 때도 1초마다 응답을 보낸다(2026-11 측정). 이만큼 아무 응답이 없으면 연결이 멈춘 것으로 보고 다시 연다
const STALL_MS = 10_000;
const STALL_CHECK_MS = 2_000;
// 마이크가 이만큼 음소거 상태면(다른 앱이 마이크를 가져감, 이어폰 연결 변경 등) 녹음을 멈추고 알린다
const MIC_MUTED_MS = 5_000;

type SonioxRawToken = {
  text: string;
  is_final: boolean;
  start_ms?: number;
  end_ms?: number;
  speaker?: string;
  language?: string;
  confidence?: number;
};
type SonioxResponse = { tokens?: SonioxRawToken[]; error_code?: number; error_message?: string };

export type TranscriberState = 'idle' | 'connecting' | 'listening' | 'error';

/** 마이크 문제면 micCode 가 있어 화면이 번역된 안내를 고를 수 있다 */
export interface TranscriberFailure {
  message: string;
  micCode?: MicErrorCode;
}

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
  // 확정 전 글자(마지막 확정 줄 뒤에 이어지는 말)와 그 언어. 빈 글자면 지운다
  onInterim?: (text: string, language?: string) => void;
  onStateChange?: (state: TranscriberState, error?: TranscriberFailure) => void;
}

/**
 * 대면 회의용 실시간 전사. 한 기기가 방 전체 소리를 Soniox 로 보내고,
 * 받은 토큰을 분절기가 발화 단위로 끊는다. React 와 무관하게 쓸 수 있다.
 *
 * 녹음 버튼은 켜져 있는데 글자가 안 나오는 일을 막으려고 두 가지를 지켜본다.
 * - Soniox 응답이 멈추면(연결은 열려 있는데 아무것도 안 옴) 같은 마이크로 연결을 다시 연다.
 * - 마이크가 끊기거나 오래 음소거되면 녹음을 멈추고 이유를 알린다(조용히 무음만 보내지 않게).
 */
export class SonioxTranscriber {
  private readonly options: SonioxTranscriberOptions;
  private readonly segmenter: Segmenter;
  private socket: WebSocket | null = null;
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private stallTimer: ReturnType<typeof setInterval> | null = null;
  private mutedTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageAt = 0;
  // 한 번 listening 을 알린 뒤에는 다시 열어도 알리지 않는다(녹음 시간이 0으로 돌아가지 않게)
  private listening = false;
  private reconnecting = false;
  private stopping = false;
  // 오류로 닫힌 경우 정리 후에도 오류 상태를 유지한다
  private failed = false;
  private interimLanguage: string | undefined;

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
    if (this.socket || this.stream) return;
    this.failed = false;
    this.stopping = false;
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
      this.stream = stream;
      this.watchMicrophone(stream);
      this.open(apiKey, stream);
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e), micErrorCode(e) ?? undefined);
    }
  }

  /** 녹음을 멈추면 마지막 조각을 보낸 뒤 빈 메시지로 끝을 알린다. Soniox 가 남은 토큰을 보내고 닫는다 */
  stop(): void {
    this.stopping = true;
    this.clearStallWatch();
    if (this.recorder && this.recorder.state !== 'inactive') this.recorder.stop();
    else if (this.socket) this.socket.close();
    // 다시 여는 중이라 소켓이 없으면 바로 정리한다
    else if (this.reconnecting) this.cleanup();
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
      this.watchForStall();
      if (!this.listening) {
        this.listening = true;
        this.setState('listening');
      }
    };
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) socket.send(event.data);
    };
    recorder.onstop = () => {
      if (socket.readyState === WebSocket.OPEN) socket.send('');
    };
    socket.onmessage = (event) => {
      this.lastMessageAt = Date.now();
      this.receive(JSON.parse(String(event.data)) as SonioxResponse);
    };
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
    // 지금 말하는 언어는 가장 최근 글자의 언어로 본다
    const spoken = tokens.findLast((t) => t.language && t.text.trim() && !t.text.startsWith('<'));
    if (spoken?.language) this.interimLanguage = spoken.language;
    this.options.onInterim?.(this.segmenter.push(tokens), this.interimLanguage);
    if (tokens.some((t) => t.isFinal)) this.resetIdleTimer();
  }

  private watchForStall(): void {
    this.clearStallWatch();
    this.lastMessageAt = Date.now();
    this.stallTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt > STALL_MS) void this.reconnect();
    }, STALL_CHECK_MS);
  }

  private clearStallWatch(): void {
    if (this.stallTimer) clearInterval(this.stallTimer);
    this.stallTimer = null;
  }

  /** 멈춘 연결을 버리고 같은 마이크로 새 연결을 연다. 임시 키는 짧게 살아서 새로 받는다 */
  private async reconnect(): Promise<void> {
    const stream = this.stream;
    if (!stream || this.reconnecting || this.stopping || this.failed) return;
    this.reconnecting = true;
    this.clearStallWatch();
    this.detachConnection();
    // 받아 둔 확정 전 글자는 버리지 않고 한 줄로 확정한다
    this.segmenter.flush('reconnect');
    this.options.onInterim?.('');
    console.warn('Soniox 응답이 멈춰 연결을 다시 엽니다');
    try {
      const apiKey = await this.options.getApiKey();
      if (this.stopping || this.failed) return;
      this.open(apiKey, stream);
    } catch (e) {
      this.fail(e instanceof Error ? e.message : String(e));
    } finally {
      this.reconnecting = false;
      if (this.stopping && !this.socket) this.cleanup();
    }
  }

  /** 옛 연결의 콜백을 떼고 닫는다. 닫힐 때 마이크까지 정리하지 않게 한다 */
  private detachConnection(): void {
    const socket = this.socket;
    const recorder = this.recorder;
    this.socket = null;
    this.recorder = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== 'inactive') recorder.stop();
    }
    if (socket) {
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try {
        socket.close();
      } catch {
        // 이미 닫혔다
      }
    }
  }

  private watchMicrophone(stream: MediaStream): void {
    const track = stream.getAudioTracks()[0];
    if (!track) return;
    track.onended = () => this.fail('마이크 연결이 끊겼어요', 'lost');
    track.onmute = () => {
      if (this.mutedTimer) clearTimeout(this.mutedTimer);
      this.mutedTimer = setTimeout(() => this.fail('마이크 소리가 들어오지 않아요', 'lost'), MIC_MUTED_MS);
    };
    track.onunmute = () => {
      if (this.mutedTimer) clearTimeout(this.mutedTimer);
      this.mutedTimer = null;
    };
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
    if (this.mutedTimer) clearTimeout(this.mutedTimer);
    this.mutedTimer = null;
    this.clearStallWatch();
    this.stream?.getTracks().forEach((track) => {
      track.onended = null;
      track.onmute = null;
      track.onunmute = null;
      track.stop();
    });
    this.stream = null;
    this.recorder = null;
    this.socket = null;
    this.listening = false;
    this.segmenter.flush('stop');
    this.options.onInterim?.('');
    if (!this.failed) this.setState('idle');
  }

  private fail(message: string, micCode?: MicErrorCode): void {
    if (this.failed) return;
    this.failed = true;
    this.options.onStateChange?.('error', { message, micCode });
    // 소켓이 닫히면 onclose 가 녹음기와 마이크를 정리한다
    if (this.socket) this.socket.close();
    else this.cleanup();
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
    confidence: raw.confidence,
  };
}
