# Learn Fullstack — PostgreSQL + Node.js + React + Flutter บน Render

โปรเจกต์ตัวอย่างสำหรับสอน "เขียนแอปที่ใช้งานได้จริง" ครบทั้ง 4 ชั้น

**ลองของจริงได้เลย (deploy บน Render แล้ว)**
- เว็บ: https://learn-todo-web.onrender.com
- API: https://learn-todo-api.onrender.com/api/health
- Repo: https://github.com/snpeerapun/learn-fullstack-render

แอปคือ **Todo list** ง่าย ๆ (เพิ่ม / ติ๊กเสร็จ / ลบ) — เว็บและมือถือใช้ฐานข้อมูลเดียวกัน

```
┌──────────────┐     ┌──────────────┐
│  React (web) │     │ Flutter (app)│      ← หน้าบ้าน 2 แบบ
└──────┬───────┘     └──────┬───────┘
       │  HTTP/JSON          │
       └─────────┬───────────┘
          ┌──────▼───────┐
          │ Node.js API  │  Express          ← หลังบ้าน (server/)
          └──────┬───────┘
                 │ SQL
          ┌──────▼───────┐
          │  PostgreSQL  │  Render Postgres  ← ฐานข้อมูล
          └──────────────┘
```

| โฟลเดอร์ | เทคโนโลยี | หน้าที่ |
|---|---|---|
| `server/` | Node.js 20 + Express + `pg` | REST API 5 เส้น, สร้างตารางเองตอนเริ่ม |
| `web/` | React 18 + Vite | หน้าเว็บ เรียก API ผ่าน `fetch` |
| `mobile/` | Flutter 3 + `http` | แอป iOS/Android เรียก API ตัวเดียวกัน |
| `render.yaml` | Render Blueprint | ประกาศ DB + API + Static site ในไฟล์เดียว |
| `deploy-render.sh` | Render API | สร้าง service บน Render ด้วยสคริปต์ |

![web](docs/web.png) ![mobile](docs/mobile.png)

---

## บทที่ 1 — ฐานข้อมูล PostgreSQL

ตารางเดียว (`server/src/db.js`):

```sql
CREATE TABLE IF NOT EXISTS todos (
  id          SERIAL PRIMARY KEY,          -- เลขรันอัตโนมัติ
  title       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

สิ่งที่ควรสอน
- `SERIAL` = ให้ DB ออกเลข id เอง · `DEFAULT now()` = DB ประทับเวลาเอง
- `IF NOT EXISTS` ทำให้รันซ้ำได้ไม่พัง → เอาไปวางใน "ตอนเซิร์ฟเวอร์เริ่ม" ได้เลย
- การต่อ DB ใช้ **connection string** ก้อนเดียว `postgres://user:pass@host:5432/dbname`
  เก็บใน environment variable ชื่อ `DATABASE_URL` เสมอ (ห้าม hardcode ในโค้ด)

รัน Postgres ในเครื่องด้วย Docker (ไม่ต้องติดตั้งอะไรเพิ่ม):

```bash
docker run -d --name learn-todo-pg -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=learn_todo -p 127.0.0.1:5439:5432 postgres:16-alpine
# DATABASE_URL=postgres://postgres:postgres@localhost:5439/learn_todo
```

## บทที่ 2 — Node.js API (`server/`)

```bash
cd server
cp .env.example .env        # แก้ DATABASE_URL
npm install
npm run dev                 # http://localhost:3000
```

| Method | Path | ทำอะไร | ตอบ |
|---|---|---|---|
| GET | `/api/health` | เช็คว่า API + DB ยังอยู่ | `{ok:true, dbTime}` |
| GET | `/api/todos` | รายการทั้งหมด (ใหม่สุดก่อน) | `[ {...} ]` |
| POST | `/api/todos` | เพิ่ม `{title}` | `201` + รายการใหม่ |
| PATCH | `/api/todos/:id` | แก้ `{done}` หรือ `{title}` | รายการที่แก้แล้ว |
| DELETE | `/api/todos/:id` | ลบ | `204` |

