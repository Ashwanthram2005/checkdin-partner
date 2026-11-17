import BottomNav from '../components/BottomNav';
import ExtensionRequests from '../components/ExtensionRequests';
import '../styles/bookings.css';
import '../styles/home.css';

export default function ExtensionsPage() {
  return (
    <div className="app">
      <main className="bk home">
        <header className="bk__bar"><div><h1>Extensions</h1><p>Stay-longer requests and what you decided</p></div></header>
        <ExtensionRequests showHistory />
      </main>
      <BottomNav />
    </div>
  );
}
