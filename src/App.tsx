import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import MeetingPage from './pages/MeetingPage'
import MeetingEndPage from './pages/MeetingEndPage'

/**
 * 라우트 정의
 *  /login               로그인
 *  /meeting/:meetingId  실시간 회의 화면
 *  /meeting/:meetingId/end  회의 종료(요약) 화면
 */
export default function App() {
  return (
    <Routes>
      {/* 루트 접속 시 로그인으로 보냄 (추후 로그인 여부에 따라 분기) */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/meeting/:meetingId" element={<MeetingPage />} />
      <Route path="/meeting/:meetingId/end" element={<MeetingEndPage />} />
      {/* 정의되지 않은 경로는 로그인으로 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