ลองยิงด้วย curl:

```bash
curl -X POST localhost:3000/api/todos -H 'Content-Type: application/json' -d '{"title":"ซื้อนม"}'
curl localhost:3000/api/todos
curl -X PATCH localhost:3000/api/todos/1 -H 'Content-Type: application/json' -d '{"done":true}'
curl -X DELETE localhost:3000/api/todos/1 -i
```

จุดสอนสำคัญใน `src/index.js`
1. **parameterized query** `$1, $2` — ห้ามต่อ string เป็น SQL เอง (กัน SQL injection)
2. **ตรวจ input ก่อนลง DB** → ตอบ `400` พร้อมข้อความไทย, ไม่พบ → `404`
3. **`wrap()`** ห่อ async handler ให้ error ไหลไป error middleware (Express 4 ไม่ทำให้เอง — ถ้าไม่ห่อ request จะค้าง)
4. **`PORT` มาจาก env** — Render กำหนดพอร์ตให้เอง ห้าม hardcode
5. **CORS** เปิดเพราะเว็บอยู่คนละโดเมนกับ API

## บทที่ 3 — React web (`web/`)

```bash
cd web
npm install
npm run dev                 # http://localhost:5173  (proxy /api → localhost:3000)
```

โครง 3 ไฟล์ที่ต้องอ่าน
- `src/api.js` — รวมทุก `fetch` ไว้ที่เดียว, อ่าน base URL จาก `VITE_API_URL`
- `src/App.jsx` — `useState` เก็บรายการ, `useEffect` โหลดครั้งแรก, ฟังก์ชัน add/toggle/delete อัปเดต state ทันที (optimistic)
- `vite.config.js` — `proxy` ทำให้ตอน dev เรียก `/api` ได้โดยไม่ติด CORS

Build ออกเป็นไฟล์ static: `npm run build` → โฟลเดอร์ `dist/` (Render เสิร์ฟให้ฟรี)

## บทที่ 4 — Flutter mobile (`mobile/`)

```bash
cd mobile
flutter pub get
flutter run --dart-define=API_URL=http://localhost:3000        # simulator ในเครื่อง
flutter run --dart-define=API_URL=https://learn-todo-api.onrender.com   # ต่อ prod
```

`lib/main.dart` ไฟล์เดียว แบ่ง 5 ส่วนให้สอนทีละส่วน
1. `apiUrl` จาก `--dart-define` (เหมือน env ของ Node)
2. `class Todo` + `fromJson` — แปลง JSON → object
3. `class TodoApi` — รวม HTTP call ทั้งหมด (คู่ขนานกับ `api.js` ของ React)
4. `LearnTodoApp` — MaterialApp + theme
5. `TodoPage` (StatefulWidget) — `setState` ทุกครั้งที่ข้อมูลเปลี่ยน, `RefreshIndicator` ดึงลงรีเฟรช

> Android emulator เข้า localhost ของเครื่องต้องใช้ `http://10.0.2.2:3000` แทน

## บทที่ 5 — Deploy ขึ้น Render

Render มี 3 อย่างที่เราใช้ (ฟรีทั้งหมด): **Postgres**, **Web Service** (Node), **Static Site** (React)

### 5.1 เตรียม
1. push โค้ดขึ้น GitHub (`snpeerapun/learn-fullstack-render`)
2. ให้ Render เห็น repo ได้ — ทำอย่างใดอย่างหนึ่ง
   - ตั้ง repo เป็น **Public**: `gh repo edit snpeerapun/learn-fullstack-render --visibility public --accept-visibility-change-consequences`
   - หรือเชื่อม GitHub กับ Render: Dashboard → Account Settings → **Git Providers → Connect GitHub**
3. สร้าง API key: Dashboard → Account Settings → API Keys → เก็บใน `../.render.env` เป็น `RENDER_API_KEY=rnd_...`

### 5.2 วิธี A — สคริปต์ (สอนเรื่อง Infrastructure-as-code ผ่าน API)

```bash
./deploy-render.sh
```

