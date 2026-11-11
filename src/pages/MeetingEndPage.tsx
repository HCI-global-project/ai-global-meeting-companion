import { useNavigate, useParams } from 'react-router-dom'

/**
 * 회의 종료 화면
 * TODO
 *  - 회의 요약 / 주요 결정사항 / 액션 아이템 표시
 *  - 전체 스크립트(원문 + 번역) 보기
 *  - 회의록 내보내기(PDF, 공유 링크 등)
 */
export default function MeetingEndPage() {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  return (
    <main className="page">
      <h1>회의가 종료되었습니다</h1>
      <p>회의 ID: {meetingId}</p>

      {/* 회의 요약 자리 */}
      <section className="placeholder">회의 요약 영역</section>

      {/* 액션 아이템 자리 */}
      <section className="placeholder">액션 아이템 영역</section>

      {/* 전체 스크립트 자리 */}
      <section className="placeholder">전체 스크립트 영역</section>

      <button onClick={() => navigate('/login')}>처음으로</button>
    </main>
  )
}
