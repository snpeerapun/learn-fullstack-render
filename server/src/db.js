// db.js — จุดเดียวที่คุยกับ PostgreSQL
// ใช้ "Pool" (กลุ่ม connection ที่ reuse ได้) แทนการเปิด connection ใหม่ทุก request
import pg from 'pg';

const { Pool } = pg;

// DATABASE_URL มาจาก environment variable
//   - บน Render: Render ใส่ให้เองจากหน้า Environment (เราผูกกับ Postgres ที่สร้างไว้)
//   - บนเครื่องเรา: ใส่ในไฟล์ server/.env เช่น postgres://user:pass@localhost:5432/learn_todo
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('ยังไม่ได้ตั้งค่า DATABASE_URL');
  process.exit(1);
}

export const pool = new Pool({
  connectionString,
  // Postgres บน Render บังคับใช้ SSL เมื่อต่อจากภายนอก
  // ถ้าต่อ localhost ไม่ต้องใช้ SSL
  ssl: connectionString.includes('localhost') || connectionString.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

// สร้างตารางถ้ายังไม่มี (รันทุกครั้งที่เซิร์ฟเวอร์เริ่ม ปลอดภัยเพราะใช้ IF NOT EXISTS)
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      done        BOOLEAN NOT NULL DEFAULT false,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}
