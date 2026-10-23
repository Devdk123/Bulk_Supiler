const AUTH_REQUEST_TIMEOUT_MS = 8_000;

export function createSupabaseAuthTimeoutFetch(
  fetchImplementation: typeof fetch,
  timeoutMs = AUTH_REQUEST_TIMEOUT_MS
): typeof fetch {
  return (input, init) => {
    const requestUrl = typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

    let isAuthRequest = false;
    try {
      isAuthRequest = new URL(requestUrl).pathname.startsWith("/auth/v1/");
    } catch {
      // Leave malformed and non-absolute URLs to the supplied fetch implementation.
    }

    if (!isAuthRequest) return fetchImplementation(input, init);

    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const requestSignal = init?.signal ?? (input instanceof Request ? input.signal : null);
    const signal = requestSignal ? AbortSignal.any([requestSignal, timeoutSignal]) : timeoutSignal;
    return fetchImplementation(input, { ...init, signal });
  };
}
