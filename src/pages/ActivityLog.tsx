import { useMemo, useState } from 'react';
import SubPage from '../components/SubPage';
import { AlertIcon, InfoIcon, ListIcon } from '../components/Icons';
import { getAuditLog } from '../api/partner';
import { useApi } from '../api/useApi';
import { fmtDate, fmtTime } from '../lib/format';

export default function ActivityLog() {
  const { data, error, loading, reload } = useApi(getAuditLog);
  const [cat, setCat] = useState('All');
  const all = data ?? [];
  const cats = useMemo(() => ['All', ...new Set(all.map((e) => e.category).filter(Boolean))], [all]);
  const rows = all.filter((e) => cat === 'All' || e.category === cat);

  return (
    <SubPage title="Activity log" subtitle="Who did what at your property">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      {cats.length > 2 && (
        <nav className="chips" role="tablist" aria-label="Category">
          {cats.map((c) => <button key={c} type="button" role="tab" aria-selected={cat === c} className={`chip${cat === c ? ' is-active' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
        </nav>
      )}
      {loading && !data && <p className="muted-note">Loading…</p>}
      {data && rows.length === 0 && <div className="empty"><ListIcon size={28} /><strong>Nothing logged yet</strong><span>Changes to pricing, availability, team and settings will be recorded here.</span></div>}
      <ul className="auditlist">
        {rows.map((e) => (
          <li key={e.id}>
            <span className="audit__dot" aria-hidden="true" />
            <span className="audit__main">
              <strong>{e.action}</strong>
              {e.target && <small>{e.target}</small>}
              <small>{e.actor}{e.role ? ` · ${e.role}` : ''}</small>
              <em>{e.at ? `${fmtDate(e.at)}, ${fmtTime(e.at)}` : ''}</em>
            </span>
            {e.category && <span className="perm">{e.category}</span>}
          </li>
        ))}
      </ul>
      <p className="note"><InfoIcon /><span>Entries are added automatically and can’t be edited or deleted.</span></p>
    </SubPage>
  );
}
