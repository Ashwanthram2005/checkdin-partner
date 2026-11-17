import SubPage from '../components/SubPage';
import { AlertIcon, ChevronRightSm, LifebuoyIcon, PhoneIcon } from '../components/Icons';
import { getTickets } from '../api/partner';
import { useApi } from '../api/useApi';
import { SUPPORT_NUMBER } from '../config';
import { fmtDate } from '../lib/format';

const tone = (s: string) => { const t = s.toLowerCase(); return t.includes('resolv') || t.includes('closed') ? 'ok' : t.includes('progress') || t.includes('pending') ? 'wait' : 'open'; };

export default function Support() {
  const { data, error, loading, reload } = useApi(getTickets);
  const list = data ?? [];
  const tel = `tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`;
  return (
    <SubPage title="Support" subtitle="Help with bookings, payments and payouts">
      <a className="support" href={tel}>
        <span className="support__icon"><PhoneIcon /></span>
        <span className="support__text"><strong>Call partner support</strong><small>{SUPPORT_NUMBER} · available 24 × 7</small></span>
        <ChevronRightSm />
      </a>
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      <section className="panel" aria-label="Tickets">
        <div className="panel__head"><div><h2>Your tickets</h2><p>Requests you have raised with Checkdin</p></div></div>
        {loading && !data && <p className="muted-note">Loading…</p>}
        {data && list.length === 0 && <div className="empty empty--flat"><LifebuoyIcon size={26} /><strong>No tickets</strong><span>If something is wrong, call us on {SUPPORT_NUMBER} and we’ll sort it out.</span></div>}
        <ul className="tickets">
          {list.map((t) => (
            <li key={t.id}>
              <div className="tickets__top"><strong>{t.subject}</strong><span className={`kyc kyc--${tone(t.status) === 'ok' ? 'ok' : tone(t.status) === 'wait' ? 'wait' : 'none'}`}>{t.status || 'Open'}</span></div>
              <small>#{t.reference}{t.category ? ` · ${t.category}` : ''}{t.priority ? ` · ${t.priority} priority` : ''}</small>
              <small>{t.updatedAt ? `Updated ${fmtDate(t.updatedAt)}` : t.createdAt ? `Raised ${fmtDate(t.createdAt)}` : ''}</small>
            </li>
          ))}
        </ul>
      </section>
    </SubPage>
  );
}
