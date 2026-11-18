# Loop AI pipeline (FastAPI)

회의 하나를 메모리 세션으로 들고, 확정 발화가 들어올 때마다 보정·번역·맥락·회의 결과·의견 추천을 돌리는 서버입니다.
데이터 저장과 화면 전달은 Supabase(테이블 + Realtime)가 맡고, 이 서버는 AI 처리만 합니다.

## 왜 Edge Function 이 아니라 별도 서버인가

lab 에서는 Supabase Edge Function 으로 돌렸습니다. 함수는 요청마다 새로 떠서

- 짧은 발화마다 앞 발화·맥락을 DB 에서 다시 읽고,
- 맥락 갱신이 겹치지 않게 `claim_live_context` lease 를 따로 만들어야 했습니다.

발화를 짧게 끊을수록 호출이 늘어 이 비용도 커집니다. 회의 결과처럼 누적 상태를 들고 가야 하는 기능도 생겨서,
회의 단위 상태가 필요한 AI 처리만 오래 떠 있는 프로세스로 분리했습니다.

## 회의 방식: 마이크 하나, 화면은 각자

한 방에 모여서 하는 회의를 전제로 한다. 기기마다 마이크를 켜면 옆 사람 목소리까지 들어가 같은 말이
여러 번 전사되므로, 녹음은 한 기기만 한다.

- **녹음 기기 1대**: 헤더의 녹음 버튼을 누르면 서버에 자리를 맡는다(`recording.start`). 이미 다른 기기가
  녹음 중이면 거절되고, 버튼이 "민지 녹음 중"으로 잠긴다. 녹음 기기 연결이 끊기면 자리가 풀린다.
- **나머지 참여자**: 각자 기기로 들어와 자기 언어로 보고, 채팅·기다려 주세요·익명 의견·의견 추천을 쓴다.
- **화자 지정**: Soniox 는 "화자 1·2"만 안다. 전사 줄의 화자 칩을 눌러 누구인지 고르면 그 화자의
  지난 줄과 앞으로의 줄이 모든 화면에서 그 이름으로 바뀌고, 그 사람에게는 자기 말에 대한 추천이 가지 않는다.
  녹음을 새로 시작하면 Soniox 가 번호를 다시 매기므로 화자 키는 `녹음 회차:번호` 다.

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

