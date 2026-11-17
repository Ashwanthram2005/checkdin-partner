import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, CameraIcon, CheckCircleIcon, InfoIcon, LockIcon } from '../components/Icons';
import { getPropertySettings, removeLogo, updatePropertySettings, uploadLogo, type PropertySettings } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { initials } from '../lib/format';
import '../styles/pricing.css';
import '../styles/hotel.css';

const FIELDS = ['name', 'description', 'address', 'city', 'state', 'pincode', 'mapsUrl', 'contactPhone', 'contactEmail'] as const;
type Key = (typeof FIELDS)[number];
type Form = Record<Key, string>;
type Errors = Partial<Record<Key, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN = /^\d{6}$/;
const PHONE = /^\+?[0-9][0-9\s()-]{6,19}$/;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const toForm = (s: PropertySettings): Form => Object.fromEntries(FIELDS.map((k) => [k, s[k] ?? ''])) as Form;

/** The same rules the partner website uses. */
function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = 'Property name cannot be empty.';
  if (f.contactEmail && !EMAIL.test(f.contactEmail.trim())) e.contactEmail = 'Enter a valid email address.';
  if (f.pincode && !PIN.test(f.pincode.trim())) e.pincode = 'PIN code must be 6 digits.';
  if (f.contactPhone && !PHONE.test(f.contactPhone.trim())) e.contactPhone = 'Enter a valid contact number.';
  if (f.mapsUrl) {
    try { const u = new URL(f.mapsUrl.trim()); if (u.protocol !== 'http:' && u.protocol !== 'https:') e.mapsUrl = 'Map link must be an http(s) URL.'; }
    catch { e.mapsUrl = 'Map link must be a valid URL.'; }
  }
  if (f.description.length > 600) e.description = 'Description must be 600 characters or fewer.';
  return e;
}

