import { useNavigate } from 'react-router-dom'

/**
 * 로그인 페이지
 * TODO
 *  - 이메일/비밀번호 입력 폼 또는 소셜 로그인(Google 등) 버튼
 *  - 인증 API 연동 후 토큰 저장
 *  - 로그인 성공 시 회의 생성/참여 화면으로 이동
 */
export default function LoginPage() {
  const navigate = useNavigate()

  // 임시: 실제 인증 없이 데모 회의방으로 바로 이동
  const handleLogin = () => {
    navigate('/meeting/demo')
  }

  return (
    <main className="page">
      <h1>로그인</h1>

      {/* 로그인 폼 자리 */}
      <section className="placeholder">로그인 폼 영역</section>

      <button onClick={handleLogin}>로그인 (임시)</button>
    </main>
  )
}
