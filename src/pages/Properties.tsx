import { useNavigate } from 'react-router-dom';
import SubPage from '../components/SubPage';
import { AlertIcon, ChevronRightSm, InfoIcon, StoreIcon } from '../components/Icons';
import { getProperties } from '../api/partner';
import { useApi } from '../api/useApi';
import { useAuth } from '../auth/AuthContext';

export default function Properties() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const { data, error, loading, reload } = useApi(getProperties);
  const list = data ?? [];

  // Most of the app is scoped to the property you signed in with, so switching = signing in to that property.
  function switchTo(id: string) {
    if (!window.confirm(`Sign out and sign in to ${id}?`)) return;
    signOut();
    setTimeout(() => navigate('/login', { replace: true, state: { hotelId: id } }), 0);
  }

  return (
    <SubPage title="Properties" subtitle="Every property on your account">
      {error && <div className="alert" role="alert"><AlertIcon /> {error} <button type="button" className="link-btn" onClick={reload}>Retry</button></div>}
      {loading && !data && <p className="muted-note">Loading…</p>}
      <ul className="proplist">
        {list.map((p) => {
          const current = p.id === session?.hotelId;
          return (
            <li key={p.id}>
              <button type="button" className={`prop${current ? ' is-current' : ''}`} disabled={current} onClick={() => switchTo(p.id)}>
                <span className="row__icon"><StoreIcon /></span>
                <span className="prop__main"><strong>{p.name}</strong><small>{p.city ? `${p.city} · ` : ''}{p.id}</small></span>
                <span className={`kyc kyc--${p.status === 'Active' ? 'ok' : 'wait'}`}>{p.status}</span>
                {!current && <ChevronRightSm />}
              </button>
              {current && <small className="prop__cur">You’re managing this property</small>}
            </li>
          );
        })}
      </ul>
      {list.length === 1 && <p className="note"><InfoIcon /><span>You have one property. If you add more, they’ll appear here and you can switch between them.</span></p>}
      {list.length > 1 && <p className="note"><InfoIcon /><span>Switching signs you out and takes you to sign in to the other property’s account.</span></p>}
    </SubPage>
  );
}
