import { useCallback, useEffect, useRef, useState } from 'react';
import type { PipelineClient, PipelineConnection } from '../features/pipeline/PipelineClient';
import { rulesFor, type SegmentationPreset } from '../features/stt/segmentation/presets';
import {
  SonioxTranscriber,
  type TranscriberFailure,
} from '../features/stt/soniox/SonioxTranscriber';
import { TokenLog } from '../features/stt/tokenLog';

export type LiveState = 'idle' | 'requesting' | 'connecting' | 'listening' | 'error';

// 분절 규칙 A/B: VITE_SEGMENTATION=lab 이면 lab 의 150자 규칙으로 돌아간다
const PRESET: SegmentationPreset = import.meta.env.VITE_SEGMENTATION === 'lab' ? 'lab' : 'clause';
const MODEL = import.meta.env.VITE_SONIOX_MODEL as string | undefined;
// 실제 회의 토큰을 모아 분절 규칙 fixture·발화 길이 분석에 쓴다. 녹음을 멈추면 JSON 을 내려받는다
const KEEP_TOKEN_LOG = import.meta.env.VITE_TOKEN_LOG === 'true';

interface Options {
  client: PipelineClient;
  getConnection: () => PipelineConnection | null;
  selfId: string;
  /** 서버가 정한 녹음 기기. 내 id 가 되면 그때 마이크를 켠다 */
  recorderId: string | null;
  languageHints: string[];
  participantNames: string[];
}

/**
 * 이 기기를 회의 녹음 기기로 쓴다. 서버에 자리를 먼저 맡고(한 번에 한 대),
 * 허락되면 Soniox 로 전사해 분절기가 끊은 발화를 서버로 보낸다.
 */
export function useLiveTranscription({
  client,
  getConnection,
  selfId,
  recorderId,
  languageHints,
  participantNames,
}: Options) {
  const [state, setState] = useState<LiveState>('idle');
  const [failure, setFailure] = useState<TranscriberFailure | null>(null);
  const [interimText, setInterimText] = useState('');
  const [seconds, setSeconds] = useState(0);

  const wantRef = useRef(false);
  const transcriberRef = useRef<SonioxTranscriber | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<TokenLog | null>(null);
  const segmentCountRef = useRef(0);
  const hintsRef = useRef({ languageHints, participantNames });
  useEffect(() => {
    hintsRef.current = { languageHints, participantNames };
  });

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    transcriberRef.current = null;
    wantRef.current = false;
    getConnection()?.stopRecording();
    if (logRef.current?.size) logRef.current.download();
    logRef.current = null;
  }, [getConnection]);

  const begin = useCallback(() => {
    const { languageHints: hints, participantNames: names } = hintsRef.current;
    logRef.current = KEEP_TOKEN_LOG ? new TokenLog({ preset: PRESET, model: MODEL }) : null;
    const transcriber = new SonioxTranscriber({
      getApiKey: () => client.getSonioxKey(),
      rules: rulesFor(PRESET),
      languageHints: hints,
      context: { participants: names },
      model: MODEL,
      log: logRef.current ?? undefined,
      onSegment: (segment) => {
        segmentCountRef.current += 1;
        getConnection()?.sendSegment(segment, `c-${segmentCountRef.current}`);
      },
      onInterim: setInterimText,
      onStateChange: (next, error) => {
        if (next === 'listening') {
          setState('listening');
          setSeconds(0);
          timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
        } else if (next === 'connecting') {
          setState('connecting');
        } else if (next === 'error') {
          setFailure(error ?? { message: '' });
          setState('error');
          release();
        } else {
          setState('idle');
          release();
        }
      },
    });
    transcriberRef.current = transcriber;
    void transcriber.start();
  }, [client, getConnection, release]);

  // 서버가 녹음 자리를 나에게 주면 시작한다. 자리를 잃으면(서버 재시작 등) 멈춘다
  useEffect(() => {
    if (wantRef.current && recorderId === selfId && !transcriberRef.current) begin();
    if (transcriberRef.current && recorderId !== selfId && state === 'listening') {
      transcriberRef.current.stop();
    }
  }, [recorderId, selfId, begin, state]);

  const start = useCallback(() => {
    const connection = getConnection();
    if (!connection || transcriberRef.current) return;
    setFailure(null);
    wantRef.current = true;
    setState('requesting');
    if (recorderId === selfId) begin();
    else connection.startRecording();
  }, [getConnection, recorderId, selfId, begin]);

  const stop = useCallback(() => {
    if (transcriberRef.current) transcriberRef.current.stop();
    else if (wantRef.current) {
      setState('idle');
      release();
    }
  }, [release]);

  /** 다른 기기가 녹음 중이라 거절됐을 때 */
  const cancelRequest = useCallback(() => {
    if (transcriberRef.current) return;
    wantRef.current = false;
    setState('idle');
  }, []);

  const clearFailure = useCallback(() => {
    setFailure(null);
    setState((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  useEffect(
    () => () => {
      transcriberRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  return { state, failure, interimText, seconds, start, stop, cancelRequest, clearFailure };
}
