import { useEffect, useMemo, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, CheckCircleIcon, InfoIcon, MinusIcon, PlusIcon } from '../components/Icons';
import { getAvailability, saveAvailability, type DayAvailability } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { addDays, dayKey } from '../lib/format';
import '../styles/pricing.css';
import '../styles/availability.css';

const DAYS = 14;
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Row { date: string; day: string; allocated: number; booked: number; blocked: number }

export default function Availability() {
  const { can } = useAuth();
  const editable = can('rooms');
  const { data, error, loading, reload } = useApi(getAvailability);
  const [edits, setEdits] = useState<Record<string, Row>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const base = useMemo(() => {
    const byDate = new Map((data ?? []).map((d: DayAvailability) => [d.date, d]));
    const out: Row[] = [];
    const start = new Date();
    for (let i = 0; i < DAYS; i++) {
      const d = addDays(start, i);
      const key = dayKey(d);
      const r = byDate.get(key);
      out.push({ date: key, day: WEEKDAY[d.getDay()], allocated: r?.allocated ?? 0, booked: r?.booked ?? 0, blocked: r?.blocked ?? 0 });
    }
    return out;
  }, [data]);

  const rows = base.map((r) => edits[r.date] ?? r);
  const dirtyDates = base.filter((r) => edits[r.date] && (edits[r.date].allocated !== r.allocated || edits[r.date].blocked !== r.blocked)).map((r) => r.date);
  const invalid = rows.some((r) => r.blocked > r.allocated);

  const change = (date: string, patch: Partial<Row>) =>
    setEdits((e) => {
      const cur = e[date] ?? base.find((r) => r.date === date)!;
      return { ...e, [date]: { ...cur, ...patch } };
    });
  const step = (r: Row, field: 'allocated' | 'blocked', by: number) => change(r.date, { [field]: Math.max(0, Math.min(999, r[field] + by)) });

  const applyToAll = () => {
    const first = rows[0];
    setEdits(Object.fromEntries(base.map((r) => [r.date, { ...(edits[r.date] ?? r), allocated: first.allocated, blocked: first.blocked }])));
  };

  async function save() {
    if (!dirtyDates.length || invalid) return;
    setSaving(true); setSaveError(null);
    const done: string[] = [];
    try {
      for (const date of dirtyDates) {
        const r = edits[date];
        await saveAvailability(date, { day: r.day, allocated: r.allocated, blocked: r.blocked });
        done.push(date);
      }
      setToast(`Saved ${done.length} ${done.length === 1 ? 'day' : 'days'}`);
      setEdits({});
      reload();
    } catch (e) {
      setSaveError(`${(e as Error).message}${done.length ? ` (${done.length} saved before this)` : ''}`);
    } finally { setSaving(false); }
  }

  return (
    <SubPage title="Availability" subtitle="How many rooms Checkdin can sell, day by day">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      <p className="pr__hint"><InfoIcon /> “Offered” is how many rooms you give Checkdin each day. “Blocked” are rooms you hold back. To stop all bookings at once, use the pause switch on Home.</p>
      {!editable && <p className="pr__hint"><InfoIcon /> Your role can view availability but not change it.</p>}
      {loading && !data && <p className="muted-note">Loading…</p>}

      {editable && data && <button type="button" className="abtn-clear av__all" onClick={applyToAll}>Use today’s numbers for all {DAYS} days</button>}

      <ul className="av">
        {rows.map((r, i) => {
          const open = Math.max(0, r.allocated - r.booked - r.blocked);
          const changed = dirtyDates.includes(r.date);
          const bad = r.blocked > r.allocated;
          return (
            <li key={r.date} className={`av__row${changed ? ' is-changed' : ''}${bad ? ' is-bad' : ''}`}>
              <div className="av__date">
                <strong>{i === 0 ? 'Today' : r.day}</strong>
                <small>{new Date(r.date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</small>
              </div>
              <Stepper label="Offered" value={r.allocated} disabled={!editable} onMinus={() => step(r, 'allocated', -1)} onPlus={() => step(r, 'allocated', 1)} />
              <Stepper label="Blocked" value={r.blocked} disabled={!editable} onMinus={() => step(r, 'blocked', -1)} onPlus={() => step(r, 'blocked', 1)} />
              <div className="av__open" aria-label={`${open} open, ${r.booked} booked`}>
                <strong>{open}</strong><small>open</small>
                <span>{r.booked} booked</span>
              </div>
              {bad && <p className="rate__error av__err" role="alert">Blocked can’t be more than offered</p>}
            </li>
          );
        })}
      </ul>

      {editable && (dirtyDates.length > 0 || saving) && (
        <div className="savebar" role="region" aria-label="Unsaved changes">
          {saveError && <p className="savebar__err" role="alert">{saveError}</p>}
          <div className="savebar__btns">
            <button type="button" className="abtn abtn--ghost" onClick={() => { setEdits({}); setSaveError(null); }} disabled={saving}>Discard</button>
            <button type="button" className="abtn abtn--lime" onClick={save} disabled={saving || invalid}>{saving ? 'Saving…' : invalid ? 'Fix errors to save' : `Save ${dirtyDates.length} ${dirtyDates.length === 1 ? 'day' : 'days'}`}</button>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><CheckCircleIcon /> {toast}</div>}
    </SubPage>
  );
}

function Stepper({ label, value, disabled, onMinus, onPlus }: { label: string; value: number; disabled: boolean; onMinus: () => void; onPlus: () => void }) {
  return (
    <div className="av__step">
      <span>{label}</span>
      <div>
        <button type="button" disabled={disabled || value <= 0} onClick={onMinus} aria-label={`Decrease ${label}`}><MinusIcon size={16} /></button>
        <output aria-label={label}>{value}</output>
        <button type="button" disabled={disabled} onClick={onPlus} aria-label={`Increase ${label}`}><PlusIcon size={16} /></button>
      </div>
    </div>
  );
}
