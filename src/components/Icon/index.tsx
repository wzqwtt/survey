import React, {type ReactNode} from 'react';

const paths = {
  eye: 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2',
  text: 'M4 6h16M4 12h16M4 18h10',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
};

export type IconName = keyof typeof paths;

export default function Icon({name, size = 15}: {name: IconName; size?: number}): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