프론트는 저장소 루트에서 `npm run dev`(http://localhost:3000). 이 서버는 `VITE_PIPELINE_URL`(기본 `http://localhost:8000`)로 찾습니다.
같은 PC 에서 탭 두 개를 열면 참여자 두 명이 됩니다(참여자 id 가 탭 단위).

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
│   ├── speakers.py         # 녹음 기기 한 대 + 화자 번호 → 참여자
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
| `CORRECTION_ENABLED` | false | STT 보정. 켜도 원문과 많이 다르거나 앞 발화와 같은 결과는 버린다 |
| `TRANSLATION_CONTEXT_SIZE` | 3 | 번역에 같이 보낼 앞 발화 수 |
| `TRANSLATION_REFINE_PREVIOUS` | false | 다음 발화가 오면 직전 번역을 다시 다듬기 |
| `CONTEXT_BATCH_SIZE` / `CONTEXT_MAX_WAIT_S` | 3 / 10 | 맥락 갱신 단위 |
| `OUTCOME_BATCH_SIZE` / `OUTCOME_MAX_WAIT_S` | 6 / 30 | 회의 결과 갱신 단위 |
| `OPINION_IMPORTANCE_THRESHOLD` | 60 | 의견 추천을 띄울 중요도 |
| `INTERIM_TRANSLATION_ENABLED` | false | 확정 전 글자도 번역해 다른 화면에 보여 준다(아래) |
| `OPINION_COOLDOWN_S` | 30 | 사람당 추천 최소 간격 |
| `OPINION_EXTRA_ENGLISH` | false | 추천 문장을 영어로도 만들기 |

### 임시 번역 실험 (`INTERIM_TRANSLATION_ENABLED`)

Soniox 는 이어 말하는 동안 글자를 4~5초 늦게 확정해서, 확정된 줄만 번역하면 외국인 참여자가 그만큼 늦게 따라간다.
켜면 녹음 기기가 확정 전 글자를 0.7초마다 보내고(`segment.interim`), 서버가 다른 화면에 바로 전하면서
방마다 한 번에 하나씩 최신 글자를 번역해 붙인다(`transcript.interim`). 줄이 확정되면 임시 줄을 지우고 정식 번역이 덮어쓴다.

- 저장하지 않는다. 늦게 온 번역이 이미 확정된 글자의 것이면 버린다.
- 녹음 기기 화면에는 보이지 않는다(자기 확정 전 글자를 이미 보여 준다). 다른 탭·기기에서 본다.
- 이어 말하는 동안 번역 호출이 1초에 한 번꼴로 는다. 한도는 `RATE_INTERIM_TRANSLATIONS_PER_MIN`(기본 90). 넘으면 원문만 전한다.
- 끄면(기본) 서버가 `segment.interim` 을 무시해서 지금과 같다. 바꾼 뒤에는 서버를 다시 시작한다.

프론트 쪽(루트 `.env`):

| 변수 | 기본 | 의미 |
|---|---|---|
| `VITE_SEGMENTATION` | lab-split | `lab`: lab 그대로(150자) · `lab-split`: lab + 50자 넘은 종결어미·100자 상한 · `clause`: 쉼·어미·언어 전환까지(잘게 끊김) |
| `VITE_SONIOX_MODEL` | stt-rt-preview | Soniox 실시간 모델 |
| `VITE_TOKEN_LOG` | false | 녹음을 멈출 때 토큰·분절 로그 JSON 을 내려받는다(`eval/segment_stats.py` 입력) |

## 평가

```bash
python -m eval.cer --ref reference.txt --hyp hypothesis.txt   # 전체·한글·영문 CER
python -m eval.segment_stats soniox-log-*.json                # 프론트 TokenLog 로 받은 발화 길이 분포
```

### LLM 작업 품질 (`eval/llm/`)

번역·보정·맥락·회의 결과·의견 추천을 **실제 작업 코드 그대로** 돌리고, 케이스마다 꼭 지켜야 할 성질을 검사합니다.
정답 문장과 똑같은지는 보지 않습니다(같은 뜻을 여러 표현으로 쓸 수 있어서). 대신 "목요일이 들어갔나",
"미얀마 문자로 썼나", "없던 숫자를 지어내지 않았나", "잡담에 추천을 띄우지 않았나" 같은 것을 봅니다.

```bash
python -m eval.llm.run                                  # 전체 (.env 의 AI_PROVIDER, 실제 호출이라 비용·한도 소모)
python -m eval.llm.run --task outcome --repeat 3        # 답이 흔들리므로 여러 번 돌려 통과율로 본다
python -m eval.llm.run --model gemini-3.5-flash-lite --label flash
python -m eval.llm.run --check                          # 케이스 파일 오타만 검사 (호출 없음)
python -m eval.llm.compare eval/llm/results/A.json eval/llm/results/B.json   # 프롬프트 고치기 전후 비교
```

- 케이스는 `eval/llm/cases/<작업>.json`. 검사 종류는 `eval/llm/checks.py` 맨 위 설명.
- 결과 JSON(`eval/llm/results/`, gitignore)에 git 커밋, 프롬프트 파일 지문, **실제로 답한 모델**(기본 모델이 한도에 걸리면 대체 모델이 답한다), 지연 시간이 남습니다.
- 결과는 PASS / FLAKY(가끔 실패) / FAIL / ERROR(429·503 같은 호출 실패. 프롬프트 문제가 아님)로 나뉩니다.
- 실제 회의에서 문제가 나오면 그 상황을 케이스로 하나 더 넣어 두면 다시 생기는지 잡을 수 있습니다.

## 접속 코드와 사용량 한도

배포한 주소가 알려지면 누구나 Gemini·Soniox 를 쓸 수 있어서 두 가지를 둡니다.

- **접속 코드(`ACCESS_CODE`)**: 초대 링크 `https://<프론트>/?code=<코드>&room=<방>` 으로 들어오면 브라우저가
  코드를 기억하고 모든 요청에 붙입니다(HTTP 는 `X-Access-Code` 헤더, WebSocket 은 `code` 파라미터).
  틀리면 HTTP 401, WebSocket 은 `ACCESS_DENIED` 를 알린 뒤 4403 으로 닫고 화면은 다시 붙지 않습니다.
  링크가 퍼졌으면 값만 바꾸면 됩니다. 로그인이 생기기 전 임시 장치입니다.
- **사용량 한도(`RATE_*`)**: 참여자별로 1분(Soniox 키는 1시간) 동안 셉니다. 같은 Wi-Fi 의 여러 명이 함께
  막히지 않게 IP 가 아니라 참여자로 셉니다. 한도는 실제 녹음에서 잰 정상 사용량의 5~10배입니다.
  - 채팅·의견·노트·추천 요청이 넘으면 429 + `Retry-After`, 화면은 "N초 뒤 다시" 알림을 띄웁니다.
  - 발화가 넘어도 버리지 않습니다. 화면에는 보내고 번역·맥락 같은 AI 처리만 건너뜁니다.
  - 걸리면 서버 로그에 `사용량 제한` 이 남습니다. 정상 사용자가 걸리면 숫자를 올립니다.

## 배포 (Vercel + Render)

- **백엔드 → Render** Web Service: Docker, Root Directory `api`, 리전 Singapore, Health Check Path `/api/health`.
  환경변수는 `.env` 와 같고, 배포에서는 `ACCESS_CODE`, `CORS_ORIGINS`(프론트 주소 포함, JSON 배열)를 꼭 넣는다.
  main 에 머지하면 다시 배포된다. Free 는 15분 동안 요청이 없으면 잠들어 첫 접속이 30초~1분 걸린다.
- **프론트 → Vercel**: 저장소 루트 `vercel.json`(Vite, 새로고침해도 index.html). 환경변수 `VITE_PIPELINE_URL`(Render 주소),
  `VITE_SEGMENTATION`, `VITE_SONIOX_MODEL`, `VITE_TOKEN_LOG=false`. 로컬 `.env*` 는 `.vercelignore` 로 올리지 않는다.
- Render 프록시를 거치면 WebSocket 종료 코드 4403 이 1006 으로 올 수 있어서, 화면은 `ACCESS_DENIED` 메시지로도 거절을 알아챈다.

## 지금 단순화한 것

- 세션이 메모리에 있어 인스턴스는 한 대만 띄웁니다(uvicorn 워커 1).
- 로그인이 없습니다. 공용 접속 코드를 아는 사람은 모든 방에 들어올 수 있습니다.
- 화자를 지정하기 전의 발화에는 말한 본인에게도 추천이 갈 수 있습니다. 지정하는 순간부터는 빠집니다.
- 화자 분리가 틀리면(목소리가 비슷하거나 마이크에서 멀 때) 한 사람이 두 번호로 나뉘거나 두 사람이 한 번호로 묶입니다. 지정은 언제든 바꿀 수 있습니다.
- 말하는 중인 문장(interim)은 녹음 기기 화면에만 보입니다. 다른 화면은 확정된 발화부터 받습니다(임시 번역 실험을 켜면 다른 화면에도 보입니다).
- 회의 중 내 언어를 바꾸면 서버에 다시 접속합니다. 녹음 기기에서 바꾸면 녹음이 멈춥니다.
