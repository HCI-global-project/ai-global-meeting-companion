import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { readInvite } from './features/pipeline/inviteLink';
import './index.css';

// 초대 링크의 접속 코드를 라우터가 주소를 바꾸기 전에 먼저 기억해 둔다
readInvite();

createRoot(document.getElementById('root')!).render(<App />);
