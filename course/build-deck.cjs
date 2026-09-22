// build-deck.cjs — สร้างสไลด์คอร์ส "เขียน App ครบวงจร: Code → Deploy → Google Play → App Store"
// รัน: node build-deck.cjs   → ได้ course-deck.pptx
const pptxgen = require('pptxgenjs');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Fa = require('react-icons/fa6');

// ---------- palette ----------
const C = {
  navy: '1E2761', ice: 'CADCFC', iceSoft: 'EEF3FD', white: 'FFFFFF',
  mint: '02C39A', mintSoft: 'DDF7F0', amber: 'F59E0B', amberSoft: 'FEF3C7',
  red: 'DC2626', redSoft: 'FEE2E2', text: '1F2937', muted: '64748B', line: 'E5E7EB',
  green: '16A34A', appleGray: '333333', playGreen: '01875F',
};
const FONT = 'Tahoma';
const W = 13.333, H = 7.5, M = 0.6;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.title = 'คอร์สเขียน App ครบวงจร: Code → Deploy → Google Play → App Store';

// ---------- icon helper (react-icons → PNG base64) ----------
const iconCache = new Map();
async function icon(name, color) {
  const key = `${name}:${color}`;
  if (iconCache.has(key)) return iconCache.get(key);
  const Cmp = Fa[name];
  if (!Cmp) throw new Error(`no icon ${name}`);
  const svg = renderToStaticMarkup(React.createElement(Cmp, { color: `#${color}`, size: 256 }));
  const png = await sharp(Buffer.from(svg)).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  const data = 'image/png;base64,' + png.toString('base64');
  iconCache.set(key, data);
  return data;
}

// ไอคอนในวงกลมสี (motif หลักของเด็ค)
async function iconCircle(slide, name, x, y, d, bg, fg) {
  slide.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg } });
  const pad = d * 0.26;
  slide.addImage({ data: await icon(name, fg), x: x + pad, y: y + pad, w: d - pad * 2, h: d - pad * 2 });
}

// ---------- text helpers ----------
const T = (slide, text, o) => slide.addText(text, { fontFace: FONT, isTextBox: true, margin: 0, color: C.text, valign: 'top', ...o });

function header(slide, title, kicker) {
  slide.background = { color: C.white };
  if (kicker) T(slide, kicker.toUpperCase(), { x: M, y: 0.38, w: 8, h: 0.3, fontSize: 11, bold: true, color: C.mint, charSpacing: 2 });
  T(slide, title, { x: M, y: kicker ? 0.66 : 0.45, w: W - M * 2, h: 0.8, fontSize: 30, bold: true, color: C.navy });
  return 1.6; // content top
}

function footer(slide, n) {
  T(slide, 'คอร์สเขียน App ครบวงจร', { x: M, y: H - 0.45, w: 5, h: 0.25, fontSize: 9, color: C.muted });
  T(slide, String(n), { x: W - M - 1, y: H - 0.45, w: 1, h: 0.25, fontSize: 9, color: C.muted, align: 'right' });
}

function bullets(slide, items, o) {
  const arr = items.map((t, i) => ({
    text: typeof t === 'string' ? t : t.text,
    options: { bullet: typeof t === 'string' ? true : (t.bullet ?? true), breakLine: i < items.length - 1, paraSpaceAfter: 6, ...(typeof t === 'string' ? {} : t.options) },
  }));
  slide.addText(arr, { fontFace: FONT, isTextBox: true, fontSize: 14, color: C.text, valign: 'top', margin: 0, ...o });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.12, fill: { color: opts.fill || C.iceSoft }, line: { color: opts.line || C.iceSoft, width: 0.75 },
    shadow: opts.shadow ? { type: 'outer', blur: 6, offset: 2, angle: 90, color: '000000', opacity: 0.12 } : undefined,
  });
}

function table(slide, rows, x, y, w, colW, o = {}) {
  const head = rows[0].map((c) => ({ text: c, options: { bold: true, color: C.white, fill: { color: C.navy }, fontFace: FONT, fontSize: o.fs || 12, valign: 'middle' } }));
  const body = rows.slice(1).map((r, ri) => r.map((c) => ({
    text: c, options: { fontFace: FONT, fontSize: o.fs || 12, color: C.text, fill: { color: ri % 2 ? C.white : C.iceSoft }, valign: 'middle' },
  })));
  slide.addTable([head, ...body], { x, y, w, colW, border: { type: 'solid', color: C.line, pt: 0.5 }, rowH: o.rowH || 0.42, margin: 0.06 });
}

let n = 0;
const next = () => { n += 1; return pres.addSlide(); };

