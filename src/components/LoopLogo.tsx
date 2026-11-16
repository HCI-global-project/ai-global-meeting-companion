import React from 'react';

interface LoopLogoProps {
  size?: 'sm' | 'lg';
  onClick?: () => void;
}

export const LoopLogo: React.FC<LoopLogoProps> = ({ size = 'sm', onClick }) => {
  const isLarge = size === 'lg';

  const content = (
    <span className="inline-flex items-center select-none whitespace-nowrap shrink-0">
      <svg
        width={isLarge ? 58 : 34}
        height={isLarge ? 32 : 19}
        viewBox="0 0 58 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M16.5 6C11.2533 6 7 10.2533 7 15.5C7 20.7467 11.2533 25 16.5 25C20.4 25 23.8 22.6 26.6 18.8L29.1 15.5L31.6 12.2C34.4 8.4 37.8 6 41.7 6C46.9467 6 51.2 10.2533 51.2 15.5C51.2 20.7467 46.9467 25 41.7 25C37.8 25 34.4 22.6 31.6 18.8L29.1 15.5"
          stroke="var(--color-primary-500)"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29.1 15.5L26.6 12.2C23.8 8.4 20.4 6 16.5 6"
          stroke="var(--color-primary-500)"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span
        className={
          isLarge
            ? 'ml-1.5 text-[42px] leading-none font-medium tracking-[-0.03em] text-gray-900'
            : 'ml-1.5 text-[24px] leading-none font-medium tracking-[-0.03em] text-gray-900'
        }
      >
        loop
      </span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-2 cursor-pointer"
        aria-label="Loop Home"
      >
        {content}
      </button>
    );
  }

  return content;
};
