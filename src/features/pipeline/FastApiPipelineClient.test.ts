import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ACCESS_DENIED_CLOSE, FastApiPipelineClient, PipelineRequestError } from './FastApiPipelineClient';
import type { IncomingTranscriptEvent } from '../../types/streaming';

class FakeSocket {
  static OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  url: string;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.onclose?.();
  }
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
}

// 브라우저 WebSocket.OPEN 상수를 테스트 환경에서도 쓸 수 있게 둔다
(globalThis as { WebSocket?: unknown }).WebSocket ??= FakeSocket;

describe('FastApiPipelineClient', () => {
  it('opens a ws url with participant info and queues messages until open', () => {
    let socket!: FakeSocket;
    const client = new FastApiPipelineClient('http://localhost:8000/', {
      openSocket: (url) => (socket = new FakeSocket(url)) as unknown as WebSocket,
    });
    const events: IncomingTranscriptEvent[] = [];
    const connection = client.connect(
      '방 1',
      { id: 'p-en', name: 'Joe', role: 'Dev', language: 'en' },
      { onEvent: (e) => events.push(e) }
    );

    assert.match(socket.url, /^ws:\/\/localhost:8000\/ws\/meetings\/%EB%B0%A9%201\?/);
    assert.match(socket.url, /participantId=p-en&name=Joe&role=Dev&language=en/);

    connection.startRecording();
    connection.sendSegment({ text: '안녕하세요', speaker: '1', language: 'ko', reason: 'pause' }, 'c1');
    assert.equal(socket.sent.length, 0);
    socket.open();
    assert.deepEqual(JSON.parse(socket.sent[0]), { type: 'recording.start' });
    assert.deepEqual(JSON.parse(socket.sent[1]), {
      type: 'segment.final',
      text: '안녕하세요',
      speaker: '1',
      language: 'ko',
      clientSegmentId: 'c1',
    });

    connection.assignSpeaker('r1:1', 'p-en');
    assert.deepEqual(JSON.parse(socket.sent[2]), { type: 'speaker.assign', speakerKey: 'r1:1', participantId: 'p-en' });

    socket.onmessage?.({ data: JSON.stringify({ type: 'status', state: 'listening' }) });
    socket.onmessage?.({ data: 'not json' });
    assert.deepEqual(events.map((e) => e.type), ['status', 'error']);
  });

  it('posts messages and surfaces server errors', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return url.endsWith('/messages')
        ? new Response('{}', { status: 201 })
        : new Response(JSON.stringify({ detail: '참여자를 찾을 수 없습니다' }), { status: 404 });
    }) as typeof fetch;
    const client = new FastApiPipelineClient('http://api', { fetchImpl });

    await client.sendMessage('r1', { participantId: 'p1', text: 'hi', kind: 'chat' });
    assert.equal(calls[0].url, 'http://api/api/meetings/r1/messages');
    assert.equal(JSON.parse(String(calls[0].init?.body)).kind, 'chat');

    await assert.rejects(client.requestOpinion('r1', 'nobody', '3'), (e: unknown) => {
      assert.ok(e instanceof PipelineRequestError);
      assert.equal(e.status, 404);
      assert.equal(e.message, '참여자를 찾을 수 없습니다');
      return true;
    });
  });

  it("sends the invite access code on requests and the socket url", async () => {
    let socket!: FakeSocket;
    const calls: { url: string; init?: RequestInit }[] = [];
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify({ apiKey: "k" }), { status: 200 });
    }) as typeof fetch;
    const client = new FastApiPipelineClient("http://api", {
      fetchImpl,
      openSocket: (url) => (socket = new FakeSocket(url)) as unknown as WebSocket,
      accessCode: () => "loop-2611",
    });

    await client.getSonioxKey("p1");
    const headers = calls[0].init?.headers as Record<string, string>;
    assert.equal(headers["X-Access-Code"], "loop-2611");
    // 서버가 참여자별로 키 발급 횟수를 센다
    assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { participantId: "p1" });

    client.connect("r1", { id: "p1", name: "A", role: "", language: "ko" }, { onEvent: () => undefined });
    assert.match(socket.url, /[?&]code=loop-2611(&|$)/);
  });

  it("tells how long to wait when rate limited", async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ detail: "잠시 후" }), { status: 429, headers: { "Retry-After": "42" } })) as typeof fetch;
    const client = new FastApiPipelineClient("http://api", { fetchImpl });
    await assert.rejects(client.sendMessage("r1", { participantId: "p1", text: "hi", kind: "chat" }), (e: unknown) => {
      assert.ok(e instanceof PipelineRequestError);
      assert.equal(e.status, 429);
      assert.equal(e.retryAfterSeconds, 42);
      return true;
    });
  });

  it("passes the close code so an access denial is not retried", () => {
    let socket!: FakeSocket;
    const client = new FastApiPipelineClient("http://api", {
      openSocket: (url) => (socket = new FakeSocket(url)) as unknown as WebSocket,
    });
    const codes: (number | undefined)[] = [];
    client.connect("r1", { id: "p1", name: "A", role: "", language: "ko" }, { onEvent: () => undefined, onClose: (c) => codes.push(c) });
    (socket.onclose as unknown as (e: { code: number }) => void)({ code: ACCESS_DENIED_CLOSE });
    assert.deepEqual(codes, [ACCESS_DENIED_CLOSE]);
  });
});
