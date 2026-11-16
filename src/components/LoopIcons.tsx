import React from 'react';

interface IconProps {
  className?: string;
}

export const ParticipantAvatarIcon: React.FC<IconProps> = ({ className = 'w-14 h-14' }) => (
  <svg
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle
      cx="28"
      cy="19"
      r="8.5"
      stroke="currentColor"
      strokeWidth="2.6"
    />
    <path
      d="M11 45C11 36.7157 18.6112 30 28 30C37.3888 30 45 36.7157 45 45H11Z"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinejoin="round"
    />
  </svg>
);
