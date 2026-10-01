import { CurrencyType, UserAccount } from '../types';

export interface GeoDetectionResult {
  inPakistan: boolean;
  currency: CurrencyType;
  country: string;
  source: 'saved_preference' | 'browser_locale' | 'browser_timezone' | 'geolocation_api' | 'ip_service' | 'default';
}

/**
 * Checks if browser locale or system timezone indicates Pakistan
 */
export function checkBrowserLocaleAndZone(): { inPakistan: boolean; source: 'browser_locale' | 'browser_timezone' | 'default' } {
  if (typeof window === 'undefined') {
    return { inPakistan: false, source: 'default' };
  }

  try {
    // 1. Check system timezone (Asia/Karachi is the official timezone of Pakistan)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Karachi' || /karachi|pakistan/i.test(tz)) {
      return { inPakistan: true, source: 'browser_timezone' };
    }

    // 2. Check browser languages / locale
    const navLangs = navigator.languages ? [...navigator.languages] : [];
    if (navigator.language) navLangs.push(navigator.language);

    const isPkLocale = navLangs.some((lang) => {
      if (!lang) return false;
      const normalized = lang.trim().toLowerCase();
      return (
        normalized.endsWith('-pk') ||
        normalized.endsWith('_pk') ||
        normalized === 'ur' ||
        normalized.startsWith('ur-') ||
        normalized.startsWith('pa-pk') ||
        normalized.startsWith('sd-pk')
      );
    });

    if (isPkLocale) {
      return { inPakistan: true, source: 'browser_locale' };
    }
  } catch (e) {
    // ignore
  }

  return { inPakistan: false, source: 'default' };
}

/**
 * Checks browser W3C Geolocation API coordinates if permission is granted
 * Pakistan bounding box: Latitude ~23.69 to 37.08, Longitude ~60.87 to 77.83
 */
export async function checkBrowserCoords(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return false;
  }

  return new Promise((resolve) => {
    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const isPakistan = lat >= 23.5 && lat <= 37.2 && lon >= 60.5 && lon <= 78.0;
          resolve(isPakistan);
        },
        () => resolve(false),
        { timeout: 3000, maximumAge: 600000 }
      );
    } catch {
      resolve(false);
    }
  });
}

/**
 * Asynchronously detects user location via backend /api/geo/detect or public IP services
 */
export async function detectLocationFromApi(): Promise<{ inPakistan: boolean; country: string; source: 'geolocation_api' | 'ip_service' | 'default' }> {
  // 1. Try local server endpoint first
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('/api/geo/detect', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (typeof data.inPakistan === 'boolean') {
        return {
          inPakistan: data.inPakistan,
          country: data.country || (data.inPakistan ? 'Pakistan' : 'Global'),
          source: 'geolocation_api'
        };
      }
    }
  } catch (e) {
    // continue to public fallback
  }

  // 2. Try fast public IP geolocation fallback
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const isPk = data.country_code === 'PK' || data.country === 'PK' || /pakistan/i.test(data.country_name || '');
      return {
        inPakistan: isPk,
        country: isPk ? 'Pakistan' : (data.country_name || 'Global'),
        source: 'ip_service'
      };
    }
  } catch (e) {
    // continue
  }

  return { inPakistan: false, country: 'Global', source: 'default' };
}

/**
 * Synchronous initial detection for instant first render without flash
 */
export function getInitialCurrencyAndCountry(): GeoDetectionResult {
  if (typeof window !== 'undefined') {
    // Check if user has an explicitly saved preference
    const savedCurrency = localStorage.getItem('emerald_trust_currency') as CurrencyType;
    if (savedCurrency === 'PKR' || savedCurrency === 'USD') {
      return {
        inPakistan: savedCurrency === 'PKR',
        currency: savedCurrency,
        country: savedCurrency === 'PKR' ? 'Pakistan' : 'Global',
        source: 'saved_preference'
      };
    }

    const savedUser = localStorage.getItem('emerald_trust_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed?.currency === 'PKR' || parsed?.currency === 'USD') {
          return {
            inPakistan: parsed.currency === 'PKR',
            currency: parsed.currency,
            country: parsed.country || (parsed.currency === 'PKR' ? 'Pakistan' : 'Global'),
            source: 'saved_preference'
          };
        }
      } catch (e) {}
    }
  }

  // Fast synchronous browser locale & timezone evaluation
  const localCheck = checkBrowserLocaleAndZone();
  if (localCheck.inPakistan) {
    return {
      inPakistan: true,
      currency: 'PKR',
      country: 'Pakistan',
      source: localCheck.source
    };
  }

  return {
    inPakistan: false,
    currency: 'USD',
    country: 'Global',
    source: 'default'
  };
}
