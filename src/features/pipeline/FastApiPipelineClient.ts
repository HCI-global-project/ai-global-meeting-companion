import type { IncomingTranscriptEvent } from '../../types/streaming';
import type {
  ConnectHandlers,
  MeetingState,
  PipelineClient,
  PipelineConnection,
  PipelineParticipant,
} from './PipelineClient';

type WebSocketFactory = (url: string) => WebSocket;

// 서버(api/app/routes/access.py)와 맞춘 값
const ACCESS_HEADER = 'X-Access-Code';
export const ACCESS_DENIED_CLOSE = 4403;

export class PipelineRequestError extends Error {
  readonly status: number;
  // 사용량 한도에 걸렸을 때(429) 몇 초 뒤 다시 되는지
  readonly retryAfterSeconds?: number;

  constructor(message: string, status: number, retryAfterSeconds?: number) {
    super(message);
    this.name = 'PipelineRequestError';
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** api/ 의 FastAPI 서버와 이야기한다. 이벤트 모양은 src/types/streaming.ts 와 같다 */
export class FastApiPipelineClient implements PipelineClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly openSocket: WebSocketFactory;
  private readonly accessCode: () => string | null;

  constructor(
    baseUrl: string,
    options: {
      fetchImpl?: typeof fetch;
      openSocket?: WebSocketFactory;
      // 초대 링크로 받은 접속 코드. 서버에 ACCESS_CODE 가 없으면 없어도 된다
      accessCode?: () => string | null;
    } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args));
    this.openSocket = options.openSocket ?? ((url) => new WebSocket(url));
    this.accessCode = options.accessCode ?? (() => null);
  }

  async getSonioxKey(participantId?: string): Promise<string> {
    // 서버는 참여자별로 키 발급 횟수를 센다
    const body = await this.request<{ apiKey: string }>(
      'POST',
      '/api/soniox/temporary-key',
      participantId ? { participantId } : undefined
    );
    return body.apiKey;
  }

  connect(meetingId: string, participant: PipelineParticipant, handlers: ConnectHandlers): PipelineConnection {
    const query = new URLSearchParams({
      participantId: participant.id,
      name: participant.name,
      role: participant.role,
      language: participant.language,
      ...(participant.userId && { userId: participant.userId }),
    });
    // 브라우저 WebSocket 은 헤더를 못 붙여서 접속 코드를 주소에 넣는다
    const code = this.accessCode();
    if (code) query.set('code', code);
    const wsBase = this.baseUrl.replace(/^http/, 'ws');
    const socket = this.openSocket(`${wsBase}/ws/meetings/${encodeURIComponent(meetingId)}?${query}`);
    // 연결이 열리기 전에 보낸 메시지는 열린 뒤에 보낸다
    const outbox: string[] = [];
    const send = (message: object) => {
      const data = JSON.stringify(message);
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
      else outbox.push(data);
    };

    socket.onopen = () => {
      outbox.splice(0).forEach((data) => socket.send(data));
      handlers.onOpen?.();
    };
    socket.onmessage = (event) => {
      try {
        handlers.onEvent(JSON.parse(String(event.data)) as IncomingTranscriptEvent);
      } catch {
        handlers.onEvent({ type: 'error', code: 'INVALID_EVENT_PAYLOAD', message: '잘못된 이벤트', recoverable: true });
      }
    };
    socket.onerror = () =>
      handlers.onEvent({ type: 'error', code: 'WEBSOCKET_ERROR', message: '파이프라인 서버에 연결할 수 없어요.', recoverable: false });
    socket.onclose = (event?: CloseEvent) => handlers.onClose?.(event?.code);

    return {
      startRecording: () => send({ type: 'recording.start' }),
      stopRecording: () => send({ type: 'recording.stop' }),
      assignSpeaker: (speakerKey, participantId) => send({ type: 'speaker.assign', speakerKey, participantId }),
      sendSegment: (segment, clientSegmentId) =>
        send({
          type: 'segment.final',
          text: segment.text,
          speaker: segment.speaker,
          language: segment.language,
          clientSegmentId,
        }),
      // 연결이 열리기 전의 확정 전 글자는 금방 낡으니 쌓아 두지 않고 버린다
      sendInterim: (text, language) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'segment.interim', text, language }));
      },
      configure: ({ topic = '', terms = [] }) => send({ type: 'session.configure', topic, terms }),
      close: () => socket.close(),
    };
  }

  async sendMessage(
    meetingId: string,
    message: { participantId: string; text: string; kind: 'chat' | 'opinion'; anonymous?: boolean }
  ): Promise<void> {
    await this.request('POST', `${this.meeting(meetingId)}/messages`, message);
  }

  async requestWait(meetingId: string): Promise<void> {
    await this.request('POST', `${this.meeting(meetingId)}/signals/wait`);
  }

  async requestOpinion(meetingId: string, participantId: string, segmentId: string): Promise<void> {
    await this.request('POST', `${this.meeting(meetingId)}/opinions`, { participantId, segmentId });
  }

  addNote(meetingId: string, note: { author: string; content: string; language?: string }) {
    return this.request<{ id: string; translatedContent: Record<string, string> }>(
      'POST',
      `${this.meeting(meetingId)}/notes`,
      note
    );
  }

  fetchState(meetingId: string): Promise<MeetingState> {
    return this.request<MeetingState>('GET', `${this.meeting(meetingId)}/state`);
  }

  private meeting(meetingId: string): string {
    return `/api/meetings/${encodeURIComponent(meetingId)}`;
  }

  private async request<T = unknown>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const code = this.accessCode();
    if (code) headers[ACCESS_HEADER] = code;
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await res.json().catch(() => ({}))) as { detail?: string };
    if (!res.ok) {
      const retryAfter = Number(res.headers?.get('Retry-After'));
      throw new PipelineRequestError(
        payload.detail ?? `파이프라인 요청 실패 (${res.status})`,
        res.status,
        retryAfter > 0 ? retryAfter : undefined
      );
    }
    return payload as T;
  }
}
