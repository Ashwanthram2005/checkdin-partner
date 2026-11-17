import { useState } from 'react';
import { Link } from 'react-router-dom';
import SubPage from '../components/SubPage';
import { AlertIcon, BellIcon, ChevronRightSm, InfoIcon } from '../components/Icons';
import { useActivity, type Priority } from '../lib/activity';
import { fmtDate, fmtTime } from '../lib/format';

type Filter = 'All' | Priority | 'Unread';
const FILTERS: Filter[] = ['All', 'Critical', 'High', 'Normal', 'Unread'];

function ago(d: Date) {
  const m = Math.floor((Date.now() - d.getTime()) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  return `${fmtDate(d)}, ${fmtTime(d)}`;
}

export default function Notifications() {
  const { events, unread, seen, markAllRead, reload, loading, error } = useActivity();
  const [filter, setFilter] = useState<Filter>('All');
  const rows = events.filter((e) => (filter === 'All' ? true : filter === 'Unread' ? e.at.getTime() > seen : e.priority === filter));

  return (
    <SubPage title="Notifications" subtitle="What’s happening at your property" action={unread > 0 ? <button type="button" className="mini-btn" onClick={markAllRead}>Mark all read</button> : undefined}>
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      <nav className="chips" role="tablist" aria-label="Filter">
        {FILTERS.map((f) => <button key={f} type="button" role="tab" aria-selected={filter === f} className={`chip${filter === f ? ' is-active' : ''}`} onClick={() => setFilter(f)}>{f}{f === 'Unread' && <span className="chip__count">{unread}</span>}</button>)}
      </nav>
      {loading && <p className="muted-note">Loading…</p>}
      {!loading && rows.length === 0 && <div className="empty"><BellIcon size={28} /><strong>Nothing here</strong><span>New bookings, check-ins, extension requests and reviews show up here.</span></div>}
      <ul className="cards">
        {rows.map((e) => {
          const isNew = e.at.getTime() > seen;
          return (
            <li key={e.id}>
              <Link to={e.link} className={`note-row note-row--${e.priority.toLowerCase()}${isNew ? ' is-new' : ''}`}>
                <span className="note-row__dot" aria-hidden="true" />
                <span className="note-row__text"><strong>{e.title}</strong><small>{e.detail}</small><em>{ago(e.at)}</em></span>
                {e.priority !== 'Normal' && <span className={`prio prio--${e.priority.toLowerCase()}`}>{e.priority}</span>}
                <ChevronRightSm />
              </Link>
            </li>
          );
        })}
      </ul>
      <p className="note"><InfoIcon /> This list is built from your bookings, extension requests and reviews. Alerts for new requests also pop up while the app is open.</p>
    </SubPage>
  );
}
