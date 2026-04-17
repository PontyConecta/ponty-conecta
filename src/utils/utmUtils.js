const THIRTY_DAYS_MS = 2592000000;
const STORAGE_KEY = 'ponty_utm';

export function getPersistedUtms() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.captured_at > THIRTY_DAYS_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const { captured_at, ...utms } = parsed;
    return Object.keys(utms).length > 0 ? utms : null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function getUtmLoginUrl(baseUrl) {
  const utms = getPersistedUtms();
  if (!utms) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  return baseUrl + separator + new URLSearchParams(utms).toString();
}