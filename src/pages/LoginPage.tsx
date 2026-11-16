import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinRoomView } from '../components/JoinRoomView';
import type { RoomSession } from "../types/meeting";

interface LoginPageProps {
  session: RoomSession;
  onStartSession: (nextSession: RoomSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  session,
  onStartSession,
}) => {
  const navigate = useNavigate();

  const handleStart = (nextSession: RoomSession) => {
    onStartSession(nextSession);
    navigate('/meeting');
  };

  return (
    <JoinRoomView initialSession={session} onStartMeeting={handleStart} />
  );
};
