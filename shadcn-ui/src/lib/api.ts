const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed: ${res.status}`);
  }
  return data as T;
}

export async function signup(name: string, email: string, password: string) {
  return request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
    '/auth/signup',
    { method: 'POST', body: JSON.stringify({ name, email, password }) }
  );
}

export async function startLogin(email: string, password: string) {
  return request<{ challengeId: string }>('/auth/login/start', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function verifyLogin(challengeId: string, code: string) {
  return request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
    '/auth/login/verify',
    { method: 'POST', body: JSON.stringify({ challengeId, code }) }
  );
}

export async function passwordResetStart(email: string) {
  return request<{ challengeId: string }>('/auth/password/reset/start', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function passwordResetVerify(challengeId: string, code: string, newPassword: string) {
  return request<{ ok: boolean }>('/auth/password/reset/verify', {
    method: 'POST',
    body: JSON.stringify({ challengeId, code, newPassword }),
  });
}
export async function adminLogin(email: string, password: string) {
  return request<{ token: string; user: { id: string; name: string; email: string; role: string } }>(
    '/auth/admin/login',
    { method: 'POST', body: JSON.stringify({ email, password }) }
  );
}

export async function me(token: string) {
  return request<{ user: { id: string; name: string; email: string; role: string } }>('/auth/me', { method: 'GET' }, token);
}