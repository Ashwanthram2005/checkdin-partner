import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../components/BottomNav';
import { AlertIcon, CheckCircleIcon, InfoIcon, MinusIcon, PlusIcon } from '../components/Icons';
import {
  SLOT_KEYS, SLOT_LABEL, getPricing, getPricingRules, updatePricing, updatePricingRules,
  type Pricing, type PricingRule, type SlotKey,
} from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { gstAmount, gstPctFor, guestPays } from '../lib/gst';
import { inr } from '../lib/format';
import '../styles/bookings.css';
import '../styles/pricing.css';

const STEP = 50;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const gstBadge = (base: number) => (gstPctFor(base) === 0 ? 'Exempt (0%)' : `${gstPctFor(base)}% GST`);

export default function PricingPage() {
  const { can } = useAuth();
  const editable = can('rooms') || can('finance');
  const price = useApi(getPricing);
  const rules = useApi(getPricingRules);

  const [draft, setDraft] = useState<Pricing | null>(null);
  const [draftRules, setDraftRules] = useState<PricingRule[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => { if (price.data) setDraft(price.data); }, [price.data]);
  useEffect(() => { if (rules.data) setDraftRules(rules.data); }, [rules.data]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const priceDirty = !!draft && !!price.data && !same(draft, price.data);
  const rulesDirty = !!draftRules && !!rules.data && !same(draftRules, rules.data);
  const dirty = priceDirty || rulesDirty;

  const errors = useMemo(() => {
    const e: Partial<Record<SlotKey | 'fullDay', string>> = {};
    if (!draft) return e;
    for (const k of SLOT_KEYS) if (draft.active[k] && !(draft.base[k] > 0)) e[k] = 'Set a price, or turn this slot off';
    if (draft.fullDay.active && draft.fullDay.price < 0) e.fullDay = 'Price cannot be negative';
    return e;
  }, [draft]);
  const hasErrors = Object.keys(errors).length > 0;

  const setBase = (k: SlotKey, v: number) => setDraft((d) => d && { ...d, base: { ...d.base, [k]: Math.max(0, Math.min(99999, v)) } });
  const setActive = (k: SlotKey, v: boolean) => setDraft((d) => d && { ...d, active: { ...d.active, [k]: v } });
  const setRule = (id: string, patch: Partial<PricingRule>) => setDraftRules((rs) => rs && rs.map((r) => (r.rule_id === id ? { ...r, ...patch } : r)));

  async function save() {
    if (!dirty || hasErrors || !draft) return;
    setSaving(true); setSaveError(null);
    try {
      if (priceDirty) await updatePricing(draft);
      if (rulesDirty && draftRules) await updatePricingRules(draftRules);
      setToast('Prices saved');
      price.reload(); rules.reload();
    } catch (e) { setSaveError((e as Error).message); }
    finally { setSaving(false); }
  }

  const discard = () => { setDraft(price.data); setDraftRules(rules.data); setSaveError(null); };
  const loadError = price.error || rules.error;
  const weekend = (k: SlotKey) => (draft ? guestPays(Math.round(draft.base[k] * (1 + draft.weekendSurcharge / 100))) : 0);
  const groups = draftRules ? [...new Set(draftRules.map((r) => r.group))] : [];

  return (
    <div className="app">
      <main className="bk pr">
        <header className="bk__bar">
          <div><h1>Pricing</h1><p>Set one price per slot, without GST</p></div>
        </header>

        {loadError && <div className="alert" role="alert"><AlertIcon /> {loadError} <button type="button" className="link-btn" onClick={() => { price.reload(); rules.reload(); }}>Retry</button></div>}
        {!editable && draft && <p className="pr__hint"><InfoIcon /> Your role can view prices but not change them.</p>}

        <section className="slabs" aria-label="How GST is applied">
          <p className="slabs__title">Enter your price without GST — Checkdin adds the right slab.</p>
          <ul>
            <li><span>Up to ₹1,000</span><b>Exempt — 0%</b></li>
            <li><span>₹1,001 – ₹7,500</span><b>5% GST</b></li>
            <li><span>Above ₹7,500</span><b>18% GST</b></li>
          </ul>
          <p className="slabs__note">Guests see the GST-inclusive amount; your payout is worked out on the base price.</p>
        </section>

        {price.loading && !draft && <p className="muted-note">Loading prices…</p>}

        {draft && (
          <>
            <ul className="rates">
              {SLOT_KEYS.map((k) => {
                const base = draft.base[k];
                const err = errors[k];
                const on = draft.active[k];
                return (
                  <li key={k} className={`rate${err ? ' rate--error' : ''}${on ? '' : ' rate--off'}`}>
                    <div className="rate__head">
                      <strong>{SLOT_LABEL[k]}</strong>
                      {price.data && price.data.base[k] !== base && <span className="rate__edited">Edited</span>}
                      <label className="switch rate__switch">
                        <input type="checkbox" role="switch" checked={on} disabled={!editable} onChange={(e) => setActive(k, e.target.checked)} aria-label={`${SLOT_LABEL[k]} bookable`} />
                        <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
                      </label>
                    </div>
                    <span className="gst-badge">{gstBadge(base)}</span>

                    <div className="stepper">
                      <button type="button" className="stepper__btn" disabled={!editable} onClick={() => setBase(k, base - STEP)} aria-label={`Decrease ${SLOT_LABEL[k]} price`}><MinusIcon /></button>
                      <label className="stepper__field">
                        <span>₹</span>
                        <input inputMode="numeric" value={base === 0 ? '' : String(base)} placeholder="0" disabled={!editable} aria-label={`${SLOT_LABEL[k]} base price`} aria-invalid={!!err}
                          onChange={(e) => setBase(k, Number(e.target.value.replace(/\D/g, '')))} />
                      </label>
                      <button type="button" className="stepper__btn" disabled={!editable} onClick={() => setBase(k, base + STEP)} aria-label={`Increase ${SLOT_LABEL[k]} price`}><PlusIcon /></button>
                    </div>

                    {err ? <p className="rate__error" role="alert">{err}</p> : (
                      <dl className="rate__calc rate__calc--rows">
                        <div><dt>Base</dt><dd>{inr(base)}</dd></div>
                        <div><dt>GST ({gstPctFor(base)}%)</dt><dd>{gstAmount(base) ? inr(gstAmount(base)) : '—'}</dd></div>
                        <div className="total"><dt>Guest pays</dt><dd>{inr(guestPays(base))}</dd></div>
                        {draft.weekendSurcharge > 0 && <div><dt>Fri–Sun guest pays</dt><dd>{inr(weekend(k))}</dd></div>}
                      </dl>
                    )}
                  </li>
                );
              })}
            </ul>

            <section className="adj" aria-label="Adjustments">
              <h2>Adjustments</h2>
              <p className="adj__sub">Applied on top of the slot price, before GST.</p>
              <div className="adj__row">
                <div className="adj__text"><strong>Extra hour charge</strong><small>Charged when a guest stays beyond their slot.</small></div>
                <label className="num-input"><span>₹</span><input inputMode="numeric" disabled={!editable} value={draft.extraHour || ''} placeholder="0" aria-label="Extra hour charge"
                  onChange={(e) => setDraft({ ...draft, extraHour: Number(e.target.value.replace(/\D/g, '')) || 0 })} /></label>
              </div>
              <div className="adj__row">
                <div className="adj__text"><strong>Weekend surcharge</strong><small>Added on Friday, Saturday and Sunday (0–50%).</small></div>
                <label className="num-input"><input inputMode="numeric" disabled={!editable} value={draft.weekendSurcharge || ''} placeholder="0" aria-label="Weekend surcharge percent"
                  onChange={(e) => setDraft({ ...draft, weekendSurcharge: Math.min(50, Number(e.target.value.replace(/\D/g, '')) || 0) })} /><span>%</span></label>
              </div>
            </section>

            <section className="adj" aria-label="Full-day stay">
              <div className="adj__row">
                <div className="adj__text"><h2>Full-day stay</h2><small>Guests book whole nights. Leave the price at 0 if you don’t offer them.</small></div>
                <label className="switch">
                  <input type="checkbox" role="switch" checked={draft.fullDay.active} disabled={!editable} onChange={(e) => setDraft({ ...draft, fullDay: { ...draft.fullDay, active: e.target.checked } })} aria-label="Full-day stays bookable" />
                  <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
                </label>
              </div>
              <div className="adj__row">
                <div className="adj__text"><strong>Price per night</strong>{draft.fullDay.price === 0 && <small>Not offered</small>}</div>
                <label className="num-input"><span>₹</span><input inputMode="numeric" disabled={!editable} value={draft.fullDay.price || ''} placeholder="0" aria-label="Full-day price per night"
                  onChange={(e) => setDraft({ ...draft, fullDay: { ...draft.fullDay, price: Number(e.target.value.replace(/\D/g, '')) || 0 } })} /></label>
              </div>
              <div className="times">
                <label>Check-in<input type="time" disabled={!editable} value={draft.fullDay.checkIn} onChange={(e) => setDraft({ ...draft, fullDay: { ...draft.fullDay, checkIn: e.target.value } })} /></label>
                <label>Check-out<input type="time" disabled={!editable} value={draft.fullDay.checkOut} onChange={(e) => setDraft({ ...draft, fullDay: { ...draft.fullDay, checkOut: e.target.value } })} /></label>
              </div>
            </section>
          </>
        )}

        {draftRules && draftRules.length > 0 && (
          <section className="adj" aria-label="Dynamic pricing rules">
            <h2>Dynamic pricing</h2>
            <p className="adj__sub">Rules that move your slot price by time, day, season or demand.</p>
            {groups.map((g) => (
              <div key={g} className="rules">
                <h3 className="rules__group">{g}</h3>
                {draftRules.filter((r) => r.group === g).map((r) => (
                  <div key={r.rule_id} className="rule">
                    <div className="adj__text"><strong>{r.label}</strong><small>{r.window}</small></div>
                    <div className="rule__ctl">
                      <span className={`rule__pct${r.adjustment < 0 ? ' is-neg' : ''}`}>{r.adjustment > 0 ? '+' : ''}{r.adjustment}%</span>
                      <label className="switch">
                        <input type="checkbox" role="switch" checked={r.active} disabled={!editable} onChange={(e) => setRule(r.rule_id, { active: e.target.checked })} aria-label={`${r.label} rule`} />
                        <span className="switch__track" aria-hidden="true"><span className="switch__thumb" /></span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}
      </main>

      {editable && (dirty || saving) && (
        <div className="savebar" role="region" aria-label="Unsaved changes">
          {saveError && <p className="savebar__err" role="alert">{saveError}</p>}
          <div className="savebar__btns">
            <button type="button" className="abtn abtn--ghost" onClick={discard} disabled={saving}>Discard</button>
            <button type="button" className="abtn abtn--lime" onClick={save} disabled={hasErrors || saving}>{saving ? 'Saving…' : hasErrors ? 'Fix errors to save' : 'Save changes'}</button>
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status"><CheckCircleIcon /> {toast}</div>}
      <BottomNav />
    </div>
  );
}
