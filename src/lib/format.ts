const pad = (n: number) => String(n).padStart(2, '0');

export const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDayMonth = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
export const fmtTime = (d: Date) => {
  const h = d.getHours() % 12 || 12;
  return `${pad(h)}:${pad(d.getMinutes())} ${d.getHours() < 12 ? 'am' : 'pm'}`;
};
export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

/** m:ss from a number of seconds */
export const mmss = (sec: number) => `${Math.floor(Math.max(0, sec) / 60)}:${pad(Math.max(0, sec) % 60)}`;
