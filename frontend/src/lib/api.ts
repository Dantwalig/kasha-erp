const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getTokens() {
  if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
  return {
    accessToken: localStorage.getItem('kasha_access_token'),
    refreshToken: localStorage.getItem('kasha_refresh_token'),
  };
}

export function setTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem('kasha_access_token', accessToken);
  localStorage.setItem('kasha_refresh_token', refreshToken);
}

export function clearTokens() {
  localStorage.removeItem('kasha_access_token');
  localStorage.removeItem('kasha_refresh_token');
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function tryRefresh(): Promise<string | null> {
  const { refreshToken } = getTokens();
  if (!refreshToken) return null;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function apiFetch(path: string, options: RequestOptions = {}) {
  const { accessToken } = getTokens();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, { ...options, headers });

  // Access token expired -> try a silent refresh, then retry once.
  if (res.status === 401 && !options.skipAuth) {
    const newAccessToken = await tryRefresh();
    if (newAccessToken) {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...headers, Authorization: `Bearer ${newAccessToken}` },
      });
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

export const api = {
  get: (path: string) => apiFetch(path, { method: 'GET' }),
  post: (path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (path: string, body?: unknown) =>
    apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: 'DELETE' }),
};
