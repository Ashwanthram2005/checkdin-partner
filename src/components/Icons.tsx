type P = { size?: number };

export const LogoIcon = ({ size = 44 }: P) => (
  <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
    <circle cx="22" cy="22" r="22" fill="var(--lime)" />
    <circle cx="22" cy="22" r="11" stroke="#111" strokeWidth="2.6" />
    <path d="M22 7.5v3.5M22 33v3.5M7.5 22H11M33 22h3.5" stroke="#111" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M17.5 22.2l3.2 3.2 6-6.4" stroke="#111" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const LoginIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    <path d="M3 12h11M10 8l4 4-4 4" />
  </svg>
);

export const BuildingIcon = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M9 7h1.5M13.5 7H15M9 10.5h1.5M13.5 10.5H15M9 14h1.5M13.5 14H15M10.5 21v-3h3v3" strokeLinecap="round" />
  </svg>
);

export const ArrowRight = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const ChevronRight = ({ size = 28 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const ArrowLeft = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </svg>
);

export const MailIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M3.5 7.5l8.5 6 8.5-6" />
  </svg>
);

export const LockIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="4.5" y="10.5" width="15" height="10" rx="3" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </svg>
);

export const EyeIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.1A10.7 10.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.5 6.6C3.6 8.5 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.4 4.5-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
);

export const AlertIcon = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.4v.1" />
  </svg>
);

export const ShieldIcon = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <path d="M12 3l7 3v5.5c0 4.4-3 8-7 9.5-4-1.5-7-5.1-7-9.5V6l7-3z" />
    <path d="M9 12l2.2 2.2L15.5 10" />
  </svg>
);

export const HotelIdIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <path d="M9.5 9L8 15M14 9l-1.5 6M7 11h9M6.5 13.5h9" />
  </svg>
);

export const PhoneIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
    <path d="M11 18.5h2" />
  </svg>
);

export const UserIcon = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...stroke} aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" />
  </svg>
);

const svgProps = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', ...stroke, 'aria-hidden': true as const });

export const CalendarIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>
);
export const ClockIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
);
export const CheckInIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><path d="M14 4h4a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20h-4M3.5 12H14M10.5 8L14.5 12l-4 4" /></svg>
);
export const CheckOutIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><path d="M10 4H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h4M20.5 12H10M16.5 8l4 4-4 4" /></svg>
);
export const UsersIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><circle cx="9" cy="8.5" r="3.5" /><path d="M2.5 20c.6-3.4 3.2-5 6.5-5s5.900 1.600 6.500 5M16 5.200a3.500 3.500 0 0 1 0 6.600M18 15.300c1.900.7 3.100 2.300 3.500 4.700" /></svg>
);
export const XCircleIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><circle cx="12" cy="12" r="8.5" /><path d="M9 9l6 6M15 9l-6 6" /></svg>
);
export const DownloadIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><path d="M12 4v11M7.500 10.500L12 15l4.500-4.500M4.500 19.500h15" /></svg>
);
export const SearchIcon = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><circle cx="11" cy="11" r="6.500" /><path d="M16 16l4 4" /></svg>
);
export const ChevronDown = ({ size = 18 }: P) => (
  <svg {...svgProps(size)}><path d="M6 9.500l6 6 6-6" /></svg>
);

export const FilterIcon = ({ size = 20 }: P) => (
  <svg {...svgProps(size)}><path d="M4 6.500h16M7 12h10M10 17.500h4" /></svg>
);
export const CloseIcon = ({ size = 20 }: P) => (
  <svg {...svgProps(size)}><path d="M6 6l12 12M18 6L6 18" /></svg>
);
export const HomeIcon = ({ size = 22 }: P) => (
  <svg {...svgProps(size)}><path d="M4 11l8-6.500 8 6.500v8a1.500 1.500 0 0 1-1.500 1.500h-3.500v-6h-6v6H5.500A1.500 1.500 0 0 1 4 19v-8z" /></svg>
);
export const BookingsIcon = ({ size = 22 }: P) => (
  <svg {...svgProps(size)}><rect x="4.500" y="3.500" width="15" height="17" rx="2.500" /><path d="M8.500 9h7M8.500 13h7M8.500 17h4" /></svg>
);
export const TagIcon = ({ size = 22 }: P) => (
  <svg {...svgProps(size)}><path d="M3.500 12.500V5a1.500 1.500 0 0 1 1.500-1.500h7.500l8 8-9 9-8-8z" /><circle cx="8.500" cy="8.500" r="1.200" /></svg>
);
export const ChartIcon = ({ size = 22 }: P) => (
  <svg {...svgProps(size)}><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></svg>
);
export const MoreIcon = ({ size = 22 }: P) => (
  <svg {...svgProps(size)}><circle cx="5.500" cy="12" r="1.300" /><circle cx="12" cy="12" r="1.300" /><circle cx="18.500" cy="12" r="1.300" /></svg>
);

export const PlusIcon = ({ size = 20 }: P) => (
  <svg {...svgProps(size)}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = ({ size = 20 }: P) => (
  <svg {...svgProps(size)}><path d="M5 12h14" /></svg>
);
export const CheckCircleIcon = ({ size = 20 }: P) => (
  <svg {...svgProps(size)}><circle cx="12" cy="12" r="8.500" /><path d="M8.500 12.200l2.400 2.400 4.600-4.800" /></svg>
);
export const InfoIcon = ({ size = 16 }: P) => (
  <svg {...svgProps(size)}><circle cx="12" cy="12" r="8.500" /><path d="M12 11v5M12 7.800v.1" /></svg>
);
