/** Checkdin backend (the same server the partner portal uses). */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'https://checkdin-backend-vxht.onrender.com';

export const SUPPORT_NUMBER = '1800 313 2200';