export default function HotelDetails() {
  const { session, can } = useAuth();
  const id = session?.hotelId ?? '';
  const editable = can('rooms') || can('staff');
  const { data, error, loading, reload } = useApi(() => getPropertySettings(id), [id]);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (data) { setForm(toForm(data)); setErrors({}); } }, [data]);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const changed = useMemo(() => (data && form ? FIELDS.filter((k) => form[k] !== (data[k] ?? '')) : []), [data, form]);
  const set = (k: Key, v: string) => { setForm((f) => f && { ...f, [k]: v }); setErrors((e) => ({ ...e, [k]: undefined })); };

  async function save() {
    if (!form || !changed.length) return;
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) { setMsg({ ok: false, text: 'Fix the highlighted fields before saving.' }); return; }
    setSaving(true);
    try {
      const patch = Object.fromEntries(changed.map((k) => [k, form[k].trim()]));
      await updatePropertySettings(id, patch);
      setMsg({ ok: true, text: 'Hotel details saved.' });
      reload();
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  async function onLogo(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (!LOGO_TYPES.includes(f.type)) { setMsg({ ok: false, text: 'Logo must be a PNG, JPG or WebP image.' }); return; }
    if (f.size > 2 * 1024 * 1024) { setMsg({ ok: false, text: 'Logo must be 2 MB or smaller.' }); return; }
    setSaving(true);
    try {
      const url = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(new Error('Could not read the selected file.')); r.readAsDataURL(f); });
      await uploadLogo(id, url);
      setMsg({ ok: true, text: 'Logo updated.' }); reload();
    } catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  async function onRemoveLogo() {
    if (!window.confirm('Remove your logo?')) return;
    setSaving(true);
    try { await removeLogo(id); setMsg({ ok: true, text: 'Logo removed.' }); reload(); }
    catch (err) { setMsg({ ok: false, text: (err as Error).message }); }
    finally { setSaving(false); }
  }

  const field = (k: Key, label: string, props: { type?: string; inputMode?: 'tel' | 'email' | 'numeric' | 'url'; placeholder?: string; maxLength?: number } = {}) => (
    <div className={`hf${errors[k] ? ' hf--error' : ''}`}>
      <label htmlFor={`h-${k}`}>{label}</label>
      <input id={`h-${k}`} value={form?.[k] ?? ''} disabled={!editable || !form} onChange={(e) => set(k, e.target.value)} aria-invalid={!!errors[k]}
        autoCapitalize={props.type === 'email' || props.type === 'url' ? 'none' : undefined} spellCheck={false} {...props} />
      {errors[k] && <p className="field__error" role="alert">{errors[k]}</p>}
    </div>
  );

  return (
    <SubPage title="Hotel details" subtitle="How your property appears to guests">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      {msg && <div className={msg.ok ? 'notice notice--ok' : 'alert alert--light'} role="status">{msg.ok ? <CheckCircleIcon size={18} /> : <AlertIcon />} {msg.text}</div>}
      {!editable && <p className="pr__hint"><InfoIcon /> Your role can view these details but not change them.</p>}
      {loading && !data && <p className="muted-note">Loading…</p>}

      {data && form && (
        <>
          <section className="panel logo-card" aria-label="Logo">
            {data.logoUrl ? <img className="logo-card__img" src={data.logoUrl} alt="Your logo" /> : <span className="logo-card__ph" aria-hidden="true">{initials(data.name)}</span>}
            <div className="logo-card__text"><strong>{data.name}</strong><small>PNG, JPG or WebP, up to 2 MB</small></div>
            {editable && (
              <div className="logo-card__btns">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={onLogo} />
                <button type="button" className="mini-btn" disabled={saving} onClick={() => fileRef.current?.click()}><CameraIcon size={16} /> {data.logoUrl ? 'Change' : 'Add logo'}</button>
                {data.logoUrl && <button type="button" className="mini-btn" disabled={saving} onClick={onRemoveLogo}>Remove</button>}
              </div>
            )}
          </section>

          <section className="panel" aria-label="About">
            <h2>About</h2>
            {field('name', 'Property name')}
            <div className={`hf${errors.description ? ' hf--error' : ''}`}>
              <label htmlFor="h-description">Description</label>
              <textarea id="h-description" className="textarea" maxLength={700} value={form.description} disabled={!editable} onChange={(e) => set('description', e.target.value)} placeholder="Tell guests what makes your property a good stay." aria-invalid={!!errors.description} />
              <p className={`char-count${form.description.length > 600 ? ' over' : ''}`}>{form.description.length}/600</p>
              {errors.description && <p className="field__error" role="alert">{errors.description}</p>}
            </div>
          </section>

          <section className="panel" aria-label="Address">
            <h2>Address</h2>
            {field('address', 'Address')}
            <div className="hf-row">{field('city', 'City')}{field('state', 'State')}</div>
            <div className="hf-row">{field('pincode', 'PIN code', { inputMode: 'numeric', maxLength: 6 })}</div>
            {field('mapsUrl', 'Map link', { type: 'url', inputMode: 'url', placeholder: 'https://maps.google.com/…' })}
          </section>

          <section className="panel" aria-label="Contact">
            <h2>Contact</h2>
            {field('contactPhone', 'Contact number', { type: 'tel', inputMode: 'tel', placeholder: '+91 98765 43210' })}
            {field('contactEmail', 'Contact email', { type: 'email', inputMode: 'email', placeholder: 'frontdesk@yourhotel.com' })}
          </section>

          <section className="panel" aria-label="Fixed details">
            <h2>Business details</h2>
            <dl className="dl">
              <div className="drow"><dt>Legal name</dt><dd>{data.legalName || '—'}</dd></div>
              <div className="drow"><dt>Time zone</dt><dd>{data.timezone || '—'}</dd></div>
              <div className="drow"><dt>Language</dt><dd>{data.language || '—'}</dd></div>
              <div className="drow"><dt>Currency</dt><dd>{data.currency || '—'}</dd></div>
            </dl>
            <p className="note"><LockIcon size={16} /><span>Legal name, PAN, GST and bank details can only be changed on the Checkdin partner website, on a computer.</span></p>
          </section>
        </>
      )}

      {editable && changed.length > 0 && (
        <div className="savebar" role="region" aria-label="Unsaved changes">
          <div className="savebar__btns">
            <button type="button" className="abtn abtn--ghost" disabled={saving} onClick={() => { if (data) { setForm(toForm(data)); setErrors({}); } }}>Discard</button>
            <button type="button" className="abtn abtn--lime" disabled={saving} onClick={save}>{saving ? 'Saving…' : `Save ${changed.length} ${changed.length === 1 ? 'change' : 'changes'}`}</button>
          </div>
        </div>
      )}
    </SubPage>
  );
}
