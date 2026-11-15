import type { IncomingTranscriptEvent } from '../../types/streaming';
import type {
  ConnectHandlers,
  MeetingState,
  PipelineClient,
  PipelineConnection,
  PipelineParticipant,
} from './PipelineClient';

type WebSocketFactory = (url: string) => WebSocket;

export class PipelineRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PipelineRequestError';
    this.status = status;
  }
}

/** api/ 의 FastAPI 서버와 이야기한다. 이벤트 모양은 src/types/streaming.ts 와 같다 */
export class FastApiPipelineClient implements PipelineClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly openSocket: WebSocketFactory;

  constructor(
    baseUrl: string,
    options: { fetchImpl?: typeof fetch; openSocket?: WebSocketFactory } = {}
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = options.fetchImpl ?? ((...args) => fetch(...args));
    this.openSocket = options.openSocket ?? ((url) => new WebSocket(url));
  }

  async getSonioxKey(): Promise<string> {
    const body = await this.request<{ apiKey: string }>('POST', '/api/soniox/temporary-key');
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
    const wsBase = this.baseUrl.replace(/^http/, 'ws');
    const socket = this.openSocket(`${wsBase}/ws/meetings/${encodeURIComponent(meetingId)}?${query}`);
    // 연결이 열리기 전에 보낸 메시지는 열린 뒤에 보낸다
    const outbox: string[] = [];
    const send = (message: object) => {
      const data = JSON.stringify(message);
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
      else outbox.push(data);
    };

    socket.onopen = () => outbox.splice(0).forEach((data) => socket.send(data));
    socket.onmessage = (event) => {
      try {
        handlers.onEvent(JSON.parse(String(event.data)) as IncomingTranscriptEvent);
      } catch {
        handlers.onEvent({ type: 'error', code: 'INVALID_EVENT_PAYLOAD', message: '잘못된 이벤트', recoverable: true });
      }
    };
    socket.onerror = () =>
      handlers.onEvent({ type: 'error', code: 'WEBSOCKET_ERROR', message: '파이프라인 서버에 연결할 수 없어요.', recoverable: false });
    socket.onclose = () => handlers.onClose?.();

    return {
      sendSegment: (segment, clientSegmentId) =>
        send({
          type: 'segment.final',
          text: segment.text,
          speaker: segment.speaker,
          language: segment.language,
          clientSegmentId,
        }),
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
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await res.json().catch(() => ({}))) as { detail?: string };
    if (!res.ok) throw new PipelineRequestError(payload.detail ?? `파이프라인 요청 실패 (${res.status})`, res.status);
    return payload as T;
  }
}
