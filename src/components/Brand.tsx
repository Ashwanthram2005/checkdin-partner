import { LogoIcon } from './Icons';

export default function Brand() {
  return (
    <div className="brand">
      <LogoIcon />
      <span className="brand__name">Checkdin</span>
      <span className="brand__badge">PARTNER</span>
    </div>
  );
}
