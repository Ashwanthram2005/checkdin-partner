import { Link } from 'react-router-dom';
import Brand from '../components/Brand';

export default function Placeholder({ title }: { title: string }) {
  return (
    <main className="page placeholder">
      <Brand />
      <h1>{title}</h1>
      <p>This screen is coming next.</p>
      <Link to="/" className="btn btn--lime">Back</Link>
    </main>
  );
}
