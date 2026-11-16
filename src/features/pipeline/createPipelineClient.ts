import { FastApiPipelineClient } from './FastApiPipelineClient';
import type { PipelineClient } from './PipelineClient';

const DEFAULT_PIPELINE_URL = 'http://localhost:8000';

/**
 * 설정에 맞는 파이프라인 구현을 고른다. VITE_PIPELINE_URL 로 FastAPI 주소를 바꾼다.
 * 서버리스로 돌아갈 때는 여기서 EdgeFunctionPipelineClient(아직 없음)를 돌려주면 된다.
 */
export function createPipelineClient(): PipelineClient {
  const url = (import.meta.env.VITE_PIPELINE_URL as string | undefined) ?? DEFAULT_PIPELINE_URL;
  return new FastApiPipelineClient(url);
}
