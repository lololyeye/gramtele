import type { ReactNode } from 'react';

/** Each profile picture is a small drawing that says something about the person behind the handle. */
const ART: Record<string, { bg: [string, string]; art: ReactNode }> = {
  // NULL: an empty set, drawn like a seal. There is nobody there.
  NULL: {
    bg: ['#23272b', '#0e1012'],
    art: (
      <g fill="none" stroke="#e7e9e4" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="24" cy="24" r="10" />
        <path d="M15 34L33 14" />
      </g>
    ),
  },
  // VANTA: an aperture stopped almost closed. She sees more than she shows.
  VANTA: {
    bg: ['#35506b', '#14202e'],
    art: (
      <g fill="none" stroke="#d6e4f2" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M24 11l11.300 6.500v13L24 37l-11.300-6.500v-13z" />
        <path d="M24 11l5 12M35.300 17.500L24 26M35.300 30.500L22 28M24 37l-4-12M12.700 30.500L24 22M12.700 17.500L26 20" />
      </g>
    ),
  },
  // MOTH: a moth with its wings open, turning toward a light.
  MOTH: {
    bg: ['#8a5a2b', '#3a2413'],
    art: (
      <g fill="#f3dfbf">
        <path d="M23 18c-5-6-13-6-14-3-1 4 3 11 8 12 2 .4 4-.5 6-3zM25 18c5-6 13-6 14-3 1 4-3 11-8 12-2 .4-4-.5-6-3z" />
        <path d="M23 26c-2.500 1-6 3-6 6 0 2 2 3 4 2 1.500-.8 2-3 2-5zM25 26c2.500 1 6 3 6 6 0 2-2 3-4 2-1.500-.8-2-3-2-5z" opacity=".7" />
        <path d="M24 16.500c1 0 1.500 1.500 1.500 4v9c0 2-.5 3.500-1.500 3.500s-1.500-1.500-1.500-3.500v-9c0-2.500.5-4 1.500-4z" fill="#3a2413" stroke="#f3dfbf" strokeWidth=".8" />
      </g>
    ),
  },
  // ROOTLESS: a tree cut off above the ground.
  ROOTLESS: {
    bg: ['#6e3b33', '#2a1512'],
    art: (
      <g fill="none" stroke="#ecd2c8" strokeWidth="2" strokeLinecap="round">
        <path d="M24 31V17M24 24l-6-6M24 21l6-6M18 18l-2-5M18 18l-5-1M30 15l2-4M30 15l5-1" />
        <path d="M15 36h6M27 36h6" strokeDasharray="1.500 3" />
      </g>
    ),
  },
  // ECHO: a signal that fades as it travels.
  ECHO: {
    bg: ['#2f5e5c', '#10201f'],
    art: (
      <g fill="none" stroke="#cfeee9" strokeLinecap="round">
        <circle cx="15" cy="24" r="2.200" fill="#cfeee9" stroke="none" />
        <path d="M20 17a10 10 0 0 1 0 14" strokeWidth="2.200" />
        <path d="M26 13a16 16 0 0 1 0 22" strokeWidth="1.800" opacity=".65" />
        <path d="M32 9a22 22 0 0 1 0 30" strokeWidth="1.400" opacity=".32" />
      </g>
    ),
  },
  // #lowlight: three people around one lamp, faces out of the light.
  lowlight: {
    bg: ['#4c5a2f', '#1b2110'],
    art: (
      <g fill="#e7ecd0">
        <circle cx="24" cy="24" r="3" />
        <path d="M24 8a5 5 0 0 1 5 5c0 2-1 3.500-2 4.500h-6c-1-1-2-2.500-2-4.500a5 5 0 0 1 5-5z" opacity=".55" />
        <path d="M10 34a5 5 0 0 1 2-6.800c1.700-1 3.600-.8 5 0l3 5.200c-.4 1.400-1.300 2.800-3 3.800a5 5 0 0 1-7-2.200z" opacity=".55" />
        <path d="M38 34a5 5 0 0 0-2-6.800c-1.700-1-3.600-.8-5 0l-3 5.200c.4 1.400 1.300 2.800 3 3.800a5 5 0 0 0 7-2.200z" opacity=".55" />
      </g>
    ),
  },
  // lowtide: a waterline, and an account nobody answers any more.
  lowtide: {
    bg: ['#3b4146', '#1b1e21'],
    art: (
      <g fill="none" stroke="#b5bcc2" strokeWidth="2" strokeLinecap="round">
        <path d="M11 22c3-3 5-3 8 0s5 3 8 0 5-3 10 0" />
        <path d="M11 29c3-3 5-3 8 0s5 3 8 0 5-3 10 0" opacity=".5" />
      </g>
    ),
  },
};

const HUES = [28, 62, 105, 168, 205, 236, 340];

function initialsAvatar(name: string): { hue: number; text: string } {
  const clean = name.replace(/[^a-zA-Z0-9]/g, '') || '?';
  let h = 0;
  for (const ch of clean) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { hue: HUES[h % HUES.length], text: clean.slice(0, 2).toUpperCase() };
}

export function Avatar({ id, size = 44, online, muted }: { id: string; size?: number; online?: boolean; muted?: boolean }) {
  const drawn = ART[id];
  const gradient = `avatar-${id.replace(/[^a-zA-Z0-9]/g, '')}`;
  const fallback = drawn ? null : initialsAvatar(id);
  return (
    <span className={`avatar ${muted ? 'dim' : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 48 48" width={size} height={size}>
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={drawn ? drawn.bg[0] : `hsl(${fallback!.hue} 34% 34%)`} />
            <stop offset="1" stopColor={drawn ? drawn.bg[1] : `hsl(${fallback!.hue} 38% 16%)`} />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="24" fill={`url(#${gradient})`} />
        {drawn ? drawn.art : <text x="24" y="30.500" textAnchor="middle" fontSize="17" fontWeight="600" fill="#f1f2ee" fontFamily="var(--font-ui)">{fallback!.text}</text>}
      </svg>
      {online !== undefined && <i className={online ? 'presence on' : 'presence'} />}
    </span>
  );
}
