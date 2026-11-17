import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { CheckCircleIcon, ClockIcon, InfoIcon, MinusIcon, PlusIcon } from '../components/Icons';
import {
  COMMISSION_PCT, GST_PCT, INITIAL_PRICING, SLOTS, guestPays, rateErrors, withPct, youEarn,
  type Adjustments, type PricingState, type SlotHours,
} from '../data/pricing';
import '../styles/bookings.css';
import '../styles/pricing.css';

const inr = (n: number) => '₹' + n.toLocaleString('en-IN');
const STEP = 50;
const clampPct = (n: number) => Math.min(50, Math.max(1, n));

export default function Pricing() {
  const [saved, setSaved] = useState<PricingState>(INITIAL_PRICING);
  const [draft, setDraft] = useState<PricingState>(INITIAL_PRICING);
  const [roomId, setRoomId] = useState(INITIAL_PRICING.rooms[0].id);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const room = draft.rooms.find((r) => r.id === roomId)!;
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const errorsByRoom = useMemo(() => Object.fromEntries(draft.rooms.map((r) => [r.id, rateErrors(r.rates)])), [draft.rooms]);
  const hasErrors = Object.values(errorsByRoom).some((e) => Object.keys(e).length > 0);
  const roomErrors = errorsByRoom[roomId];
  const changedRooms = draft.rooms.filter((r, i) => JSON.stringify(r.rates) !== JSON.stringify(saved.rooms[i].rates)).map((r) => r.id);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const setRate = (h: SlotHours, value: number) =>
    setDraft((d) => ({ ...d, rooms: d.rooms.map((r) => (r.id === roomId ? { ...r, rates: { ...r.rates, [h]: Math.max(0, Math.min(99999, value)) } } : r)) }));

  const setAdj = (patch: Partial<Adjustments>) => setDraft((d) => ({ ...d, adjustments: { ...d.adjustments, ...patch } }));

  async function save() {
    if (hasErrors || !dirty) return;
    setSaving(true);
    try {
      // TODO: send `draft` to the pricing API (PUT /partner/pricing), then store the response.
      await new Promise((r) => setTimeout(r, 700));
      setSaved(draft);
      setToast(true);
    } finally {
      setSaving(false);
    }
  }

  const a = draft.adjustments;

  return (
    <div className="app">
      <main className="bk pr">
        <header className="bk__bar">
          <div>
            <h1>Pricing</h1>
            <p>Set what guests pay for each stay length</p>
          </div>
        </header>

        <nav className="chips" role="tablist" aria-label="Room type">
          {draft.rooms.map((r) => (
            <button key={r.id} type="button" role="tab" aria-selected={roomId === r.id} className={`chip${roomId === r.id ? ' is-active' : ''}`} onClick={() => setRoomId(r.id)}>
              {r.name}
              <span className="chip__count">{changedRooms.includes(r.id) ? '•' : r.rooms}</span>
            </button>
          ))}
        </nav>

        <p className="pr__hint"><InfoIcon /> {room.rooms} {room.name} rooms use these rates. Prices are before {GST_PCT}% GST.</p>

        <ul className="rates">
          {SLOTS.map((h) => {
            const rate = room.rates[h];
            const err = roomErrors[h];
            return (
              <li key={h} className={`rate${err ? ' rate--error' : ''}`}>
                <div className="rate__head">
                  <span className="rate__icon"><ClockIcon size={18} /></span>
                  <strong>{h} Hours</strong>
                  {saved.rooms.find((r) => r.id === roomId)!.rates[h] !== rate && <span className="rate__edited">Edited</span>}
                </div>

                <div className="stepper">
                  <button type="button" className="stepper__btn" onClick={() => setRate(h, rate - STEP)} aria-label={`Decrease ${h} hour rate`}><MinusIcon /></button>
                  <label className="stepper__field">
                    <span>₹</span>
                    <input
                      inputMode="numeric" value={rate === 0 ? '' : String(rate)} placeholder="0"
                      aria-label={`${h} hour rate`} aria-invalid={!!err}
                      onChange={(e) => setRate(h, Number(e.target.value.replace(/\D/g, '')))}
                    />
                  </label>
                  <button type="button" className="stepper__btn" onClick={() => setRate(h, rate + STEP)} aria-label={`Increase ${h} hour rate`}><PlusIcon /></button>
                </div>

                {err ? (
                  <p className="rate__error" role="alert">{err}</p>
                ) : (
                  <dl className="rate__calc">
                    <div><dt>Guest pays</dt><dd>{inr(guestPays(rate))}</dd></div>
                    <div><dt>You earn</dt><dd className="earn">{inr(youEarn(rate))}</dd></div>
                    {a.weekendOn && <div><dt>Fri–Sun</dt><dd>{inr(withPct(rate, a.weekendPct))}</dd></div>}
                  </dl>
                )}
              </li>
            );
          })}
        </ul>
        <p className="pr__fine">“You earn” is after the {COMMISSION_PCT}% Checkdin commission. Guest price includes {GST_PCT}% GST.</p>

        <section className="adj" aria-label="Price adjustments">
          <h2>Adjustments</h2>
          <p className="adj__sub">Applies to all room types</p>

          <div className="adj__row">
            <div className="adj__text">
              <strong>Weekend rates</strong>
              <small>Raise prices on Friday, Saturday and Sunday</small>
            </div>
            <label className="switch">
              <input type="checkbox" role="switch" checked={a.weekendOn} onChange={(e) => setAdj({ weekendOn: e.target.checked })} aria-label="Weekend rates" />
              <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
            </label>
          </div>
          {a.weekendOn && (
            <PctStepper label="Weekend increase" value={a.weekendPct} sign="+" onChange={(v) => setAdj({ weekendPct: clampPct(v) })} />
          )}

          <div className="adj__row">
            <div className="adj__text">
              <strong>Last-minute discount</strong>
              <small>Fill empty rooms with a same-day offer</small>
            </div>
            <label className="switch">
              <input type="checkbox" role="switch" checked={a.lastMinuteOn} onChange={(e) => setAdj({ lastMinuteOn: e.target.checked })} aria-label="Last-minute discount" />
              <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
            </label>
          </div>
          {a.lastMinuteOn && (
            <PctStepper label="Same-day discount" value={a.lastMinutePct} sign="−" onChange={(v) => setAdj({ lastMinutePct: clampPct(v) })} />
          )}
        </section>
      </main>

      {(dirty || saving) && (
        <div className="savebar" role="region" aria-label="Unsaved changes">
          <button type="button" className="abtn abtn--ghost" onClick={() => setDraft(saved)} disabled={saving}>Discard</button>
          <button type="button" className="abtn abtn--lime" onClick={save} disabled={hasErrors || saving}>
            {saving ? 'Saving…' : hasErrors ? 'Fix errors to save' : 'Save changes'}
          </button>
        </div>
      )}

      {toast && <div className="toast" role="status"><CheckCircleIcon /> Prices saved</div>}

      <BottomNav />
    </div>
  );
}

function PctStepper({ label, value, sign, onChange }: { label: string; value: number; sign: string; onChange: (v: number) => void }) {
  return (
    <div className="pct">
      <span>{label}</span>
      <div className="stepper stepper--sm">
        <button type="button" className="stepper__btn" onClick={() => onChange(value - 5)} aria-label={`Decrease ${label}`}><MinusIcon size={18} /></button>
        <output className="pct__val" aria-label={label}>{sign}{value}%</output>
        <button type="button" className="stepper__btn" onClick={() => onChange(value + 5)} aria-label={`Increase ${label}`}><PlusIcon size={18} /></button>
      </div>
    </div>
  );
}
