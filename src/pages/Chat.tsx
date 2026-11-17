import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertIcon, ArrowLeft, InfoIcon, PhoneIcon, RefreshIcon, SendIcon } from '../components/Icons';
import { getBookings, getThread, markThreadRead, sendChatMessage, type ChatMessage } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { fmtTime, initials } from '../lib/format';
import { TEMPLATES, fillTemplate, intlPhone } from '../lib/messageTemplates';
import '../styles/chat.css';

interface Out { cid: string; body: string; at: Date; failed?: boolean }

function dayLabel(d: Date) {
  const t = new Date(); const y = new Date(); y.setDate(t.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  return same(d, t) ? 'Today' : same(d, y) ? 'Yesterday' : d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Chat() {
  const { bookingId = '' } = useParams();
  const navigate = useNavigate();
  const { property } = useAuth();
  const books = useApi(getBookings);
  const thread = useApi(() => getThread(bookingId), [bookingId]);
  const [text, setText] = useState('');
  const [out, setOut] = useState<Out[]>([]);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const reload = thread.reload;

  const b = (books.data ?? []).find((x) => x.id === bookingId) ?? null;
  const available = thread.data?.available ?? true;
  const server = thread.data?.messages ?? [];

  useEffect(() => {
    const t = setInterval(reload, 8000);
    return () => clearInterval(t);
  }, [reload]);

  // tell the server the guest's messages have been read
  const unreadFromGuest = server.filter((m) => m.from === 'guest' && !m.read).length;
  useEffect(() => { if (unreadFromGuest > 0) markThreadRead(bookingId).catch(() => {}); }, [unreadFromGuest, bookingId]);

  const items = useMemo(() => {
    const pending: (ChatMessage & { cid?: string; failed?: boolean })[] = out.map((o) => ({ id: o.cid, cid: o.cid, from: 'partner', body: o.body, at: o.at, read: false, failed: o.failed }));
    return [...server, ...pending].sort((a, c) => a.at.getTime() - c.at.getTime());
  }, [server, out]);
  const msgCount = items.length;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgCount]);

  async function send(body: string, cid = `c${Date.now()}`) {
    const msg = body.trim();
    if (!msg) return;
    setError(null);
    setOut((o) => (o.some((x) => x.cid === cid) ? o.map((x) => (x.cid === cid ? { ...x, failed: false } : x)) : [...o, { cid, body: msg, at: new Date() }]));
    try {
      await sendChatMessage(bookingId, msg);
      setOut((o) => o.filter((x) => x.cid !== cid));
      reload();
    } catch (e) {
      setOut((o) => o.map((x) => (x.cid === cid ? { ...x, failed: true } : x)));
      setError((e as Error).message);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const body = text; setText('');
    void send(body);
  }

  const hotel = property?.name ?? 'our hotel';
  const phone = b?.phone ?? '';
  let lastDay = '';

  return (
    <div className="app chat-app">
      <header className="chat__bar">
        <button type="button" className="icon-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/messages'))} aria-label="Back"><ArrowLeft /></button>
        <span className="avatar">{initials(b?.guest ?? '')}</span>
        <Link to={b ? `/bookings/${encodeURIComponent(b.id)}` : '/bookings'} className="chat__who">
          <strong>{b?.guest ?? 'Guest'}</strong>
          <small>{b ? `#${b.reference} · ${b.stayLabel} · ${b.status}` : ''}</small>
        </Link>
        {phone && <a className="icon-btn" href={`tel:${phone}`} aria-label={`Call ${b?.guest ?? 'guest'}`}><PhoneIcon /></a>}
      </header>

      <main className="chat__body" aria-live="polite">
        {thread.error && !thread.data && <div className="alert" role="alert"><AlertIcon /> {thread.error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}

        {!available && (
          <div className="chat__unavail" role="status">
            <p><InfoIcon /> <span>In-app chat isn’t switched on for your server yet, so messages sent here can’t reach the guest. Use WhatsApp or SMS for now.</span></p>
            {b && phone && (
              <div className="actions">
                <a className="abtn abtn--lime" href={`https://wa.me/${intlPhone(phone)}?text=${encodeURIComponent(fillTemplate(TEMPLATES[0].text, b, hotel))}`} target="_blank" rel="noreferrer">WhatsApp</a>
                <a className="abtn abtn--ghost" href={`sms:+${intlPhone(phone)}?body=${encodeURIComponent(fillTemplate(TEMPLATES[0].text, b, hotel))}`}>SMS</a>
              </div>
            )}
          </div>
        )}

        {available && thread.loading && !thread.data && <p className="muted-note chat__center">Loading messages…</p>}
        {available && thread.data && items.length === 0 && <p className="muted-note chat__center">No messages yet. Say hello 👋 or pick a quick message below.</p>}

        <ol className="bubbles">
          {items.map((m) => {
            const d = dayLabel(m.at); const head = d !== lastDay; lastDay = d;
            const failed = (m as { failed?: boolean }).failed;
            const cid = (m as { cid?: string }).cid;
            return (
              <li key={m.id}>
                {head && <p className="bubbles__day">{d}</p>}
                <div className={`bubble bubble--${m.from}${cid ? ' is-pending' : ''}${failed ? ' is-failed' : ''}`}>
                  <p>{m.body}</p>
                  <span className="bubble__meta">{fmtTime(m.at)}{m.from === 'partner' && !cid && (m.read ? ' · Read' : ' · Sent')}{cid && !failed && ' · Sending…'}</span>
                  {failed && cid && (
                    <span className="bubble__fail">Not sent. <button type="button" className="link-btn" onClick={() => send(m.body, cid)}><RefreshIcon size={14} /> Retry</button> <button type="button" className="link-btn" onClick={() => setOut((o) => o.filter((x) => x.cid !== cid))}>Remove</button></span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
        <div ref={endRef} />
      </main>

      <footer className="chat__foot">
        {error && <p className="chat__err" role="alert"><AlertIcon size={16} /> {error}</p>}
        {b && available && (
          <div className="chat__quick" role="group" aria-label="Quick messages">
            {TEMPLATES.map((t) => <button key={t.id} type="button" className="opt" onClick={() => setText(fillTemplate(t.text, b, hotel))}>{t.label}</button>)}
          </div>
        )}
        <form className="chat__form" onSubmit={submit}>
          <textarea value={text} rows={1} maxLength={1000} placeholder={available ? 'Type a message' : 'Chat isn’t available yet'} disabled={!available} aria-label="Message"
            onChange={(e) => setText(e.target.value)}
            onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }} />
          <button type="submit" className="chat__send" disabled={!available || !text.trim()} aria-label="Send"><SendIcon /></button>
        </form>
      </footer>
    </div>
  );
}
