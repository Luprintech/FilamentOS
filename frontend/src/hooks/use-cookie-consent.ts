import { useState } from 'react';

const STORAGE_KEY = 'luprintech_cookie_consent';

export function useCookieConsent() {
  const [accepted, setAccepted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch { /* storage no disponible */ }
    setAccepted(true);
  };

  return { accepted, accept };
}
