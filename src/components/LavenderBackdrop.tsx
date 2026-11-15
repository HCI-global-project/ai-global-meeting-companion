import React from 'react';

export const LavenderBackdrop: React.FC = () => (
  <div
    className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
    aria-hidden="true"
    style={{
      background:
        'radial-gradient(120% 100% at 15% 5%, #CFC6FF 0%, #ECE9FE 36%, #F9F8FE 72%, #E2DBFE 100%)',
    }}
  >
    <svg
      viewBox="0 0 1440 900"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full object-cover opacity-80"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="loopRibbonA" x1="120" y1="780" x2="1320" y2="120" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8574EE" stopOpacity="0.48" />
          <stop offset="50%" stopColor="#B8AEFA" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7C6BE8" stopOpacity="0.52" />
        </linearGradient>
        <linearGradient id="loopRibbonB" x1="0" y1="200" x2="1400" y2="800" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#C8BFFD" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Left infinity loop curve */}
      <ellipse
        cx="385"
        cy="560"
        rx="280"
        ry="320"
        transform="rotate(28 385 560)"
        stroke="url(#loopRibbonA)"
        strokeWidth="92"
      />

      {/* Right infinity loop curve */}
      <ellipse
        cx="1040"
        cy="345"
        rx="270"
        ry="315"
        transform="rotate(28 1040 345)"
        stroke="url(#loopRibbonA)"
        strokeWidth="88"
      />

      {/* Soft luminous ambient glow */}
      <circle cx="230" cy="180" r="300" fill="url(#loopRibbonB)" opacity="0.55" />
      <circle cx="1160" cy="790" r="320" fill="url(#loopRibbonB)" opacity="0.55" />
    </svg>
  </div>
);
