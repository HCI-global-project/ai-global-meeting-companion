import { useNavigate, useParams } from 'react-router-dom'

/**
 * 실시간 회의 화면
 * TODO
 *  - 마이크 입력 / 화상 영역
 *  - 실시간 자막(STT) 및 번역 결과 스트리밍 표시 (WebSocket 등)
 *  - AI 어시스턴트 패널: 실시간 요약, 질문 추천 등
 *  - 회의 종료 시 서버에 종료 요청 후 종료 화면으로 이동
 */
export default function MeetingPage() {
  // URL의 :meetingId 값 (예: /meeting/demo → "demo")
  const { meetingId } = useParams()
  const navigate = useNavigate()

  const handleEndMeeting = () => {
    // TODO: 회의 종료 API 호출
    navigate(`/meeting/${meetingId}/end`)
  }

  return (
    <main className="page">
      <h1>실시간 회의</h1>
      <p>회의 ID: {meetingId}</p>

      {/* 화상/음성 영역 자리 */}
      <section className="placeholder">화상 / 음성 영역</section>

      {/* 실시간 자막·번역 자리 */}
      <section className="placeholder">실시간 자막 · 번역 영역</section>

      {/* AI 보조 패널 자리 */}
      <section className="placeholder">AI 어시스턴트 패널</section>

      <button onClick={handleEndMeeting}>회의 종료</button>
    </main>
  )
}
