export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('sf_token');
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || 'Something went wrong. Try again.');
    err.status = res.status;
    err.fields = data.fields || {};
    throw err;
  }
  return data;
}

export const money = (n) =>
  n == null ? '—' : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
