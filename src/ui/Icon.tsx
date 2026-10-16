import type { RobotId } from '../data';

/** Mechanical silhouettes shared by the system selector and the field guide. */
export function SystemIcon({ id, size = 21 }: { id: RobotId; size?: number }) {
  const shapes = {
    humanoid: <><path d="M13 3h10l2 3v6H11V6ZM8 15h20l-3 12H11ZM7 16 4 18v9h5M29 16l3 2v9h-5M13 27v6h-5M23 27v6h5"/><path d="M14 8h8M15 19h6M18 27v6"/><circle cx="7" cy="16" r="2"/><circle cx="29" cy="16" r="2"/><path d="M13 4h10v7H13Z" fill="currentColor" opacity=".1"/></>,
    arm: <><path d="M5 32h25M8 28h18v4H8ZM13 27l-4-13 9-8 10 7M17 27l-4-12 6-5 7 6M26 16l4 5M28 12l5 5-3 4-5-2"/><circle cx="11" cy="14" r="3"/><circle cx="18" cy="8" r="3"/><circle cx="27" cy="14" r="2.5"/><path d="M8 28h18v4H8Z" fill="currentColor" opacity=".15"/></>,
    rover: <><path d="m5 18 5-5h16l5 5v10H5ZM10 13l3-5h10l3 5M18 8V4M14 4h8M5 20h26M12 25h12"/><path d="M2 22h5v9H2ZM29 22h5v9h-5Z" fill="currentColor" opacity=".12"/><circle cx="12" cy="17" r="1"/><circle cx="24" cy="17" r="1"/></>,
    hand: <><path d="M11 18V7a2 2 0 0 1 4 0v9-12a2 2 0 0 1 4 0v12-10a2 2 0 0 1 4 0v11-7a2 2 0 0 1 4 0v14l-5 7H13l-6-9-3-4a2 2 0 0 1 3-3l4 3ZM13 31v3h9v-3"/><path d="M15 21v5M19 20v6M23 21v4M12 12h2M16 10h2M20 11h2M24 14h2"/></>,
    sensors: <><path d="M4 27h28v5H4ZM9 27V15h7v12M21 27V9h7v18M5 10a8 8 0 0 1 15 0M2 7a12 12 0 0 1 21-1M24 4v2M30 8l3-2M8 30h1M12 30h1"/><circle cx="12.5" cy="20" r="2"/><circle cx="24.5" cy="15" r="1.5"/><path d="M22 21h5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="miter" strokeLinecap="square" aria-hidden="true">{shapes[id]}</svg>;
}
export function Mark() {
  return <svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="m24 3 18 10v22L24 45 6 35V13Z" stroke="currentColor" strokeWidth="1.4"/><path d="M14 31V17l20 14V17M14 13l20 22" stroke="currentColor" strokeWidth="2.2"/><path d="m24 3 5 3m13 7v7M6 28v7l6 3" stroke="currentColor" strokeWidth="2.5"/></svg>;
}
