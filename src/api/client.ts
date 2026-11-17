import { API_URL } from '../config';
import { NET_FAIL, NET_OK } from '../lib/network';

const KEY = 'checkdin.partner.session';

export interface StoredSession {
  token: string;
  userId: string;
  name: string;
  roleId: string;
  hotelId: string;
  email?: string;
}

export function getSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}
export function setSession(s: StoredSession) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage may be blocked */ }
}
export function clearSession() {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const UNAUTHORIZED_EVENT = 'checkdin:unauthorized';

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** false for the login calls, which have no token yet */
  auth?: boolean;
  /** the hosted server can take a while to wake up, so the default is generous */
  timeoutMs?: number;
}

export async function api<T>(path: string, { method = 'GET', body, auth = true, timeoutMs = 70000 }: Options = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = auth ? getSession()?.token : undefined;
  if (token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal: ctrl.signal });
  } catch (e) {
    window.dispatchEvent(new Event(NET_FAIL));
    throw new ApiError(
      (e as Error).name === 'AbortError' ? 'The server took too long to answer. Please try again.' : 'Could not reach the server. Check your internet connection.',
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  window.dispatchEvent(new Event(NET_OK)); // the server answered
  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty body */ }

  if (!res.ok) {
    const d = data as { message?: string; error?: string } | null;
    if (res.status === 401 && auth) {
      clearSession();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(d?.message || d?.error || `Something went wrong (HTTP ${res.status}).`, res.status);
  }
  return data as T;
}

/** The server sometimes wraps lists as { data: [...] }. */
export function unwrap<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[];
  const d = (v as { data?: unknown } | null)?.data;
  return Array.isArray(d) ? (d as T[]) : [];
}