// =====================================================================
(async () => {
  // 1 ---- Title
  {
    const s = next();
    s.background = { color: C.navy };
    T(s, 'คอร์ส', { x: M, y: 1.5, w: 6, h: 0.5, fontSize: 18, color: C.ice });
    T(s, 'เขียน App ครบวงจร', { x: M, y: 1.95, w: 9, h: 1.0, fontSize: 48, bold: true, color: C.white });
    T(s, 'Code → Deploy Server → Google Play → App Store', { x: M, y: 2.95, w: 10, h: 0.6, fontSize: 24, color: C.mint });
    T(s, 'PostgreSQL · Node.js · React · Flutter · Render · Play Console · App Store Connect', { x: M, y: 3.7, w: 11, h: 0.5, fontSize: 14, color: C.ice });
    const icons = ['FaDatabase', 'FaServer', 'FaReact', 'FaMobileScreen', 'FaCloudArrowUp', 'FaGooglePlay', 'FaApple'];
    for (let i = 0; i < icons.length; i++) await iconCircle(s, icons[i], M + i * 0.95, 4.7, 0.7, '2B3A80', C.white);
    T(s, 'ตัวอย่างประกอบทั้งคอร์ส: learn-fullstack (Todo app) · github.com/snpeerapun/learn-fullstack-render', { x: M, y: 6.5, w: 12, h: 0.4, fontSize: 12, color: C.ice });
  }

  // 2 ---- Outcomes
  {
    const s = next();
    const top = header(s, 'จบคอร์สแล้วผู้เรียนจะได้อะไร', 'Learning outcomes');
    const items = [
      ['FaCode', 'เขียนแอปครบ 4 ชั้น', 'ฐานข้อมูล PostgreSQL, API ด้วย Node.js, เว็บ React และแอปมือถือ Flutter ที่ใช้ข้อมูลชุดเดียวกัน'],
      ['FaCloudArrowUp', 'Deploy ขึ้น server จริง', 'มี URL https ใช้งานได้ทันที เข้าใจ environment variable, build/start command, health check'],
      ['FaGooglePlay', 'ปล่อยแอปบน Google Play', 'ตั้งบัญชี, เซ็น AAB, กรอก Data safety, ผ่าน closed testing ไปถึง production'],
      ['FaApple', 'ปล่อยแอปบน App Store', 'certificate/provisioning, TestFlight, privacy label, ส่ง review และรับมือกับ reject'],
    ];
    const cw = (W - M * 2 - 0.3 * 3) / 4;
    for (let i = 0; i < 4; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top, cw, 3.7, { shadow: true, fill: C.white, line: C.line });
      await iconCircle(s, items[i][0], x + 0.3, top + 0.35, 0.9, i % 2 ? C.mintSoft : C.iceSoft, i % 2 ? C.mint : C.navy);
      T(s, items[i][1], { x: x + 0.3, y: top + 1.5, w: cw - 0.6, h: 0.9, fontSize: 18, bold: true, color: C.navy });
      T(s, items[i][2], { x: x + 0.3, y: top + 2.35, w: cw - 0.6, h: 1.3, fontSize: 13, color: C.text });
    }
    footer(s, n);
  }

  // 3 ---- Architecture
  {
    const s = next();
    const top = header(s, 'ภาพรวมระบบที่เราจะสร้าง', 'Architecture');
    // boxes
    const box = async (x, y, w, h, ic, title, sub, bg, fg) => {
      card(s, x, y, w, h, { fill: bg, line: bg, shadow: true });
      await iconCircle(s, ic, x + 0.25, y + 0.25, 0.7, C.white, fg);
      T(s, title, { x: x + 1.1, y: y + 0.25, w: w - 1.3, h: 0.4, fontSize: 17, bold: true, color: fg === C.white ? C.white : C.navy });
      T(s, sub, { x: x + 1.1, y: y + 0.65, w: w - 1.3, h: 0.6, fontSize: 12, color: fg === C.white ? C.ice : C.muted });
    };
    await box(M, top + 0.2, 4.6, 1.3, 'FaReact', 'React web (Vite)', 'หน้าเว็บ เรียก API ด้วย fetch · deploy เป็น Static Site', C.iceSoft, C.navy);
    await box(W - M - 4.6, top + 0.2, 4.6, 1.3, 'FaMobileScreen', 'Flutter mobile', 'iOS + Android · ใช้ API เดียวกัน · ขึ้น 2 สโตร์', C.iceSoft, C.navy);
    await box((W - 5.2) / 2, top + 2.2, 5.2, 1.3, 'FaServer', 'Node.js API (Express)', 'REST 5 เส้น · ตรวจ input · ตอบ JSON · PORT จาก env', C.navy, C.white);
    await box((W - 5.2) / 2, top + 4.2, 5.2, 1.3, 'FaDatabase', 'PostgreSQL', 'ตาราง todos · Render Postgres (ฟรี) หรือ Docker ในเครื่อง', C.mint, C.white);
    // arrows
    const ar = (x1, y1, x2, y2) => s.addShape(pres.ShapeType.line, { x: x1, y: y1, w: x2 - x1, h: y2 - y1, line: { color: C.muted, width: 1.5, endArrowType: 'triangle' } });
    ar(M + 2.3, top + 1.5, (W) / 2 - 0.8, top + 2.2);
    ar(W - M - 2.3, top + 1.5, (W) / 2 + 0.8, top + 2.2);
    ar(W / 2, top + 3.5, W / 2, top + 4.2);
    T(s, 'HTTP / JSON', { x: M + 1.4, y: top + 1.75, w: 2, h: 0.3, fontSize: 11, color: C.muted });
    T(s, 'HTTP / JSON', { x: W - M - 3.4, y: top + 1.75, w: 2, h: 0.3, fontSize: 11, color: C.muted, align: 'right' });
    T(s, 'SQL', { x: W / 2 + 0.15, y: top + 3.7, w: 1, h: 0.3, fontSize: 11, color: C.muted });
    footer(s, n);
  }

  // 4 ---- Roadmap
  {
    const s = next();
    const top = header(s, 'โครงสร้างคอร์ส 5 โมดูล', 'Roadmap');
    const mods = [
      ['1', 'เขียนแอป', 'DB → API → Web → Mobile', '6 ชม.', C.navy],
      ['2', 'Deploy server', 'Render / VPS · env · verify', '3 ชม.', C.navy],
      ['3', 'Google Play', 'บัญชี · AAB · Console · testing', '3 ชม.', C.playGreen],
      ['4', 'App Store', 'Apple Dev · TestFlight · Review', '3 ชม.', C.appleGray],
      ['5', 'หลังปล่อย', 'version · monitor · update', '1.5 ชม.', C.mint],
    ];
    const cw = (W - M * 2 - 0.25 * 4) / 5;
    s.addShape(pres.ShapeType.line, { x: M + cw / 2, y: top + 0.7, w: W - M * 2 - cw, h: 0, line: { color: C.line, width: 2 } });
    for (let i = 0; i < 5; i++) {
      const x = M + i * (cw + 0.25);
      s.addShape(pres.ShapeType.ellipse, { x: x + cw / 2 - 0.35, y: top + 0.35, w: 0.7, h: 0.7, fill: { color: mods[i][4] }, line: { color: mods[i][4] } });
      T(s, mods[i][0], { x: x + cw / 2 - 0.35, y: top + 0.35, w: 0.7, h: 0.7, fontSize: 20, bold: true, color: C.white, align: 'center', valign: 'middle' });
      card(s, x, top + 1.4, cw, 2.6, { fill: C.white, line: C.line, shadow: true });
      T(s, mods[i][1], { x: x + 0.25, y: top + 1.6, w: cw - 0.5, h: 0.8, fontSize: 18, bold: true, color: C.navy });
      T(s, mods[i][2], { x: x + 0.25, y: top + 2.45, w: cw - 0.5, h: 1.0, fontSize: 12, color: C.text });
      T(s, mods[i][3], { x: x + 0.25, y: top + 3.4, w: cw - 0.5, h: 0.4, fontSize: 13, bold: true, color: C.mint });
    }
    T(s, 'รวม ~16.5 ชั่วโมง (5 คาบ ×  ~3 ชม. + workshop) · ทุกโมดูลลงมือทำจริงกับโปรเจกต์เดียวต่อเนื่องจนถึงสโตร์', { x: M, y: top + 4.5, w: W - M * 2, h: 0.5, fontSize: 14, color: C.muted });
    footer(s, n);
  }

  // ---- divider helper
  const divider = async (num, title, sub, ic, bg, circle) => {
    const s = next();
    s.background = { color: bg || C.navy };
    T(s, `โมดูล ${num}`, { x: M, y: 2.2, w: 6, h: 0.5, fontSize: 18, color: C.ice });
    T(s, title, { x: M, y: 2.7, w: 9, h: 1.0, fontSize: 44, bold: true, color: C.white });
    T(s, sub, { x: M, y: 3.8, w: 9.5, h: 1.2, fontSize: 18, color: C.ice });
    await iconCircle(s, ic, W - M - 2.2, 2.4, 2.2, circle || '2B3A80', C.white);
  };

  // 5 ---- Module 1 divider
  await divider(1, 'เขียนแอปครบ 4 ชั้น', 'PostgreSQL → Node.js API → React web → Flutter mobile\nโปรเจกต์ตัวอย่าง: Todo list ที่เว็บและมือถือใช้ข้อมูลเดียวกัน', 'FaCode');

  // 6 ---- PostgreSQL
  {
    const s = next();
    const top = header(s, 'ชั้นที่ 1 — PostgreSQL: ตารางเดียวก็เริ่มได้', 'Module 1 · Database');
    card(s, M, top, 6.2, 3.1, { fill: '0F172A', line: '0F172A' });
    T(s, [
      { text: 'CREATE TABLE IF NOT EXISTS todos (', options: { breakLine: true } },
      { text: '  id         SERIAL PRIMARY KEY,', options: { breakLine: true } },
      { text: '  title      TEXT NOT NULL,', options: { breakLine: true } },
      { text: '  done       BOOLEAN NOT NULL DEFAULT false,', options: { breakLine: true } },
      { text: '  created_at TIMESTAMPTZ NOT NULL DEFAULT now()', options: { breakLine: true } },
      { text: ');' },
    ], { x: M + 0.3, y: top + 0.3, w: 5.6, h: 2.6, fontFace: 'Courier New', fontSize: 13, color: 'E2E8F0' });
    const rows = [
      ['FaHashtag', 'SERIAL = DB ออกเลข id เอง', 'ไม่ต้องคิดเลขเองใน code, ไม่ชนกันแม้หลายคนเพิ่มพร้อมกัน'],
      ['FaClock', 'DEFAULT now() = DB ประทับเวลา', 'เวลาเดียวกันทุก client ไม่พึ่งนาฬิกาเครื่องผู้ใช้'],
      ['FaRotate', 'IF NOT EXISTS รันซ้ำได้', 'วางไว้ตอน server เริ่ม → เครื่องใหม่ก็มีตารางเองอัตโนมัติ'],
      ['FaKey', 'DATABASE_URL อยู่ใน env เสมอ', 'postgres://user:pass@host:5432/db · ห้าม hardcode ใน code'],
    ];
    let y = top;
    for (const [ic, h, d] of rows) {
      await iconCircle(s, ic, M + 6.7, y, 0.55, C.iceSoft, C.navy);
      T(s, h, { x: M + 7.4, y: y - 0.02, w: 5.2, h: 0.35, fontSize: 14, bold: true, color: C.navy });
      T(s, d, { x: M + 7.4, y: y + 0.32, w: 5.2, h: 0.5, fontSize: 12, color: C.muted });
      y += 0.76;
    }
    card(s, M, top + 3.4, W - M * 2, 1.4, { fill: C.mintSoft, line: C.mintSoft });
    T(s, 'Workshop 1.1 — รัน Postgres ในเครื่องด้วย Docker (ไม่ต้องติดตั้ง Postgres)', { x: M + 0.3, y: top + 3.55, w: 12, h: 0.35, fontSize: 14, bold: true, color: C.navy });
    T(s, 'docker run -d --name learn-todo-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=learn_todo -p 127.0.0.1:5439:5432 postgres:16-alpine', { x: M + 0.3, y: top + 3.95, w: 12, h: 0.7, fontFace: 'Courier New', fontSize: 12, color: C.text });
    footer(s, n);
  }

  // 7 ---- Node API
  {
    const s = next();
    const top = header(s, 'ชั้นที่ 2 — Node.js API: 5 เส้นครอบ CRUD ทั้งหมด', 'Module 1 · Backend');
    table(s, [
      ['Method', 'Path', 'ทำอะไร', 'ตอบกลับ'],
      ['GET', '/api/health', 'เช็คว่า API + DB ยังอยู่', '{ ok: true, dbTime }'],
      ['GET', '/api/todos', 'รายการทั้งหมด (ใหม่สุดก่อน)', '[ {...}, {...} ]'],
      ['POST', '/api/todos', 'เพิ่ม { title }', '201 + รายการใหม่'],
      ['PATCH', '/api/todos/:id', 'แก้ { done } หรือ { title }', 'รายการที่แก้แล้ว'],
      ['DELETE', '/api/todos/:id', 'ลบ', '204 (ไม่มี body)'],
    ], M, top, 7.0, [1.0, 1.7, 2.6, 1.7]);
    T(s, '5 จุดที่ต้องสอนให้ติดเป็นนิสัย', { x: M + 7.5, y: top, w: 5.3, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    bullets(s, [
      'Parameterized query ($1, $2) — ห้ามต่อ string เป็น SQL เอง (SQL injection)',
      'ตรวจ input ก่อนลง DB → 400 พร้อมข้อความชัด · ไม่พบ → 404',
      'ห่อ async handler ให้ error ไหลไป error middleware (Express 4 ไม่ทำให้เอง)',
      'PORT อ่านจาก env — host กำหนดพอร์ตให้เอง ห้าม hardcode',
      'เปิด CORS เพราะเว็บกับ API อยู่คนละโดเมน',
    ], { x: M + 7.5, y: top + 0.5, w: 5.1, h: 3.2, fontSize: 12.5 });
    card(s, M, top + 3.0, 7.0, 1.7, { fill: '0F172A', line: '0F172A' });
    T(s, [
      { text: '# Workshop 1.2 - curl: prove the data lands in the DB', options: { breakLine: true, color: '94A3B8' } },
      { text: "curl -X POST localhost:3000/api/todos -H 'Content-Type: application/json' -d '{\"title\":\"Buy milk\"}'", options: { breakLine: true } },
      { text: 'curl localhost:3000/api/todos', options: { breakLine: true } },
      { text: "curl -X PATCH localhost:3000/api/todos/1 -d '{\"done\":true}' -H 'Content-Type: application/json'" },
    ], { x: M + 0.25, y: top + 3.15, w: 6.5, h: 1.4, fontFace: 'Courier New', fontSize: 10.5, color: 'E2E8F0' });
    footer(s, n);
  }

  // 8 ---- React
  {
    const s = next();
    const top = header(s, 'ชั้นที่ 3 — React web: 3 ไฟล์ที่ต้องอ่านให้เข้าใจ', 'Module 1 · Frontend');
    const files = [
      ['FaLink', 'src/api.js', 'รวมทุก fetch ไว้ที่เดียว อ่าน base URL จาก VITE_API_URL → หน้า UI ไม่ต้องรู้ว่า server อยู่ไหน'],
      ['FaReact', 'src/App.jsx', 'useState เก็บรายการ · useEffect โหลดครั้งแรก · add/toggle/delete อัปเดต state ทันที (optimistic UI)'],
      ['FaGear', 'vite.config.js', 'proxy /api → localhost:3000 ตอน dev จึงไม่ติด CORS · npm run build ได้โฟลเดอร์ dist/ เป็น static'],
    ];
    let y = top;
    for (const [ic, f, d] of files) {
      card(s, M, y, 7.2, 1.15, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, ic, M + 0.25, y + 0.25, 0.65, C.iceSoft, C.navy);
      T(s, f, { x: M + 1.1, y: y + 0.18, w: 5.8, h: 0.35, fontSize: 15, bold: true, color: C.navy, fontFace: 'Courier New' });
      T(s, d, { x: M + 1.1, y: y + 0.55, w: 5.9, h: 0.55, fontSize: 12, color: C.text });
      y += 1.35;
    }
    s.addImage({ path: path.join(__dirname, '..', 'docs', 'web.png'), x: M + 7.7, y: top, w: 5.0, h: 3.89 });
    T(s, 'หน้าเว็บจริงที่ deploy แล้ว: learn-todo-web.onrender.com', { x: M + 7.7, y: top + 4.0, w: 5.0, h: 0.3, fontSize: 11, color: C.muted });
    footer(s, n);
  }

  // 9 ---- Flutter
  {
    const s = next();
    const top = header(s, 'ชั้นที่ 4 — Flutter: ไฟล์เดียว แบ่ง 5 ส่วนสอนทีละส่วน', 'Module 1 · Mobile');
    const parts = [
      ['1', 'Config', 'apiUrl จาก --dart-define (เทียบเท่า env ของ Node)'],
      ['2', 'Model', 'class Todo + fromJson แปลง JSON → object'],
      ['3', 'Service', 'class TodoApi รวม HTTP call (คู่แฝดของ api.js)'],
      ['4', 'App', 'MaterialApp + theme'],
      ['5', 'Page', 'StatefulWidget · setState เมื่อข้อมูลเปลี่ยน · RefreshIndicator'],
    ];
    let y = top;
    for (const [k, t, d] of parts) {
      s.addShape(pres.ShapeType.ellipse, { x: M, y: y + 0.05, w: 0.5, h: 0.5, fill: { color: C.navy }, line: { color: C.navy } });
      T(s, k, { x: M, y: y + 0.05, w: 0.5, h: 0.5, fontSize: 14, bold: true, color: C.white, align: 'center', valign: 'middle' });
      T(s, t, { x: M + 0.7, y: y, w: 2.0, h: 0.35, fontSize: 15, bold: true, color: C.navy });
      T(s, d, { x: M + 0.7, y: y + 0.33, w: 6.5, h: 0.4, fontSize: 12, color: C.text });
      y += 0.8;
    }
    card(s, M, top + 4.1, 7.4, 0.7, { fill: C.amberSoft, line: C.amberSoft });
    T(s, 'Android emulator ต่อ localhost ของเครื่องต้องใช้ 10.0.2.2 แทน localhost · iOS simulator ใช้ localhost ได้เลย', { x: M + 0.25, y: top + 4.22, w: 7.0, h: 0.5, fontSize: 12, color: C.text });
    s.addImage({ path: path.join(__dirname, '..', 'docs', 'mobile.png'), x: M + 9.0, y: top - 0.1, w: 2.3, h: 5.0, sizing: { type: 'contain', w: 2.3, h: 5.0 } });
    T(s, 'ข้อมูลชุดเดียวกับเว็บ', { x: M + 8.3, y: top + 4.95, w: 3.7, h: 0.3, fontSize: 11, color: C.muted, align: 'center' });
    footer(s, n);
  }

  // 10 ---- Workshop flow
  {
    const s = next();
    const top = header(s, 'Workshop โมดูล 1 — เห็นข้อมูลไหลครบทั้งสาย', 'Module 1 · Hands-on');
    const steps = [
      ['FaTerminal', 'curl POST', 'เพิ่มรายการผ่าน API'],
      ['FaDatabase', 'ดูใน DB', 'SELECT * FROM todos'],
      ['FaReact', 'เปิดเว็บ', 'รายการโผล่ทันที'],
      ['FaMobileScreen', 'เปิดแอป', 'ดึงลงรีเฟรช เห็นชุดเดียวกัน'],
      ['FaCircleCheck', 'ติ๊กบนมือถือ', 'รีเฟรชเว็บ → เสร็จแล้ว'],
    ];
    const cw = (W - M * 2 - 0.3 * 4) / 5;
    for (let i = 0; i < 5; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top, cw, 2.4, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, steps[i][0], x + cw / 2 - 0.45, top + 0.3, 0.9, i === 4 ? C.mintSoft : C.iceSoft, i === 4 ? C.mint : C.navy);
      T(s, steps[i][1], { x: x + 0.15, y: top + 1.35, w: cw - 0.3, h: 0.4, fontSize: 15, bold: true, color: C.navy, align: 'center' });
      T(s, steps[i][2], { x: x + 0.15, y: top + 1.75, w: cw - 0.3, h: 0.5, fontSize: 12, color: C.muted, align: 'center' });
      if (i < 4) s.addShape(pres.ShapeType.line, { x: x + cw, y: top + 1.2, w: 0.3, h: 0, line: { color: C.muted, width: 1.5, endArrowType: 'triangle' } });
    }
    T(s, 'เกณฑ์ผ่าน (นักเรียนต้องแสดงให้ดู)', { x: M, y: top + 2.8, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    bullets(s, [
      'ยิง input ผิด (title ว่าง) แล้ว API ตอบ 400 พร้อมข้อความ ไม่ใช่ 500 หรือค้าง',
      'รีเฟรชหน้าเว็บแล้วข้อมูลยังอยู่ (มาจาก DB ไม่ใช่ state ในหน้า)',
      'มือถือกับเว็บเห็นรายการเดียวกันโดยไม่ต้อง sync อะไรเพิ่ม',
      'อธิบายได้ว่า DATABASE_URL, PORT, VITE_API_URL, API_URL แต่ละตัวอยู่ที่ไหน ใครอ่าน',
    ], { x: M, y: top + 3.25, w: W - M * 2, h: 1.6, fontSize: 13 });
    footer(s, n);
  }

  // 11 ---- Module 2 divider
  await divider(2, 'Deploy ขึ้น server จริง', 'จาก localhost สู่ URL https ที่ใครก็เปิดได้\nเข้าใจ env var, build/start command, health check และการตรวจว่า "ขึ้นจริง"', 'FaCloudArrowUp');

  // 12 ---- Hosting options
  {
    const s = next();
    const top = header(s, 'เลือกที่วาง server: 3 ทางที่ใช้จริง', 'Module 2 · Hosting');
    table(s, [
      ['', 'Render (PaaS)', 'VPS ของเราเอง (Docker + pm2 + nginx)', 'Serverless (Cloudflare / Vercel)'],
      ['เหมาะกับ', 'สอน · test · demo · MVP', 'production หลายแอป ควบคุมได้ทุกอย่าง', 'เว็บ static + API เบา ๆ'],
      ['ราคาเริ่ม', 'ฟรี (มีข้อจำกัด) · Starter ~$7/เดือน', '$5–20/เดือน ทั้งเครื่อง', 'ฟรีถึงระดับหนึ่ง'],
      ['ต้องดูแล', 'ไม่ต้อง — push แล้ว deploy เอง', 'OS, nginx, SSL, backup, pm2 ทั้งหมดเราทำเอง', 'ไม่ต้อง'],
      ['Postgres', 'มีให้ (ฟรีหมดอายุ 30 วัน)', 'รัน container เอง มี backup เอง', 'ต้องใช้บริการ DB แยก'],
      ['ข้อจำกัด', 'ฟรี = หลับหลัง 15 นาที ไม่มีคนใช้', 'ผิดพลาดง่ายถ้าไม่มีประสบการณ์', 'รัน Node เต็มรูปแบบไม่ได้ทุกอย่าง'],
    ], M, top, W - M * 2, [1.6, 3.4, 3.9, 3.23], { fs: 12, rowH: 0.5 });
    card(s, M, top + 3.5, W - M * 2, 1.2, { fill: C.mintSoft, line: C.mintSoft });
    T(s, 'ในคอร์สนี้ใช้ Render เป็นหลัก', { x: M + 0.3, y: top + 3.65, w: 12, h: 0.35, fontSize: 15, bold: true, color: C.navy });
    T(s, 'เพราะได้ URL จริงภายในนาที ไม่ต้องสอน Linux ก่อน และหลักการ (env, build, start, health) ย้ายไปใช้กับ VPS ได้ทั้งหมด · โมดูลเสริม: deploy เดียวกันบน VPS ด้วย pm2 + nginx', { x: M + 0.3, y: top + 4.02, w: 12, h: 0.6, fontSize: 12, color: C.text });
    footer(s, n);
  }

  // 13 ---- Render steps
  {
    const s = next();
    const top = header(s, 'Deploy บน Render: 3 บริการ 3 ขั้น', 'Module 2 · Render');
    const cols = [
      ['FaDatabase', 'PostgreSQL', ['New → PostgreSQL · plan Free · region Singapore', 'ได้ Internal URL (ให้ API ใช้) และ External URL (ต่อจากเครื่องเรา)', 'External ต้องเปิด IP ใน Access Control ก่อน'], C.mint],
      ['FaServer', 'Web Service (API)', ['เลือก repo · Root Directory = server', 'Build: npm install · Start: npm start', 'Env: DATABASE_URL = Internal URL, NODE_VERSION = 20', 'Health check path: /api/health'], C.navy],
      ['FaReact', 'Static Site (web)', ['Root Directory = web', 'Build: npm install && npm run build', 'Publish: dist', 'Env: VITE_API_URL = URL ของ API (ฝังตอน build)'], C.navy],
    ];
    const cw = (W - M * 2 - 0.35 * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + 0.35);
      card(s, x, top, cw, 3.6, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, cols[i][0], x + 0.3, top + 0.3, 0.7, cols[i][3] === C.mint ? C.mintSoft : C.iceSoft, cols[i][3]);
      T(s, `${i + 1}. ${cols[i][1]}`, { x: x + 1.15, y: top + 0.42, w: cw - 1.4, h: 0.5, fontSize: 17, bold: true, color: C.navy });
      bullets(s, cols[i][2], { x: x + 0.3, y: top + 1.2, w: cw - 0.6, h: 2.3, fontSize: 12 });
    }
    T(s, 'ทำได้ 3 วิธี — สอนทั้งสาม', { x: M, y: top + 3.85, w: 4, h: 0.35, fontSize: 14, bold: true, color: C.navy });
    T(s, 'A) คลิกใน Dashboard (ครั้งแรก เห็นทุกช่อง)   B) render.yaml Blueprint (infra เป็นไฟล์ในrepo)   C) สคริปต์ยิง Render API (deploy-render.sh — เข้าใจ automation)', { x: M, y: top + 4.2, w: W - M * 2, h: 0.5, fontSize: 12, color: C.text });
    footer(s, n);
  }

  // 14 ---- Env & secrets
  {
    const s = next();
    const top = header(s, 'Environment variables: ค่าที่ต่างกันทุกเครื่อง อยู่นอก code', 'Module 2 · Config');
    table(s, [
      ['ตัวแปร', 'ใครอ่าน', 'ค่าตอน dev', 'ค่าบน Render'],
      ['DATABASE_URL', 'server/src/db.js', 'postgres://…@localhost:5439/learn_todo', 'Internal URL ของ Render Postgres'],
      ['PORT', 'server/src/index.js', '3000', 'Render กำหนดเอง (อย่าตั้ง)'],
      ['VITE_API_URL', 'web/src/api.js (ตอน build)', 'ว่าง → ใช้ proxy /api', 'https://learn-todo-api.onrender.com'],
      ['API_URL (dart-define)', 'mobile/lib/main.dart', 'http://localhost:3000', 'https://learn-todo-api.onrender.com'],
    ], M, top, W - M * 2, [2.4, 2.8, 3.6, 3.33], { fs: 12, rowH: 0.48 });
    const rules = [
      ['FaShieldHalved', '.env ไม่ขึ้น git', 'มี .gitignore + .env.example ให้เพื่อนก๊อป'],
      ['FaKey', 'Secret ไม่ print ออกจอ / ไม่ใส่ในสไลด์', 'แสดงแค่ host หรือ 4 ตัวท้าย'],
      ['FaRotate', 'แก้ env แล้วต้อง restart / rebuild', 'ค่า VITE_* ฝังตอน build → ต้อง build ใหม่'],
    ];
    const cw = (W - M * 2 - 0.3 * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top + 2.9, cw, 1.7, { fill: C.iceSoft, line: C.iceSoft });
      await iconCircle(s, rules[i][0], x + 0.25, top + 3.15, 0.6, C.white, C.navy);
      T(s, rules[i][1], { x: x + 1.0, y: top + 3.1, w: cw - 1.2, h: 0.7, fontSize: 13, bold: true, color: C.navy });
      T(s, rules[i][2], { x: x + 1.0, y: top + 3.8, w: cw - 1.2, h: 0.7, fontSize: 11.5, color: C.text });
    }
    footer(s, n);
  }

  // 15 ---- Verify checklist
  {
    const s = next();
    const top = header(s, '"ขึ้นแล้ว" ต้องพิสูจน์ได้ ไม่ใช่แค่ build ผ่าน', 'Module 2 · Verify');
    const checks = [
      ['FaHeartPulse', 'curl /api/health ได้ ok:true + dbTime', 'ยืนยันทั้ง API และ DB พร้อมกันในคำสั่งเดียว'],
      ['FaListCheck', 'ยิง CRUD จริงบน URL prod', 'POST → 201, PATCH, input ว่าง → 400, id ไม่มี → 404'],
      ['FaGlobe', 'เปิดเว็บ ดู <title> และ badge API', 'HTTP 200 อย่างเดียวหลอกได้ (อาจเป็นหน้าของแอปอื่น)'],
      ['FaFileCode', 'bundle ของเว็บชี้ API ถูกตัว', 'grep URL ของ API ในไฟล์ .js ที่ build ออกมา'],
      ['FaMobileScreen', 'มือถือชี้ prod แล้วเห็นข้อมูลเดียวกัน', 'flutter run --dart-define=API_URL=https://…'],
      ['FaClockRotateLeft', 'รอเครื่องฟรีตื่น 30–50 วิ', 'request แรกช้าเป็นเรื่องปกติของแผนฟรี ตั้ง timeout ให้พอ'],
    ];
    const cw = (W - M * 2 - 0.3) / 2;
    for (let i = 0; i < checks.length; i++) {
      const x = M + (i % 2) * (cw + 0.3), y = top + Math.floor(i / 2) * 1.55;
      card(s, x, y, cw, 1.35, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, checks[i][0], x + 0.25, y + 0.35, 0.65, C.mintSoft, C.mint);
      T(s, checks[i][1], { x: x + 1.1, y: y + 0.22, w: cw - 1.3, h: 0.45, fontSize: 14, bold: true, color: C.navy });
      T(s, checks[i][2], { x: x + 1.1, y: y + 0.7, w: cw - 1.3, h: 0.55, fontSize: 12, color: C.muted });
    }
    footer(s, n);
  }

  // 16 ---- Module 3 divider
  await divider(3, 'ปล่อยแอปบน Google Play', 'บัญชีนักพัฒนา → เซ็นแอป (AAB) → Play Console → testing track → production\nรวมกับดักที่ทำให้โดน reject บ่อยที่สุด', 'FaGooglePlay', '0B3D2E', '1B5E43');

  // 17 ---- Play account
  {
    const s = next();
    const top = header(s, 'เตรียมก่อนแตะ Play Console', 'Module 3 · Google Play');
    const stats = [['$25', 'ค่าสมัครครั้งเดียว', 'ตลอดชีพ ไม่มีรายปี'], ['12 คน', 'ผู้ทดสอบ closed testing', 'ต่อเนื่อง 14 วัน (บัญชีบุคคลที่สร้างหลัง พ.ย. 2023)'], ['3–7 วัน', 'review รอบแรก', 'รอบถัดไปมักไม่กี่ชั่วโมง']];
    const cw = (W - M * 2 - 0.3 * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top, cw, 1.7, { fill: C.iceSoft, line: C.iceSoft });
      T(s, stats[i][0], { x: x + 0.3, y: top + 0.15, w: cw - 0.6, h: 0.8, fontSize: 40, bold: true, color: C.playGreen });
      T(s, stats[i][1], { x: x + 0.3, y: top + 0.95, w: cw - 0.6, h: 0.35, fontSize: 14, bold: true, color: C.navy });
      T(s, stats[i][2], { x: x + 0.3, y: top + 1.28, w: cw - 0.6, h: 0.4, fontSize: 11, color: C.muted });
    }
    T(s, 'สิ่งที่ต้องมีก่อนสร้างแอปใน Console', { x: M, y: top + 2.0, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    bullets(s, [
      'บัญชี Google + ยืนยันตัวตน (บัตรประชาชน) · บัญชีองค์กรต้องมีเลข D-U-N-S',
      'Privacy policy URL ที่เปิดได้จริง (เว็บหน้าเดียวก็พอ) — บังคับทุกแอป',
      'หน้า/URL สำหรับขอลบบัญชี ถ้าแอปมี login',
      'ชื่อแพ็กเกจ (applicationId) ตั้งครั้งเดียว เปลี่ยนไม่ได้ตลอดชีพแอป เช่น com.oneable.learntodo',
    ], { x: M, y: top + 2.45, w: 6.6, h: 2.3, fontSize: 13 });
    T(s, 'ทรัพย์สินสำหรับหน้าร้าน', { x: M + 7.0, y: top + 2.0, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    bullets(s, [
      'ไอคอน 512×512 PNG (ไม่โปร่งใส) · Feature graphic 1024×500',
      'สกรีนช็อตโทรศัพท์ ≥2 รูป (แนะนำ 4–8) สัดส่วน 16:9 หรือ 9:16',
      'คำอธิบายสั้น ≤80 ตัวอักษร · คำอธิบายยาว ≤4000',
      'launcher icon ในแอปต้องตรงกับไอคอนหน้าร้าน (ไม่ใช่ไอคอน Flutter เริ่มต้น)',
    ], { x: M + 7.0, y: top + 2.45, w: 5.7, h: 2.3, fontSize: 13 });
    footer(s, n);
  }

  // 18 ---- Play build
  {
    const s = next();
    const top = header(s, 'Build ให้สโตร์รับ: keystore · AAB · version', 'Module 3 · Build & sign');
    const steps = [
      ['FaKey', '1. สร้าง upload keystore', 'keytool -genkey … -alias upload · เก็บไฟล์ + รหัสไว้ 2 ที่ หายแล้วอัปเดตแอปไม่ได้ (Play App Signing ช่วยได้ถ้าลงทะเบียน)'],
      ['FaFileLines', '2. key.properties + build.gradle', 'ชี้ path keystore/รหัสจากไฟล์ที่ .gitignore ไว้ · signingConfigs.release'],
      ['FaBoxArchive', '3. flutter build appbundle --release', 'ได้ .aab (Play ไม่รับ .apk สำหรับแอปใหม่) · ส่ง --dart-define=API_URL=… ตัว prod ด้วย'],
      ['FaTag', '4. version: X.Y.Z+N ใน pubspec.yaml', '+N (versionCode) ต้องเพิ่มทุกครั้งที่อัปโหลด ไม่ reset · X.Y.Z (versionName) ขยับเมื่อมีของใหม่'],
      ['FaAndroid', '5. targetSdk ทันกำหนด', 'Play บังคับ target API ระดับล่าสุด−1 (ปี 2026 = API 36) แอปเก่าที่ไม่อัปเดตจะถูกซ่อนจากเครื่องใหม่'],
    ];
    let y = top;
    for (const [ic, h, d] of steps) {
      await iconCircle(s, ic, M, y, 0.6, C.mintSoft, C.playGreen);
      T(s, h, { x: M + 0.85, y: y - 0.02, w: 11.5, h: 0.35, fontSize: 14, bold: true, color: C.navy });
      T(s, d, { x: M + 0.85, y: y + 0.33, w: 11.5, h: 0.5, fontSize: 12, color: C.text });
      y += 0.92;
    }
    footer(s, n);
  }

  // 19 ---- Play console flow
  {
    const s = next();
    const top = header(s, 'Play Console: กรอกให้ครบ แล้วไล่ track จากในสู่นอก', 'Module 3 · Console');
    const tracks = [['Internal', 'สูงสุด 100 คน · ขึ้นทันทีไม่รอ review · ทีมเราลองก่อนเสมอ'], ['Closed', '12 ผู้ทดสอบ 14 วัน (บังคับสำหรับบัญชีใหม่) · ส่งลิงก์ให้กลุ่ม'], ['Open', 'ใครก็เข้าร่วมได้ · ไม่บังคับ'], ['Production', 'กด "ส่งเพื่อตรวจสอบ" → review → เผยแพร่ (ทยอย % ได้)']];
    const cw = (W - M * 2 - 0.3 * 3) / 4;
    for (let i = 0; i < 4; i++) {
      const x = M + i * (cw + 0.3);
      const last = i === 3;
      card(s, x, top, cw, 1.75, { fill: last ? C.playGreen : C.white, line: last ? C.playGreen : C.line, shadow: true });
      T(s, tracks[i][0], { x: x + 0.25, y: top + 0.2, w: cw - 0.5, h: 0.4, fontSize: 17, bold: true, color: last ? C.white : C.navy });
      T(s, tracks[i][1], { x: x + 0.25, y: top + 0.65, w: cw - 0.5, h: 1.0, fontSize: 12, color: last ? C.white : C.text });
      if (i < 3) s.addShape(pres.ShapeType.line, { x: x + cw, y: top + 0.85, w: 0.3, h: 0, line: { color: C.muted, width: 1.5, endArrowType: 'triangle' } });
    }
    T(s, 'แบบฟอร์มที่ต้องกรอกก่อนส่ง production (ทำได้ระหว่างรอ testing)', { x: M, y: top + 2.1, w: 12, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    table(s, [
      ['หมวด', 'กรอกอะไร', 'ระวัง'],
      ['Store listing', 'ชื่อ · คำอธิบาย · ไอคอน · สกรีนช็อต · หมวดหมู่ · อีเมลติดต่อ', 'ห้ามอ้างชื่อแบรนด์อื่น/รางวัลที่ไม่มี'],
      ['Data safety', 'เก็บข้อมูลอะไร ส่งให้ใคร เข้ารหัสไหม ลบได้ไหม', 'ต้องตรงกับ privacy policy และสิ่งที่แอปทำจริง'],
      ['Content rating', 'ตอบแบบสอบถาม IARC → ได้เรตอัตโนมัติ', 'ไม่กรอก = ถูกถอดจากสโตร์'],
      ['App access / Ads / Target audience', 'แอปต้อง login ไหม (ให้บัญชีทดสอบ) · มีโฆษณาไหม · อายุกลุ่มเป้าหมาย', 'ระบุว่ามีเด็กเป็นกลุ่มเป้าหมาย = กติกาเพิ่มเยอะ'],
    ], M, top + 2.55, W - M * 2, [2.6, 5.6, 3.93], { fs: 11.5, rowH: 0.42 });
    footer(s, n);
  }

  // 20 ---- Play rejects
  {
    const s = next();
    const top = header(s, 'Google Play: โดน reject เพราะอะไรบ่อยที่สุด (จากของจริง)', 'Module 3 · Pitfalls');
    const items = [
      ['ไอคอนที่ติดตั้งไม่ตรงกับหน้าร้าน', 'ลืมเปลี่ยน mipmap/ic_launcher ยังเป็นโลโก้ Flutter → "Misleading claims" · เช็ค md5 ไอคอนก่อนอัปทุกครั้ง'],
      ['Data safety ไม่ตรง privacy policy', 'บอกว่าไม่เก็บข้อมูล แต่แอปมี login/analytics · แก้ทั้งสองให้ตรงกัน'],
      ['ไม่มีทางลบบัญชี', 'แอปที่มี account ต้องมีปุ่มลบในแอป + URL ลบบัญชีบนเว็บ'],
      ['ให้บัญชีทดสอบไม่ได้/ผิด', 'reviewer เข้าหน้าหลังล็อกอินไม่ได้ = ตรวจไม่ได้ = reject'],
      ['สกรีนช็อต/คำอธิบายสัญญาเกินจริง', 'ภาพที่ไม่มีในแอป, คำว่า "ดีที่สุด/อันดับ 1" โดยไม่มีหลักฐาน'],
      ['targetSdk ต่ำกว่ากำหนด', 'อัปโหลดถูกปฏิเสธทันที · อัป Flutter/Gradle ให้ทันก่อน deadline ประจำปี (ส.ค.)'],
    ];
    const cw = (W - M * 2 - 0.3) / 2;
    for (let i = 0; i < items.length; i++) {
      const x = M + (i % 2) * (cw + 0.3), y = top + Math.floor(i / 2) * 1.55;
      card(s, x, y, cw, 1.35, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, 'FaTriangleExclamation', x + 0.25, y + 0.35, 0.65, C.redSoft, C.red);
      T(s, items[i][0], { x: x + 1.1, y: y + 0.2, w: cw - 1.3, h: 0.4, fontSize: 14, bold: true, color: C.navy });
      T(s, items[i][1], { x: x + 1.1, y: y + 0.62, w: cw - 1.3, h: 0.7, fontSize: 11.5, color: C.text });
    }
    footer(s, n);
  }

  // 21 ---- Module 4 divider
  await divider(4, 'ปล่อยแอปบน App Store', 'Apple Developer Program → certificate & provisioning → TestFlight → App Store Connect → Review\nApple เข้มกว่า Google เรื่อง privacy, login และคำที่ใช้ในหน้าร้าน', 'FaApple', '1C1C1E', '3A3A3C');

  // 22 ---- Apple account & signing
  {
    const s = next();
    const top = header(s, 'Apple Developer Program และการเซ็นแอปแบบเข้าใจง่าย', 'Module 4 · App Store');
    const stats = [['$99/ปี', 'Apple Developer Program', 'บุคคลหรือองค์กร (องค์กรต้องมี D-U-N-S)'], ['Mac + Xcode', 'บังคับ', 'build iOS ต้องทำบน Mac เท่านั้น'], ['24–48 ชม.', 'review โดยทั่วไป', 'ครั้งแรกอาจนานกว่า · เร่งได้ (expedite) กรณีจำเป็น']];
    const cw = (W - M * 2 - 0.3 * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top, cw, 1.7, { fill: 'F2F2F7', line: 'F2F2F7' });
      T(s, stats[i][0], { x: x + 0.3, y: top + 0.15, w: cw - 0.6, h: 0.8, fontSize: i === 1 ? 30 : 40, bold: true, color: C.appleGray });
      T(s, stats[i][1], { x: x + 0.3, y: top + 0.95, w: cw - 0.6, h: 0.35, fontSize: 14, bold: true, color: C.navy });
      T(s, stats[i][2], { x: x + 0.3, y: top + 1.28, w: cw - 0.6, h: 0.4, fontSize: 11, color: C.muted });
    }
    T(s, '3 คำที่ต้องเข้าใจ (Xcode ทำให้เองเมื่อเปิด Automatic signing)', { x: M, y: top + 2.0, w: 12, h: 0.4, fontSize: 16, bold: true, color: C.navy });
    const terms = [
      ['FaIdBadge', 'Bundle ID', 'ชื่อแอปแบบ reverse-domain เช่น com.oneable.learnTodo · ต้องตรงกันทั้ง Xcode และ App Store Connect · เปลี่ยนไม่ได้หลังปล่อย'],
      ['FaCertificate', 'Certificate', '"ตัวตนของนักพัฒนา" · Development ใช้ลงเครื่องทดสอบ · Distribution ใช้ส่งสโตร์ · อยู่ใน Keychain ของ Mac'],
      ['FaFileShield', 'Provisioning profile', '"ใบอนุญาต" ผูก Bundle ID + certificate (+ รายการเครื่องสำหรับ dev) · App Store profile ใช้กับ archive เท่านั้น'],
    ];
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw + 0.3);
      card(s, x, top + 2.5, cw, 2.2, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, terms[i][0], x + 0.25, top + 2.75, 0.65, 'F2F2F7', C.appleGray);
      T(s, terms[i][1], { x: x + 1.05, y: top + 2.85, w: cw - 1.3, h: 0.45, fontSize: 15, bold: true, color: C.navy });
      T(s, terms[i][2], { x: x + 0.25, y: top + 3.4, w: cw - 0.5, h: 1.2, fontSize: 11.5, color: C.text });
    }
    footer(s, n);
  }

  // 23 ---- App Store Connect flow
  {
    const s = next();
    const top = header(s, 'จาก archive ถึง "Ready for Sale"', 'Module 4 · App Store Connect');
    const steps = [
      ['FaHammer', 'Archive', 'flutter build ipa --release --dart-define=API_URL=…\n(หรือ Xcode → Product → Archive)'],
      ['FaCloudArrowUp', 'Upload', 'Xcode Organizer / Transporter / xcrun altool\nรอ processing ~10–30 นาที'],
      ['FaVial', 'TestFlight', 'Internal ≤100 คน ทันที\nExternal ≤10,000 คน ต้องผ่าน beta review'],
      ['FaFilePen', 'App record', 'ชื่อ · subtitle · keywords · สกรีนช็อต\nprivacy label · age rating · ราคา'],
      ['FaMagnifyingGlass', 'Submit review', 'แนบบัญชีทดสอบ + โน้ตให้ reviewer\nสถานะ Waiting → In Review → Ready'],
    ];
    const cw = (W - M * 2 - 0.3 * 4) / 5;
    for (let i = 0; i < 5; i++) {
      const x = M + i * (cw + 0.3);
      const last = i === 4;
      card(s, x, top, cw, 3.0, { fill: last ? C.appleGray : C.white, line: last ? C.appleGray : C.line, shadow: true });
      await iconCircle(s, steps[i][0], x + cw / 2 - 0.4, top + 0.3, 0.8, last ? '4A4A4E' : 'F2F2F7', last ? C.white : C.appleGray);
      T(s, steps[i][1], { x: x + 0.15, y: top + 1.25, w: cw - 0.3, h: 0.4, fontSize: 15, bold: true, color: last ? C.white : C.navy, align: 'center' });
      T(s, steps[i][2], { x: x + 0.2, y: top + 1.7, w: cw - 0.4, h: 1.2, fontSize: 11, color: last ? 'E5E5EA' : C.text, align: 'center' });
      if (i < 4) s.addShape(pres.ShapeType.line, { x: x + cw, y: top + 0.7, w: 0.3, h: 0, line: { color: C.muted, width: 1.5, endArrowType: 'triangle' } });
    }
    T(s, 'สกรีนช็อตที่บังคับ', { x: M, y: top + 3.3, w: 4, h: 0.4, fontSize: 15, bold: true, color: C.navy });
    bullets(s, [
      'iPhone 6.9" (1320×2868) หรือ 6.7" (1290×2796) อย่างน้อย 1 ชุด (3–10 รูป) · Apple ย่อให้จอเล็กเอง',
      'ถ้ารองรับ iPad ต้องมีชุด iPad 13" (2064×2752) ด้วย — หรือปิด iPad ใน Xcode ถ้ายังไม่พร้อม',
      'ห้ามใส่กรอบมือถือที่บังเนื้อหา/ข้อความสัญญาเกินจริง · ภาพต้องเป็นหน้าจอจริงของแอป',
    ], { x: M, y: top + 3.7, w: W - M * 2, h: 1.1, fontSize: 12 });
    footer(s, n);
  }

  // 24 ---- Apple review requirements
  {
    const s = next();
    const top = header(s, 'กติกา Apple ที่แอปเล็ก ๆ ก็ต้องทำให้ครบ', 'Module 4 · Review guidelines');
    table(s, [
      ['ข้อ', 'กติกา', 'ทำอย่างไรในแอปเรา'],
      ['5.1.1', 'Privacy policy URL + App Privacy "nutrition label" ตรงกับที่เก็บจริง', 'กรอกใน App Store Connect → App Privacy · ถ้าใช้ analytics/crash ต้องประกาศ'],
      ['5.1.1 (v)', 'แอปที่สร้างบัญชีได้ ต้องลบบัญชีได้จากในแอป', 'ปุ่ม "ลบบัญชี" ใน Settings + API ลบข้อมูลจริง ไม่ใช่แค่ logout'],
      ['4.8', 'มี login ด้วย Google/Facebook → ต้องมี Sign in with Apple ด้วย', 'ยกเว้นเมื่อใช้แค่ email/รหัสผ่านของเราเอง'],
      ['2.1', 'แอปต้องทำงานครบ ไม่ crash ไม่มีปุ่ม "coming soon"', 'reviewer ใช้เครื่องจริง เน็ตอเมริกา — API ต้องเข้าถึงได้จากต่างประเทศ'],
      ['5.2.5 / 2.3', 'Metadata: ห้ามใช้ชื่อ Mac/iPhone/AirDrop ใน subtitle/keywords · สกรีนช็อตต้องตรงแอป', 'ตรวจข้อความทุกภาษาก่อนส่ง · description อ้างถึงได้แต่ชื่อ/keyword ไม่ได้'],
      ['3.1.1', 'ของดิจิทัลที่ขายในแอปต้องผ่าน In-App Purchase (Apple หัก 15–30%)', 'สินค้ากายภาพ/บริการนอกแอปใช้ payment อื่นได้'],
    ], M, top, W - M * 2, [1.2, 5.6, 5.33], { fs: 11.5, rowH: 0.5 });
    footer(s, n);
  }

  // 25 ---- Apple rejects
  {
    const s = next();
    const top = header(s, 'App Store: reject ที่เจอจริงและวิธีแก้ทันที', 'Module 4 · Pitfalls');
    const items = [
      ['ไอคอนมี alpha channel', 'App Store icon 1024×1024 ต้องทึบ ไม่มีโปร่งใส/มุมมน (Apple ตัดมุมให้เอง) → upload ถูกปฏิเสธเลย'],
      ['จอขาววาบตอนเปิด (launch screen)', 'LaunchScreen.storyboard ยังเป็นค่าเริ่มต้น · ตั้งสีพื้นให้ตรงธีมแอป'],
      ['ไม่มี URL ลบบัญชี / ปุ่มลบบัญชี', 'Guideline 5.1.1(v) — reject ที่พบบ่อยสุดของแอปที่มี login'],
      ['คำต้องห้ามใน subtitle/keywords', 'ตัดชื่อสินค้า Apple ออกทุกภาษา แล้ว resubmit (ต้อง cancel submission เดิมก่อน)'],
      ['reviewer เข้าไม่ได้', 'API หลับ (แผนฟรี) / บล็อก IP ต่างประเทศ / บัญชีทดสอบผิด → เตรียมบัญชี demo + ปลุก server ก่อนส่ง'],
      ['ข้อความในสโตร์เกินตัวอักษร', 'ชื่อ 30 · subtitle 30 · keywords 100 · promo 170 — เกินแล้วบันทึกไม่ได้ ไม่ใช่ reject แต่เสียเวลา'],
    ];
    const cw = (W - M * 2 - 0.3) / 2;
    for (let i = 0; i < items.length; i++) {
      const x = M + (i % 2) * (cw + 0.3), y = top + Math.floor(i / 2) * 1.55;
      card(s, x, y, cw, 1.35, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, 'FaTriangleExclamation', x + 0.25, y + 0.35, 0.65, C.amberSoft, C.amber);
      T(s, items[i][0], { x: x + 1.1, y: y + 0.2, w: cw - 1.3, h: 0.4, fontSize: 14, bold: true, color: C.navy });
      T(s, items[i][1], { x: x + 1.1, y: y + 0.62, w: cw - 1.3, h: 0.7, fontSize: 11.5, color: C.text });
    }
    footer(s, n);
  }

  // 26 ---- Module 5 divider
  await divider(5, 'หลังปล่อยแอป', 'อัปเดตเวอร์ชันอย่างมีระบบ · ดู crash และรีวิว · รับมือจดหมายนโยบายจากสโตร์\nแอปที่ปล่อยแล้ว "ไม่ดูแล" จะถูกถอดจากสโตร์ภายใน 1–2 ปี', 'FaRocket', '0F4C5C', '1F6B7C');

  // 27 ---- Post launch
  {
    const s = next();
    const top = header(s, 'วงจรอัปเดตที่ทำซ้ำได้ทุกเดือน', 'Module 5 · Operations');
    const loop = [
      ['FaCodeBranch', 'แก้โค้ด + bump version', 'pubspec: 1.2.0+7 → 1.2.1+8 (+N ทุกครั้ง) · commit tag v1.2.1'],
      ['FaVial', 'Internal / TestFlight ก่อนเสมอ', 'ห้ามยิงตรง production · ทีมลองบนเครื่องจริง 1 วัน'],
      ['FaChartLine', 'ดู crash / รีวิว / ANR', 'Play Console → Vitals · App Store Connect → Crashes · ตอบรีวิวลบภายใน 48 ชม.'],
      ['FaEnvelopeOpenText', 'อ่านเมลนโยบายทันที', 'target API deadline · Billing Library · privacy form ใหม่ — มักให้เวลา 2–3 เดือน'],
      ['FaServer', 'ดู server ควบคู่', 'health check อัตโนมัติ · DB ฟรีหมดอายุ 30 วัน → ย้ายขึ้นแผนจ่าย/VPS เมื่อมีผู้ใช้จริง'],
    ];
    let y = top;
    for (const [ic, h, d] of loop) {
      await iconCircle(s, ic, M, y, 0.6, C.mintSoft, C.mint);
      T(s, h, { x: M + 0.85, y: y - 0.02, w: 6.0, h: 0.35, fontSize: 14, bold: true, color: C.navy });
      T(s, d, { x: M + 0.85, y: y + 0.33, w: 6.3, h: 0.5, fontSize: 12, color: C.text });
      y += 0.92;
    }
    card(s, M + 7.6, top, 5.1, 4.5, { fill: C.navy, line: C.navy });
    T(s, 'กติกาเวอร์ชัน (จำให้ขึ้นใจ)', { x: M + 7.9, y: top + 0.3, w: 4.5, h: 0.4, fontSize: 16, bold: true, color: C.white });
    T(s, [
      { text: 'version: 1.2.1+8', options: { breakLine: true, fontFace: 'Courier New', fontSize: 22, color: C.mint, bold: true } },
      { text: ' ', options: { breakLine: true, fontSize: 8 } },
      { text: '1.2.1 = versionName / CFBundleShortVersionString', options: { breakLine: true } },
      { text: 'ผู้ใช้เห็น · ขยับเมื่อมีของใหม่', options: { breakLine: true, color: C.ice } },
      { text: ' ', options: { breakLine: true, fontSize: 8 } },
      { text: '8 = versionCode / CFBundleVersion', options: { breakLine: true } },
      { text: 'สโตร์ใช้เรียงลำดับ · เพิ่มทุกอัปโหลด ห้ามซ้ำ ห้ามถอย', options: { breakLine: true, color: C.ice } },
      { text: ' ', options: { breakLine: true, fontSize: 8 } },
      { text: 'อ่านจาก pubspec.yaml ที่เดียว — ในแอปใช้ package_info_plus ห้าม hardcode', options: { color: C.ice } },
    ], { x: M + 7.9, y: top + 0.8, w: 4.5, h: 3.5, fontFace: FONT, fontSize: 12.5, color: C.white, isTextBox: true, margin: 0, valign: 'top' });
    footer(s, n);
  }

  // 28 ---- Google vs Apple
  {
    const s = next();
    const top = header(s, 'Google Play vs App Store — สรุปเทียบในหน้าเดียว', 'Module 5 · Compare');
    table(s, [
      ['', 'Google Play', 'App Store'],
      ['ค่าสมัคร', '$25 ครั้งเดียว', '$99 ต่อปี'],
      ['เครื่องที่ใช้ build', 'Windows / Mac / Linux', 'Mac เท่านั้น (Xcode)'],
      ['ไฟล์ที่ส่ง', '.aab (Android App Bundle)', '.ipa (ผ่าน Xcode / Transporter / altool)'],
      ['ทดสอบก่อนปล่อย', 'Internal → Closed (12 คน 14 วัน) → Open', 'TestFlight internal (100) → external (10,000)'],
      ['เวลา review', 'ครั้งแรก 3–7 วัน · ถัดไปหลักชั่วโมง', '24–48 ชม. โดยทั่วไป'],
      ['จุดเข้มพิเศษ', 'Data safety · target API · ไอคอนตรงหน้าร้าน', 'Privacy label · ลบบัญชี · Sign in with Apple · คำในหน้าร้าน'],
      ['ส่วนแบ่งการขายในแอป', '15% (ถึง $1M/ปี) แล้ว 30%', '15% (Small Business) แล้ว 30%'],
      ['ปล่อยแบบทยอย', 'Staged rollout เป็น %', 'Phased release 7 วัน'],
    ], M, top, W - M * 2, [2.6, 4.7, 4.83], { fs: 12, rowH: 0.46 });
    footer(s, n);
  }

  // 29 ---- Timeline realistic
  {
    const s = next();
    const top = header(s, 'ของจริงใช้เวลาเท่าไร: จากโค้ดบรรทัดแรกถึงแอปอยู่บนสโตร์', 'Module 5 · Timeline');
    const phases = [['สัปดาห์ 1', 'เขียนแอป 4 ชั้น', 'DB · API · web · mobile ทำงานในเครื่อง', C.navy], ['สัปดาห์ 2', 'Deploy + เตรียมสโตร์', 'Render live · ไอคอน · สกรีนช็อต · privacy policy · สมัคร 2 บัญชี', C.navy], ['สัปดาห์ 3–4', 'Testing track', 'Internal + TestFlight · Closed testing 14 วัน (Google บังคับ)', C.playGreen], ['สัปดาห์ 5', 'Review + ปล่อย', 'ส่ง 2 สโตร์พร้อมกัน · แก้ reject 1–2 รอบ · Ready for Sale', C.mint]];
    const cw = (W - M * 2 - 0.3 * 3) / 4;
    s.addShape(pres.ShapeType.line, { x: M, y: top + 0.55, w: W - M * 2, h: 0, line: { color: C.line, width: 3 } });
    for (let i = 0; i < 4; i++) {
      const x = M + i * (cw + 0.3);
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.1, y: top + 0.35, w: 0.4, h: 0.4, fill: { color: phases[i][3] }, line: { color: C.white, width: 2 } });
      T(s, phases[i][0], { x: x, y: top + 0.9, w: cw, h: 0.4, fontSize: 13, bold: true, color: phases[i][3] });
      T(s, phases[i][1], { x: x, y: top + 1.3, w: cw, h: 0.45, fontSize: 18, bold: true, color: C.navy });
      T(s, phases[i][2], { x: x, y: top + 1.8, w: cw - 0.2, h: 1.0, fontSize: 12, color: C.text });
    }
    const stats = [['14 วัน', 'ที่ตัดไม่ได้ของ Google (closed testing)'], ['1–2 รอบ', 'reject ที่ควรเผื่อไว้ในแผน'], ['~5 สัปดาห์', 'จากศูนย์ถึงสโตร์ สำหรับแอปแรก']];
    const cw3 = (W - M * 2 - 0.3 * 2) / 3;
    for (let i = 0; i < 3; i++) {
      const x = M + i * (cw3 + 0.3);
      card(s, x, top + 3.1, cw3, 1.5, { fill: C.iceSoft, line: C.iceSoft });
      T(s, stats[i][0], { x: x + 0.25, y: top + 3.2, w: cw3 - 0.5, h: 0.7, fontSize: 30, bold: true, color: C.navy });
      T(s, stats[i][1], { x: x + 0.25, y: top + 3.95, w: cw3 - 0.5, h: 0.6, fontSize: 12, color: C.muted });
    }
    footer(s, n);
  }

  // 30 ---- Assessment
  {
    const s = next();
    const top = header(s, 'การประเมิน: ส่งลิงก์จริง ไม่ส่งสไลด์', 'Assessment');
    const items = [
      ['FaLink', 'URL เว็บ + API บน Render (30%)', 'health ok · CRUD ครบ · เว็บชี้ API ถูกตัว · ผู้สอนยิง curl ทดสอบเอง'],
      ['FaGooglePlay', 'ลิงก์ Internal/Closed testing บน Play (25%)', 'ผู้สอนติดตั้งจากลิงก์ได้ · ไอคอนถูก · versionCode เพิ่มจากรอบก่อน'],
      ['FaApple', 'TestFlight invite (25%)', 'ผู้สอนติดตั้งผ่าน TestFlight ได้ · privacy label กรอกแล้ว · สกรีนช็อตครบ'],
      ['FaFileLines', 'README + postmortem 1 หน้า (20%)', 'อธิบาย env ทุกตัว · reject ที่เจอและวิธีแก้ · สิ่งที่จะทำต่างในแอปถัดไป'],
    ];
    let y = top;
    for (const [ic, h, d] of items) {
      card(s, M, y, W - M * 2, 1.0, { fill: C.white, line: C.line, shadow: true });
      await iconCircle(s, ic, M + 0.25, y + 0.18, 0.65, C.iceSoft, C.navy);
      T(s, h, { x: M + 1.1, y: y + 0.15, w: 10.8, h: 0.4, fontSize: 15, bold: true, color: C.navy });
      T(s, d, { x: M + 1.1, y: y + 0.55, w: 10.8, h: 0.4, fontSize: 12, color: C.muted });
      y += 1.15;
    }
    T(s, 'โบนัส: ปล่อยถึง production จริงบนสโตร์ใดสโตร์หนึ่ง +10%', { x: M, y: y + 0.05, w: 12, h: 0.4, fontSize: 13, bold: true, color: C.mint });
    footer(s, n);
  }

  // 31 ---- Closing
  {
    const s = next();
    s.background = { color: C.navy };
    T(s, 'สรุป', { x: M, y: 0.8, w: 6, h: 0.5, fontSize: 18, color: C.ice });
    T(s, 'แอปที่ "เสร็จ" คือแอปที่คนอื่นติดตั้งใช้ได้', { x: M, y: 1.25, w: 12, h: 0.9, fontSize: 34, bold: true, color: C.white });
    const pts = [['FaCode', 'เขียน 4 ชั้นให้คุยกันด้วย JSON + SQL'], ['FaCloudArrowUp', 'Deploy แล้วพิสูจน์ด้วย curl ไม่ใช่ build ผ่าน'], ['FaGooglePlay', 'Play: ไอคอน · Data safety · closed testing 14 วัน'], ['FaApple', 'Apple: privacy label · ลบบัญชี · คำในหน้าร้าน'], ['FaRocket', 'หลังปล่อย: +N ทุกอัปโหลด · internal ก่อน production เสมอ']];
    let y = 2.5;
    for (const [ic, t] of pts) {
      await iconCircle(s, ic, M, y, 0.55, '2B3A80', C.mint);
      T(s, t, { x: M + 0.8, y: y + 0.08, w: 8, h: 0.4, fontSize: 16, color: C.white });
      y += 0.72;
    }
    card(s, W - M - 4.4, 2.5, 4.4, 3.5, { fill: '2B3A80', line: '2B3A80' });
    T(s, 'ทรัพยากรประกอบคอร์ส', { x: W - M - 4.1, y: 2.7, w: 3.9, h: 0.4, fontSize: 15, bold: true, color: C.white });
    T(s, [
      { text: 'Repo ตัวอย่าง', options: { breakLine: true, bold: true, color: C.mint } },
      { text: 'github.com/snpeerapun/learn-fullstack-render', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'เว็บ / API ที่รันอยู่', options: { breakLine: true, bold: true, color: C.mint } },
      { text: 'learn-todo-web.onrender.com', options: { breakLine: true } },
      { text: 'learn-todo-api.onrender.com/api/health', options: { breakLine: true } },
      { text: ' ', options: { breakLine: true, fontSize: 6 } },
      { text: 'เอกสารทางการ', options: { breakLine: true, bold: true, color: C.mint } },
      { text: 'render.com/docs · docs.flutter.dev/deployment', options: { breakLine: true } },
      { text: 'support.google.com/googleplay/android-developer', options: { breakLine: true } },
      { text: 'developer.apple.com/app-store/review/guidelines' },
    ], { x: W - M - 4.1, y: 3.15, w: 3.9, h: 2.7, fontFace: FONT, fontSize: 11, color: C.ice, isTextBox: true, margin: 0, valign: 'top' });
  }

  const out = path.join(__dirname, 'course-deck.pptx');
  await pres.writeFile({ fileName: out });
  console.log('wrote', out, 'slides:', n);
})().catch((e) => { console.error(e); process.exit(1); });
