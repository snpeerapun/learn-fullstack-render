// api.js — รวมทุกการเรียก backend ไว้ที่เดียว (หน้า UI ไม่ต้องรู้ URL)
//
// VITE_API_URL:
//   - dev ในเครื่อง: ปล่อยว่าง → เรียก /api แล้ว vite proxy ส่งต่อไป localhost:3000
//   - บน Render (Static Site): ตั้งเป็น URL ของ Web Service เช่น https://learn-todo-api.onrender.com
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export const api = {
  health: () => request('/api/health'),
  list: () => request('/api/todos'),
  create: (title) => request('/api/todos', { method: 'POST', body: JSON.stringify({ title }) }),
  update: (id, patch) => request(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  remove: (id) => request(`/api/todos/${id}`, { method: 'DELETE' }),
};
