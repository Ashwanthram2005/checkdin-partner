import { ChangeEvent, useEffect, useRef, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, CameraIcon, CheckCircleIcon, InfoIcon, TrashIcon } from '../components/Icons';
import { deletePhoto, getPropertySettings, setCoverPhoto, updatePropertySettings, uploadPhoto, type PhotoItem } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';

const MAX_PHOTOS = 20;
const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const AMENITIES = ['Free Wi-Fi', 'Air Conditioning', 'Power Backup', '24x7 Reception', 'Secure Parking', 'CCTV Security', 'Laundry Service', 'Lift / Elevator', 'Restaurant', 'Room Service', 'Hot Water', 'Daily Housekeeping', 'Luggage Storage', 'Airport Pickup', 'Doctor on Call', 'Banquet Hall', 'Mini Fridge', 'Television'];

const readAsDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result));
  r.onerror = () => rej(new Error('Could not read the selected file.'));
  r.readAsDataURL(f);
});

export default function PropertyPhotos() {
  const { session, can } = useAuth();
  const id = session?.hotelId ?? '';
  const editable = can('rooms');
  const { data, error, loading, reload } = useApi(() => getPropertySettings(id), [id]);
  const [photos, setPhotos] = useState<PhotoItem[] | null>(null);
  const [amen, setAmen] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (data) { setPhotos(data.images); setAmen(data.amenities); } }, [data]);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const list = photos ?? [];
  const amenDirty = !!data && !!amen && JSON.stringify([...amen].sort()) !== JSON.stringify([...data.amenities].sort());

  async function run(fn: () => Promise<PhotoItem[]>, ok: string) {
    setBusy(true); setMsg(null);
    try { setPhotos(await fn()); setMsg({ ok: true, text: ok }); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    for (const f of files) {
      if (!TYPES.includes(f.type)) { setMsg({ ok: false, text: 'Photos must be PNG, JPG or WebP.' }); return; }
      if (f.size > MAX_BYTES) { setMsg({ ok: false, text: `“${f.name}” is over 5 MB. Choose a smaller photo.` }); return; }
      if (list.length >= MAX_PHOTOS) { setMsg({ ok: false, text: `A property can show at most ${MAX_PHOTOS} photos.` }); return; }
      try {
        const url = await readAsDataUrl(f);
        await run(() => uploadPhoto(id, url, undefined, f.name), 'Photo added.');
      } catch (err) { setMsg({ ok: false, text: (err as Error).message }); return; }
    }
  }

  async function saveAmenities() {
    if (!amen) return;
    setBusy(true); setMsg(null);
    try { await updatePropertySettings(id, { amenities: amen }); setMsg({ ok: true, text: 'Amenities saved.' }); reload(); }
    catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
    finally { setBusy(false); }
  }

  const toggle = (a: string) => setAmen((cur) => (cur ?? []).includes(a) ? (cur ?? []).filter((x) => x !== a) : [...(cur ?? []), a]);

  return (
    <SubPage title="Photos & amenities" subtitle="What guests see on your listing">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      {msg && <div className={msg.ok ? 'notice notice--ok' : 'alert alert--light'} role="status">{msg.ok ? <CheckCircleIcon size={18} /> : <AlertIcon />} {msg.text}</div>}
      {!editable && <p className="pr__hint"><InfoIcon /> Your role can view this but not change it.</p>}

      <section className="panel" aria-label="Property photos">
        <div className="panel__head">
          <div><h2>Photos</h2><p>The first photo is the cover. JPG, PNG or WebP, up to 5 MB each.</p></div>
          <span className="count-badge">{list.length}</span>
        </div>
        {loading && !data && <p className="muted-note">Loading…</p>}
        {data && list.length === 0 && <p className="muted-note">No photos yet. Good photos get many more bookings.</p>}
        <ul className="photos">
          {list.map((p, i) => (
            <li key={p.id} className="photo">
              <img src={p.url} alt={`Property photo ${i + 1}`} loading="lazy" />
              {(p.cover || i === 0) && <span className="photo__cover">Cover</span>}
              {editable && (
                <div className="photo__bar">
                  {!(p.cover || i === 0) && <button type="button" disabled={busy} onClick={() => run(() => setCoverPhoto(id, p.id), 'Cover photo updated.')}>Make cover</button>}
                  <button type="button" className="danger" disabled={busy} aria-label={`Delete photo ${i + 1}`} onClick={() => { if (window.confirm('Delete this photo?')) void run(() => deletePhoto(id, p.id), 'Photo deleted.'); }}><TrashIcon /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {editable && (
          <>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" multiple hidden onChange={onPick} />
            <button type="button" className="abtn abtn--dark" disabled={busy || list.length >= MAX_PHOTOS} onClick={() => fileRef.current?.click()}><CameraIcon /> {busy ? 'Uploading…' : 'Add photos'}</button>
          </>
        )}
      </section>

      <section className="panel" aria-label="Amenities">
        <div className="panel__head"><div><h2>Amenities</h2><p>What your property offers.</p></div><span className="count-badge">{(amen ?? []).length}</span></div>
        <div className="opts">
          {AMENITIES.map((a) => {
            const on = (amen ?? []).includes(a);
            return <button key={a} type="button" disabled={!editable || !data} aria-pressed={on} className={`opt${on ? ' is-on' : ''}`} onClick={() => toggle(a)}>{a}</button>;
          })}
        </div>
        {editable && amenDirty && (
          <div className="actions"><button type="button" className="abtn abtn--ghost" onClick={() => setAmen(data?.amenities ?? [])}>Discard</button><button type="button" className="abtn abtn--lime" disabled={busy} onClick={saveAmenities}>{busy ? 'Saving…' : 'Save amenities'}</button></div>
        )}
      </section>
    </SubPage>
  );
}
