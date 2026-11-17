import SubPage from '../components/SubPage';
import { AlertIcon, InfoIcon, PhoneIcon, ShieldIcon } from '../components/Icons';
import { getRoles, getStaff } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';
import { SUPPORT_NUMBER } from '../config';
import { fmtDate, fmtTime, initials } from '../lib/format';

const PERM: Record<string, string> = { all: 'Everything', bookings: 'Bookings', rooms: 'Rooms & pricing', staff: 'Team', reports: 'Reports', checkin: 'Check-in', checkout: 'Check-out', maintenance: 'Maintenance', finance: 'Payouts & finance' };

export default function Team() {
  const { session, role } = useAuth();
  const id = session?.hotelId ?? '';
  const staff = useApi(() => getStaff(id), [id]);
  const roles = useApi(getRoles);
  const list = staff.data ?? [];

  return (
    <SubPage title="Team" subtitle="People who can sign in to this property">
      {staff.error && <div className="alert" role="alert"><AlertIcon /> {staff.error} <button type="button" className="link-btn" onClick={staff.reload}>Retry</button></div>}
      {staff.loading && !staff.data && <p className="muted-note">Loading…</p>}

      <section className="panel" aria-label="Staff">
        <div className="panel__head"><div><h2>Staff</h2><p>{list.length} {list.length === 1 ? 'person' : 'people'}</p></div></div>
        <ul className="teamlist">
          {list.map((m) => (
            <li key={m.id}>
              <span className="avatar">{initials(m.name)}</span>
              <span className="teamlist__main">
                <strong>{m.name}{m.id === session?.userId && <em className="you">You</em>}</strong>
                <small>{m.roleName || m.roleId}{!m.active ? ' · Inactive' : ''}</small>
                <small>{m.lastLogin ? `Last sign-in ${fmtDate(m.lastLogin)}, ${fmtTime(m.lastLogin)}` : 'Has not signed in yet'}</small>
              </span>
              {m.phone && <a className="icon-btn icon-btn--sm" href={`tel:${m.phone}`} aria-label={`Call ${m.name}`}><PhoneIcon size={18} /></a>}
            </li>
          ))}
        </ul>
        <p className="note"><InfoIcon /><span>To add, remove or change a team member, call Checkdin partner support on <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>.</span></p>
      </section>

      <section className="panel" aria-label="Roles">
        <div className="panel__head"><div><h2>What each role can do</h2><p>{role ? `You are signed in as ${role.name}` : ''}</p></div></div>
        {roles.error && <div className="alert" role="alert"><AlertIcon /> {roles.error}</div>}
        <ul className="roles">
          {(roles.data ?? []).map((r) => (
            <li key={r.id} className={r.id === role?.id ? 'is-me' : ''}>
              <div className="roles__top"><strong>{r.name}</strong><span className={`prio prio--${r.level === 'High' ? 'critical' : r.level === 'Medium' ? 'high' : ''}`}>{r.level}</span></div>
              <small>{r.description}</small>
              <div className="roles__perms">{r.permissions.map((p) => <span key={p} className="perm"><ShieldIcon size={12} /> {PERM[p] ?? p}</span>)}</div>
            </li>
          ))}
        </ul>
      </section>
    </SubPage>
  );
}
