/** The interface's icon set: one stroke weight, one 24px grid, drawn for Gramtele. */
const PATHS = {
  chat: 'M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V17A2.5 2.5 0 0 1 4 14.5z',
  terminal: 'M3.5 6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18zM7.5 9l3 3-3 3M13 15h4',
  target: 'M12 3.5a8.5 8.5 0 1 0 8.5 8.5M12 8a4 4 0 1 0 4 4M12 12l8-8M16.5 4v3.5H20',
  network: 'M12 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM5.5 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 20.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM10.8 8.2l-4 7.6M13.2 8.2l4 7.6M8 18h8',
  evidence: 'M5 4h9l5 5v11H5zM14 4v5h5M8.5 13.5h7M8.5 17h4.5',
  skills: 'M12 3l7.5 4.3v9.4L12 21l-7.5-4.3V7.3zM12 8.5l1.1 2.3 2.4.3-1.8 1.7.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.8-1.7 2.4-.3z',
  inventory: 'M4 8l8-4.5L20 8v8.5L12 21l-8-4.5zM4 8l8 4.5L20 8M12 12.5V21',
  journal: 'M6 3.5h12A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H6zM6 3.5v17M9.5 8h6.5M9.5 11.5h6.5M3.5 7H6M3.5 12H6M3.5 17H6',
  settings: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM9 19.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  search: 'M11 18.5a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zM16.5 16.5l4 4',
  pin: 'M9 3.5h6l-.8 6 3.3 3.5v1.5h-11V13l3.3-3.5zM12 14.5v6',
  mute: 'M4 9.5v5h3.5L12 18.5v-13L7.5 9.5zM16 9.5l5 5M21 9.5l-5 5',
  bell: 'M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 0 0 4 0',
  clip: 'M20 11.5l-7.8 7.8a4.6 4.6 0 0 1-6.5-6.5l8.2-8.2a3.1 3.1 0 0 1 4.4 4.4l-8.1 8.1a1.5 1.5 0 0 1-2.2-2.2l7.3-7.2',
  send: 'M4.5 12L20 4.5 16.5 20l-4.5-6zM12 14l8-9.5',
  back: 'M14.5 5.5L8 12l6.5 6.5',
  next: 'M9.5 5.5L16 12l-6.5 6.5',
  up: 'M5.5 14.5L12 8l6.5 6.5',
  down: 'M5.5 9.5L12 16l6.5-6.5',
  close: 'M6 6l12 12M18 6L6 18',
  info: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM12 11v5.5M12 7.5v.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  checks: 'M2.5 12.5L7 17l9-9.5M11.5 16l1 1 9-9.5',
  file: 'M6 3.5h8l4.5 4.5v12.5H6zM14 3.5V8h4.5',
  photo: 'M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5zM3.5 16l5-5 4 4 2.5-2.5 5.5 5.5M16 9.5v.5',
  smile: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM8.5 14c.8 1.4 2 2 3.5 2s2.7-.6 3.5-2M9 9.5v.5M15 9.5v.5',
  panel: 'M3.5 6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18zM9 4.5v15',
  more: 'M5 12v.5M12 12v.5M19 12v.5',
  archive: 'M3.5 5h17v4h-17zM5 9v10.5h14V9M10 13h4',
  lock: 'M6 11h12v9.5H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  group: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5c1.900.8 3 2.900 3 5.500',
  globe: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17zM3.500 12h17M12 3.500c2.500 2.500 3.500 5.300 3.500 8.500s-1 6-3.500 8.500c-2.500-2.500-3.500-5.300-3.500-8.500s1-6 3.500-8.500z',
  save: 'M12 4v10.500M7.500 10.500L12 15l4.500-4.500M4.500 19.500h15',
  book: 'M12 6.500C10 5 7.500 4.500 4 4.500v14c3.500 0 6 .5 8 2 2-1.500 4.500-2 8-2v-14c-3.500 0-6 .5-8 2zM12 6.500v14',
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** An icon-only button. The label is both the accessible name and the tooltip. */
export function IconButton({ icon, label, onClick, active, disabled, size, className }: {
  icon: IconName;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <button type="button" className={`icon-btn ${active ? 'on' : ''} ${className ?? ''}`} aria-label={label} title={label} aria-pressed={active === undefined ? undefined : active} disabled={disabled} onClick={onClick}>
      <Icon name={icon} size={size} />
    </button>
  );
}
