// platform.js — abstração de APIs web-only para facilitar migração futura (Capacitor/React Native)

/** Abre URL externa em nova aba */
export const openExternalURL = (url) => window.open(url, '_blank', 'noopener,noreferrer');

/** Lê query param da URL atual */
export const getQueryParam = (key) => new URLSearchParams(window.location.search).get(key);

/** Faz download de um Blob como arquivo */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
};

/** Storage local com fallback seguro */
export const storage = {
  get: (key) => { try { return localStorage.getItem(key); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch { /* noop */ } },
  remove: (key) => { try { localStorage.removeItem(key); } catch { /* noop */ } },
};