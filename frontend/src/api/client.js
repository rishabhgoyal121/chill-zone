const BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');
const SESSION_EXPIRED_MESSAGE = 'Session expired. Please log in again.';

export async function api(path, options = {}) {
  const token = localStorage.getItem('token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json();
  if (!res.ok) {
    const rawError = data.error || 'Request failed';
    if (/invalid auth token/i.test(rawError) || /missing auth token/i.test(rawError)) {
      throw new Error(SESSION_EXPIRED_MESSAGE);
    }
    throw new Error(rawError);
  }

  return data;
}
