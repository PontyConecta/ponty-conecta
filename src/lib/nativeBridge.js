/**
 * Safely post a message to an iOS WKWebView native bridge handler.
 * Silently no-ops when the bridge is unavailable (desktop, Android, etc.).
 */
export function postToNative(handler, payload) {
  try {
    const h = window?.webkit?.messageHandlers?.[handler];
    if (h?.postMessage) h.postMessage(payload);
  } catch (_e) {
    // silent — bridge not available in this runtime
  }
}