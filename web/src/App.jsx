import { useEffect, useState } from 'react';
import { api } from './api.js';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState(null);

  // โหลดข้อมูลครั้งแรกตอนหน้าเปิด
  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth({ ok: false }));
    reload();
  }, []);

  async function reload() {
    try {
      setLoading(true);
      setTodos(await api.list());
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onAdd(e) {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      const created = await api.create(title);
      setTodos((t) => [created, ...t]);   // ใส่ไว้บนสุดทันที
      setTitle('');
    } catch (e) {
      setError(e.message);
    }
  }

  async function onToggle(todo) {
    try {
      const updated = await api.update(todo.id, { done: !todo.done });
      setTodos((t) => t.map((x) => (x.id === todo.id ? updated : x)));
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDelete(id) {
    if (!confirm('ลบรายการนี้?')) return;
    try {
      await api.remove(id);
      setTodos((t) => t.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  const doneCount = todos.filter((t) => t.done).length;

  return (
    <main className="wrap">
      <header className="head">
        <h1><i className="fa-solid fa-list-check" /> Learn Todo</h1>
        <p className="sub">React + Node.js + PostgreSQL บน Render</p>
        <span className={`badge ${health?.ok ? 'ok' : 'bad'}`}>
          <i className={`fa-solid ${health?.ok ? 'fa-circle-check' : 'fa-circle-xmark'}`} />
          {health === null ? ' กำลังเช็ค API…' : health.ok ? ' API เชื่อมต่อแล้ว' : ' API ไม่ตอบ'}
        </span>
      </header>

      <form className="add" onSubmit={onAdd}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="พิมพ์สิ่งที่ต้องทำ แล้วกด Enter"
          maxLength={200}
        />
        <button type="submit" disabled={!title.trim()}>
          <i className="fa-solid fa-plus" /> เพิ่ม
        </button>
      </form>

      {error && <div className="alert"><i className="fa-solid fa-triangle-exclamation" /> {error}</div>}

      <section className="card">
        <div className="card-head">
          <span>รายการ ({todos.length})</span>
          <span className="muted">เสร็จแล้ว {doneCount}</span>
        </div>

        {loading ? (
          <p className="empty">กำลังโหลด…</p>
        ) : todos.length === 0 ? (
          <p className="empty">ยังไม่มีรายการ ลองเพิ่มอันแรกดูสิ</p>
        ) : (
          <ul className="list">
            {todos.map((t) => (
              <li key={t.id} className={t.done ? 'done' : ''}>
                <button className="check" onClick={() => onToggle(t)} aria-label="toggle">
                  <i className={`fa-regular ${t.done ? 'fa-square-check' : 'fa-square'}`} />
                </button>
                <span className="title">{t.title}</span>
                <time className="muted">{new Date(t.created_at).toLocaleString('th-TH')}</time>
                <button className="del" onClick={() => onDelete(t.id)} aria-label="delete">
                  <i className="fa-solid fa-trash" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="foot">
        ข้อมูลทุกรายการถูกเก็บใน PostgreSQL — เปิดแอปมือถือ (Flutter) จะเห็นรายการชุดเดียวกัน
      </footer>
    </main>
  );
}