สคริปต์จะ: ดึง internal connection string ของ Postgres → สร้าง Web Service `learn-todo-api`
(rootDir `server`, `npm install` / `npm start`, env `DATABASE_URL`) → สร้าง Static Site `learn-todo-web`
(rootDir `web`, build `npm run build`, publish `dist`, env `VITE_API_URL` = URL ของ API)

### 5.3 วิธี B — Blueprint (คลิกครั้งเดียว)
Dashboard → **New → Blueprint** → เลือก repo → Render อ่าน `render.yaml` แล้วสร้างทั้ง DB + API + Web ให้

### 5.4 วิธี C — คลิกเองใน Dashboard (เหมาะสอนครั้งแรก)
1. New → PostgreSQL → ชื่อ `learn-todo-db`, Free, Singapore → copy **Internal Database URL**
2. New → Web Service → เลือก repo → Root Directory `server`, Build `npm install`, Start `npm start`,
   Environment: `DATABASE_URL` = ค่าที่ copy, `NODE_VERSION` = `20`
3. New → Static Site → เลือก repo → Root Directory `web`, Build `npm install && npm run build`,
   Publish `dist`, Environment: `VITE_API_URL` = `https://learn-todo-api.onrender.com`

### 5.5 ตรวจว่าขึ้นจริง
```bash
curl https://learn-todo-api.onrender.com/api/health     # ต้องได้ {"ok":true,...}
open https://learn-todo-web.onrender.com
```

## Render เหมาะกับอะไร

| ใช้เป็น | เหมาะไหม | เหตุผล |
|---|---|---|
| server สอน / test / demo แอป | **เหมาะมาก** | ฟรี, มี HTTPS + URL จริงทันที, push แล้ว deploy เอง, มี Postgres ให้, ไม่ต้องดูแลเครื่อง |
| staging ให้ลูกค้าลอง | เหมาะ (จ่าย Starter ~$7/เดือน/service) | ตัดปัญหาหลับ 15 นาที และ DB ฟรีหมดอายุ |
| production จริง | ไม่แนะนำบนแผนฟรี | เครื่องหลับ, DB หมดอายุ 30 วัน, ไม่มี backup, อยู่ Singapore แต่ไม่มี CDN ไทย |

ข้อควรรู้ของแผนฟรี
- Web Service ฟรี **หลับเมื่อไม่มีคนใช้ 15 นาที** → request แรกช้า ~30-50 วิ (แอปมือถือตั้ง timeout 30 วิไว้แล้ว)
- Postgres ฟรี **หมดอายุ 30 วัน** หลังสร้าง (Render จะเมลเตือน) — เหมาะเรียน ไม่เหมาะ prod
- ต่อ Postgres จากเครื่องเราต้องใช้ **External URL** + SSL และ IP ต้องอยู่ใน Access Control ของ DB
  (ตอนสร้างผ่าน API รายการอาจว่าง → เข้า Dashboard ของ DB → Access Control → เพิ่ม `0.0.0.0/0` หรือ IP ของเรา)
  ส่วน Web Service บน Render ใช้ **Internal URL** ไม่ต้องตั้งอะไร

---

## ลำดับสอนที่แนะนำ (3 คาบ)

| คาบ | หัวข้อ | ผลลัพธ์ที่นักเรียนเห็น |
|---|---|---|
| 1 | Postgres ใน Docker + Node API + curl | ยิง curl แล้วข้อมูลลง DB จริง |
| 2 | React ต่อ API | หน้าเว็บเพิ่ม/ติ๊ก/ลบได้ รีเฟรชแล้วข้อมูลยังอยู่ |
| 3 | Flutter ต่อ API เดียวกัน + deploy Render | มือถือกับเว็บเห็นข้อมูลชุดเดียวกัน, มี URL จริงส่งให้เพื่อนเปิด |

แบบฝึกต่อยอด: เพิ่มฟิลด์ `due_date` (แก้ทั้ง 4 ชั้น) · เพิ่ม login ง่าย ๆ · แยก todo ต่อผู้ใช้
