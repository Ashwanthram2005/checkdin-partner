import { Link } from 'react-router-dom';
import Brand from '../components/Brand';
import { ArrowRight, BuildingIcon, ChevronRight, LoginIcon } from '../components/Icons';

const SUPPORT_NUMBER = '1800 313 2200';

export default function Welcome() {
  return (
    <main className="page welcome">
      <Brand />

      <header className="welcome__intro">
        <h1>Manage Your Property with Checkdin</h1>
        <p>Access your property dashboard or join Checkdin to start receiving short-stay bookings.</p>
      </header>

      <section className="card card--dark" aria-labelledby="existing-partner">
        <div className="card__icon"><LoginIcon /></div>
        <h2 id="existing-partner">Already a Checkdin Partner?</h2>
        <p>Access your property dashboard, manage bookings, pricing, availability, revenue and payouts.</p>
        <Link to="/login" className="btn btn--lime">
          Login to Dashboard <ArrowRight />
        </Link>
      </section>

      <a href="https://checkdin-onboard.web.app" target="_blank" rel="noreferrer" className="card card--outline" aria-labelledby="new-partner">
        <div className="card__body">
          <div className="card__icon"><BuildingIcon /></div>
          <h2 id="new-partner">Not Listed on Checkdin?</h2>
          <p>Join Checkdin and start receiving short-stay bookings from travellers looking for 3, 6 and 12-hour stays.</p>
        </div>
        <span className="card__chevron"><ChevronRight /></span>
      </a>

      <footer className="welcome__help">
        Need help? Call partner support on{' '}
        <a href={`tel:${SUPPORT_NUMBER.replace(/\s/g, '')}`}>{SUPPORT_NUMBER}</a>,
        available 24&nbsp;×&nbsp;7.
      </footer>
    </main>
  );
}
