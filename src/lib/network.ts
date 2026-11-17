import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { API_URL } from '../config';

export const NET_FAIL = 'checkdin:net-fail';
export const NET_OK = 'checkdin:net-ok';

export interface NetState { deviceOffline: boolean; serverDown: boolean }

/**
 * Is the phone online, and is Checkdin answering?
 * - the phone's own connection status (browser events + the Android network plugin)
 * - two failed requests in a row while the phone says it is online = the server is not answering
 */
export function useNetwork(): NetState & { check: () => Promise<boolean> } {
  const [deviceOffline, setDeviceOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [fails, setFails] = useState(0);

  useEffect(() => {
    const on = () => setDeviceOffline(false);
    const off = () => setDeviceOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    const fail = () => setFails((n) => n + 1);
    const ok = () => setFails(0);
    window.addEventListener(NET_FAIL, fail);
    window.addEventListener(NET_OK, ok);

    let remove: (() => void) | undefined;
    if (Capacitor.isNativePlatform()) {
      (async () => {
        try {
          const { Network } = await import('@capacitor/network');
          const s = await Network.getStatus();
          setDeviceOffline(!s.connected);
          const h = await Network.addListener('networkStatusChange', (st) => setDeviceOffline(!st.connected));
          remove = () => void h.remove();
        } catch { /* fall back to the browser events */ }
      })();
    }
    return () => {
      window.removeEventListener('online', on); window.removeEventListener('offline', off);
      window.removeEventListener(NET_FAIL, fail); window.removeEventListener(NET_OK, ok);
      remove?.();
    };
  }, []);

  /** Any answer from the server (even an error page) means we are connected. */
  async function check(): Promise<boolean> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    try {
      await fetch(`${API_URL}/`, { method: 'GET', signal: ctrl.signal, cache: 'no-store' });
      window.dispatchEvent(new Event(NET_OK));
      setDeviceOffline(false);
      return true;
    } catch { return false; }
    finally { clearTimeout(t); }
  }

  return { deviceOffline, serverDown: !deviceOffline && fails >= 2, check };
}
