import React from 'react';

interface IconProps {
  className?: string;
}

export const PencilTrayIcon: React.FC<IconProps> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect
      x="6"
      y="24"
      width="26"
      height="8.5"
      rx="4.25"
      stroke="currentColor"
      strokeWidth="2.4"
    />
    <path
      d="M15.5 25.2L30.2 10.5C31.3 9.4 33.1 9.4 34.2 10.5C35.3 11.6 35.3 13.4 34.2 14.5L19.5 29.2L13.5 30.8L15.5 25.2Z"
      fill="var(--color-gray-100)"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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

export const FolderOutlineIcon: React.FC<IconProps> = ({ className = 'w-9 h-9' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M6.5 11.5C6.5 9.84315 7.84315 8.5 9.5 8.5H16.2L19.2 12H30.5C32.1569 12 33.5 13.3431 33.5 15V28.5C33.5 30.1569 32.1569 31.5 30.5 31.5H9.5C7.84315 31.5 6.5 30.1569 6.5 28.5V11.5Z"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ClockOutlineIcon: React.FC<IconProps> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <circle cx="20" cy="20" r="13.5" stroke="currentColor" strokeWidth="2.4" />
    <path
      d="M20 12.5V20.5L25.5 23.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BookmarkOutlineIcon: React.FC<IconProps> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M11 8.5C11 7.39543 11.8954 6.5 13 6.5H27C28.1046 6.5 29 7.39543 29 8.5V33.5L20 26.5L11 33.5V8.5Z"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
