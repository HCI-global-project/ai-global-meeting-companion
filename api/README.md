# Loop AI pipeline (FastAPI)

회의 하나를 메모리 세션으로 들고, 확정 발화가 들어올 때마다 보정·번역·맥락·회의 결과·의견 추천을 돌리는 서버입니다.
데이터 저장과 화면 전달은 Supabase(테이블 + Realtime)가 맡고, 이 서버는 AI 처리만 합니다.

## 왜 Edge Function 이 아니라 별도 서버인가

lab 에서는 Supabase Edge Function 으로 돌렸습니다. 함수는 요청마다 새로 떠서

- 짧은 발화마다 앞 발화·맥락을 DB 에서 다시 읽고,
- 맥락 갱신이 겹치지 않게 `claim_live_context` lease 를 따로 만들어야 했습니다.

발화를 짧게 끊을수록 호출이 늘어 이 비용도 커집니다. 회의 결과처럼 누적 상태를 들고 가야 하는 기능도 생겨서,
회의 단위 상태가 필요한 AI 처리만 오래 떠 있는 프로세스로 분리했습니다.

## 실행

```bash
cd api
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt      # macOS/Linux: .venv/bin/pip
cp .env.example .env                                     # 키가 없으면 AI_PROVIDER=fake 그대로
.venv/Scripts/python -m uvicorn app.main:app --reload    # http://localhost:8000/api/health
.venv/Scripts/python -m pytest
```

Docker: 저장소 루트에서 `docker compose up --build`.

프론트는 `VITE_PIPELINE_URL`(기본 `http://localhost:8000`)로 이 서버를 찾습니다.

## 구조

```
app/
├── main.py, container.py   # 앱 진입점, 의존성 조립
├── config.py               # 환경변수 + 실험 조건
├── domain/                 # 발화·맥락·결과·추천 모델
├── clients/                # LLM(Gemini·OpenAI·Fake) + 재시도·대체 모델 데코레이터, Soniox 임시 키
├── prompts/                # 작업별 프롬프트(.md)
├── services/               # 번역 공용 서비스(+캐시), 회의 결과 합치기, 대상 언어
├── store/                  # 저장소 인터페이스, 메모리·Supabase 구현
├── pipeline/
│   ├── session.py          # 회의별 상태(최근 발화 창·맥락·결과·참여자)
│   ├── events.py           # 이벤트 + 이벤트 버스
│   ├── scheduling.py       # 바로 실행 / 묶어서 한 번에 하나씩
│   ├── tasks/              # correction, translation, live_context, outcome, opinion
│   ├── registry.py         # 회의별 세션 생성·복구
│   ├── hub.py, wire.py     # WebSocket 전송, 프론트 이벤트 모양으로 변환
└── routes/                 # HTTP·WebSocket
eval/                       # CER, 발화 길이 분포
```

새 LLM 기능은 `pipeline/tasks/` 에 작업 파일 하나와 `prompts/` 에 프롬프트 하나를 더하고 `container.py` 목록에 넣으면 됩니다.

## 실험 조건

`.env` 로 바꿉니다. 전체 목록은 `app/config.py`.

| 변수 | 기본 | 의미 |
|---|---|---|
| `TRANSLATION_CONTEXT_SIZE` | 3 | 번역에 같이 보낼 앞 발화 수 |
| `TRANSLATION_REFINE_PREVIOUS` | false | 다음 발화가 오면 직전 번역을 다시 다듬기 |
| `CONTEXT_BATCH_SIZE` / `CONTEXT_MAX_WAIT_S` | 3 / 10 | 맥락 갱신 단위 |
| `OUTCOME_BATCH_SIZE` / `OUTCOME_MAX_WAIT_S` | 6 / 30 | 회의 결과 갱신 단위 |
| `OPINION_IMPORTANCE_THRESHOLD` | 60 | 의견 추천을 띄울 중요도 |
| `OPINION_COOLDOWN_S` | 30 | 사람당 추천 최소 간격 |
| `OPINION_EXTRA_ENGLISH` | false | 추천 문장을 영어로도 만들기 |

## 평가

```bash
python -m eval.cer --ref reference.txt --hyp hypothesis.txt   # 전체·한글·영문 CER
python -m eval.segment_stats soniox-log-*.json                # 프론트 TokenLog 로 받은 발화 길이 분포
```

## 지금 단순화한 것

- 세션이 메모리에 있어 인스턴스는 한 대만 띄웁니다(uvicorn 워커 1).
- 인증이 없습니다. 방 코드만 알면 붙을 수 있는 lab 수준입니다.
- 화자 분리 번호("화자 1")와 참여자를 연결하지 않아, 음성 발화는 말한 본인에게도 추천이 갑니다.
