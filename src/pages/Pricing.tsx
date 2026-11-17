import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { CheckCircleIcon, ClockIcon, InfoIcon, MinusIcon, PlusIcon } from '../components/Icons';
import {
  GST_PCT, INITIAL_PRICING, PLATFORM_FEE, PLATFORM_FEE_TOTAL, SLOTS, guestPays, rateErrors, withPct, youEarn,
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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const errors = useMemo(() => rateErrors(draft.rates), [draft.rates]);
  const hasErrors = Object.keys(errors).length > 0;
  const a = draft.adjustments;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const setRate = (h: SlotHours, value: number) =>
    setDraft((d) => ({ ...d, rates: { ...d.rates, [h]: Math.max(0, Math.min(99999, value)) } }));
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

  return (
    <div className="app">
      <main className="bk pr">
        <header className="bk__bar">
          <div>
            <h1>Pricing</h1>
            <p>Set the price for each slot</p>
          </div>
        </header>

        <p className="pr__hint">
          <InfoIcon /> Slots only: {SLOTS.join(', ')} hours. Prices are before {GST_PCT}% GST. Checkdin charges a platform fee of {inr(PLATFORM_FEE)} + {GST_PCT}% GST ({inr(PLATFORM_FEE_TOTAL)}) per booking, with no commission.
        </p>

        <ul className="rates">
          {SLOTS.map((h) => {
            const rate = draft.rates[h];
            const err = errors[h];
            return (
              <li key={h} className={`rate${err ? ' rate--error' : ''}`}>
                <div className="rate__head">
                  <span className="rate__icon"><ClockIcon size={18} /></span>
                  <strong>{h} Hours</strong>
                  {saved.rates[h] !== rate && <span className="rate__edited">Edited</span>}
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
                  <>
                    <dl className="rate__calc">
                      <div><dt>Guest pays</dt><dd>{inr(guestPays(rate))}</dd></div>
                      <div><dt>Platform fee</dt><dd className="fee">−{inr(PLATFORM_FEE_TOTAL)}</dd></div>
                      <div><dt>You earn</dt><dd className="earn">{inr(youEarn(rate))}</dd></div>
                    </dl>
                    {a.weekendOn && (
                      <p className="rate__wk">Fri–Sun: {inr(withPct(rate, a.weekendPct))} <span>(guest pays {inr(guestPays(withPct(rate, a.weekendPct)))})</span></p>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
        <p className="pr__fine">“You earn” is the slot price minus the {inr(PLATFORM_FEE)} + {GST_PCT}% GST platform fee. The guest pays the slot price plus {GST_PCT}% GST.</p>

        <section className="adj" aria-label="Price adjustments">
          <h2>Adjustments</h2>
          <p className="adj__sub">Applies to all slots</p>

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
          {a.weekendOn && <PctStepper label="Weekend increase" value={a.weekendPct} sign="+" onChange={(v) => setAdj({ weekendPct: clampPct(v) })} />}

          <div className="adj__row">
            <div className="adj__text">
              <strong>Last-minute discount</strong>
              <small>Fill empty slots with a same-day offer</small>
            </div>
            <label className="switch">
              <input type="checkbox" role="switch" checked={a.lastMinuteOn} onChange={(e) => setAdj({ lastMinuteOn: e.target.checked })} aria-label="Last-minute discount" />
              <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
            </label>
          </div>
          {a.lastMinuteOn && <PctStepper label="Same-day discount" value={a.lastMinutePct} sign="−" onChange={(v) => setAdj({ lastMinutePct: clampPct(v) })} />}
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
