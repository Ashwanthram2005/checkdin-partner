import { useMemo, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, CloseIcon, StarIcon } from '../components/Icons';
import { getReviews, replyToReview, type Review } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { fmtDate } from '../lib/format';

type Tab = 'all' | 'awaiting' | 'replied' | 'low';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All reviews' }, { id: 'awaiting', label: 'Needs reply' }, { id: 'replied', label: 'Replied' }, { id: 'low', label: '3★ and below' },
];

function Stars({ n }: { n: number }) {
  return <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>{[1, 2, 3, 4, 5].map((i) => <span key={i} className={i <= n ? '' : 'off'}><StarIcon /></span>)}</span>;
}

export default function Reviews() {
  const { can } = useAuth();
  const canReply = can('bookings');
  const { data, error, loading, reload } = useApi(getReviews);
  const [tab, setTab] = useState<Tab>('all');
  const [replying, setReplying] = useState<Review | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});

  const all = useMemo(() => (data ?? []).map((r) => (local[r.id] ? { ...r, response: local[r.id] } : r)), [data, local]);
  const count = { all: all.length, awaiting: all.filter((r) => !r.response).length, replied: all.filter((r) => r.response).length, low: all.filter((r) => r.rating <= 3).length };
  const rows = all.filter((r) => (tab === 'awaiting' ? !r.response : tab === 'replied' ? !!r.response : tab === 'low' ? r.rating <= 3 : true));
  const avg = all.length ? all.reduce((t, r) => t + r.rating, 0) / all.length : 0;

  async function send() {
    if (!replying) return;
    const reply = text.trim();
    if (reply.length < 3) { setErr('Write a short reply first.'); return; }
    setBusy(true); setErr(null);
    try {
      await replyToReview(replying.id, reply);
      setLocal((l) => ({ ...l, [replying.id]: reply }));
      setReplying(null); setText('');
      reload();
    } catch (e) { setErr((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <SubPage title="Reviews" subtitle="Reply to guest feedback. One reply per review.">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}

      <section className="panel rv-sum" aria-label="Rating summary">
        <div><strong className="rv-sum__n">{all.length ? avg.toFixed(1) : '—'}</strong><Stars n={Math.round(avg)} /></div>
        <p>{all.length} {all.length === 1 ? 'review' : 'reviews'} · {count.awaiting} need a reply</p>
      </section>

      <nav className="chips" role="tablist" aria-label="Review filter">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`chip${tab === t.id ? ' is-active' : ''}`} onClick={() => setTab(t.id)}>{t.label}<span className="chip__count">{count[t.id]}</span></button>)}
      </nav>

      {loading && !data && <p className="muted-note">Loading reviews…</p>}
      {data && rows.length === 0 && (
        <div className="empty"><StarIcon size={28} /><strong>{all.length === 0 ? 'No reviews yet' : 'Nothing here'}</strong><span>{all.length === 0 ? 'Guests can review you after their stay. They’ll appear here.' : 'Try another filter.'}</span></div>
      )}

      <ul className="cards">
        {rows.map((r) => (
          <li key={r.id} className="card-b">
            <div className="card-b__top">
              <div className="card-b__who"><strong>{r.guest}</strong><small>{r.createdAt ? fmtDate(r.createdAt) : ''}{r.room ? ` · ${r.room}` : ''}{r.hours ? ` · ${r.hours}h` : ''}</small></div>
              <Stars n={r.rating} />
            </div>
            {r.title && <p className="rv-title">{r.title}</p>}
            {r.body && <p className="rv-body">{r.body}</p>}
            {r.response ? (
              <div className="rv-reply"><small>Your reply{r.repliedOn ? ` · ${fmtDate(r.repliedOn)}` : ''}</small><p>{r.response}</p></div>
            ) : canReply ? (
              <div className="actions"><button type="button" className="abtn abtn--dark" onClick={() => { setReplying(r); setText(''); setErr(null); }}>Reply</button></div>
            ) : null}
          </li>
        ))}
      </ul>

      {replying && (
        <div className="sheet-wrap">
          <button type="button" className="sheet-scrim" aria-label="Cancel" onClick={() => setReplying(null)} />
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Reply to review">
            <div className="sheet__grab" aria-hidden="true" />
            <header className="sheet__head"><h2>Reply to {replying.guest}</h2><button type="button" className="icon-btn icon-btn--sm" onClick={() => setReplying(null)} aria-label="Close"><CloseIcon /></button></header>
            <div className="sheet__body">
              <p className="muted-note">Each review gets one reply, and everyone can read it. Be kind and specific.</p>
              {err && <div className="alert alert--light" role="alert"><AlertIcon /> {err}</div>}
              <textarea className="textarea" maxLength={500} value={text} onChange={(e) => { setText(e.target.value); setErr(null); }} placeholder="Thank you for staying with us…" aria-label="Your reply" />
              <p className="char-count">{text.length}/500</p>
            </div>
            <footer className="sheet__foot">
              <button type="button" className="abtn abtn--ghost" onClick={() => setReplying(null)}>Cancel</button>
              <button type="button" className="abtn abtn--lime" disabled={busy} onClick={send}>{busy ? 'Posting…' : 'Post reply'}</button>
            </footer>
          </div>
        </div>
      )}
    </SubPage>
  );
}
