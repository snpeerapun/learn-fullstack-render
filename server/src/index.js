// index.js — จุดเริ่มต้นของ API server
// โครงสร้าง: express (รับ HTTP) → route → คิวรี PostgreSQL → ตอบ JSON
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { pool, initSchema } from './db.js';

const app = express();
app.use(cors());            // อนุญาตให้เว็บ (คนละโดเมน) เรียก API นี้ได้
app.use(express.json());    // อ่าน body ที่เป็น JSON

// ---------- helper ----------
// ห่อ async handler ให้ error ถูกส่งไป error middleware แทนที่จะค้าง
const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

// ---------- routes ----------

// เช็คว่าเซิร์ฟเวอร์ + ฐานข้อมูลยังอยู่ดี
app.get('/api/health', wrap(async (_req, res) => {
  const { rows } = await pool.query('SELECT now() AS now');
  res.json({ ok: true, service: 'learn-todo-server', dbTime: rows[0].now });
}));

// อ่านรายการทั้งหมด (ใหม่สุดอยู่บน)
app.get('/api/todos', wrap(async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, title, done, created_at FROM todos ORDER BY id DESC'
  );
  res.json(rows);
}));

// เพิ่มรายการใหม่  body: { "title": "ซื้อนม" }
app.post('/api/todos', wrap(async (req, res) => {
  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
  if (!title) return res.status(400).json({ error: 'กรุณาระบุ title' });
  if (title.length > 200) return res.status(400).json({ error: 'title ยาวเกิน 200 ตัวอักษร' });

  // $1 คือ parameter — ป้องกัน SQL injection (ห้ามต่อ string เอง)
  const { rows } = await pool.query(
    'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, done, created_at',
    [title]
  );
  res.status(201).json(rows[0]);
}));

// แก้ไข (ติ๊กเสร็จ / เปลี่ยนชื่อ)  body: { "done": true } หรือ { "title": "..." }
app.patch('/api/todos/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id ไม่ถูกต้อง' });

  const fields = [];
  const values = [];
  if (typeof req.body?.done === 'boolean') {
    values.push(req.body.done);
    fields.push(`done = $${values.length}`);
  }
  if (typeof req.body?.title === 'string' && req.body.title.trim()) {
    values.push(req.body.title.trim());
    fields.push(`title = $${values.length}`);
  }
  if (fields.length === 0) return res.status(400).json({ error: 'ไม่มีข้อมูลให้แก้ไข' });

  values.push(id);
  const { rows } = await pool.query(
    `UPDATE todos SET ${fields.join(', ')} WHERE id = $${values.length}
     RETURNING id, title, done, created_at`,
    values
  );
  if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.json(rows[0]);
}));

// ลบ
app.delete('/api/todos/:id', wrap(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'id ไม่ถูกต้อง' });
  const { rowCount } = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'ไม่พบรายการ' });
  res.status(204).end();
}));

// หน้าแรกของ API (เปิดใน browser จะเห็นว่าเซิร์ฟเวอร์รันอยู่)
app.get('/', (_req, res) => {
  res.json({
    name: 'learn-todo-server',
    docs: 'ดู README.md ในโฟลเดอร์โปรเจกต์',
    endpoints: ['GET /api/health', 'GET /api/todos', 'POST /api/todos', 'PATCH /api/todos/:id', 'DELETE /api/todos/:id'],
  });
});

// ---------- error middleware (ต้องอยู่ท้ายสุด) ----------
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์' });
});

// ---------- start ----------
// Render จะกำหนด PORT มาให้เอง — ห้าม hardcode
const PORT = process.env.PORT || 3000;
initSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`API พร้อมที่ http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('ต่อฐานข้อมูลไม่ได้:', err.message);
    process.exit(1);
  });
