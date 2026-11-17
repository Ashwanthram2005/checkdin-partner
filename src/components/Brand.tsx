import mark from '../assets/logo-mark.png';
import wordmark from '../assets/logo-wordmark.png';

/** The Checkdin logo (clock-check mark + wordmark) with the PARTNER badge. */
export default function Brand() {
  return (
    <div className="brand" role="img" aria-label="Checkdin Partner">
      <img className="brand__mark" src={mark} alt="" width={44} height={43} decoding="async" />
      <img className="brand__word" src={wordmark} alt="" height={26} decoding="async" />
      <span className="brand__badge" aria-hidden="true">PARTNER</span>
    </div>
  );
}
