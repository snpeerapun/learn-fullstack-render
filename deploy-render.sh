#!/usr/bin/env bash
# deploy-render.sh — สร้าง Web Service (API) + Static Site (React) บน Render ผ่าน API
#
# ก่อนรัน:
#   1) มีไฟล์ ../.render.env ที่มีบรรทัด RENDER_API_KEY=rnd_xxx (chmod 600)
#   2) repo บน GitHub ต้อง "public" หรือ Render workspace ต้องเชื่อม GitHub แล้ว
#      (Dashboard → Account Settings → Git Providers → Connect GitHub)
#   3) Postgres สร้างไว้แล้ว (ค่า PG_ID ด้านล่าง) — สร้างใหม่ได้ด้วย:
#      curl -X POST https://api.render.com/v1/postgres -d '{"name":"learn-todo-db","ownerId":"...","plan":"free","region":"singapore","version":"16"}'
#
# ใช้: ./deploy-render.sh
set -euo pipefail
cd "$(dirname "$0")"

OWNER_ID="tea-dap0v2egekts73fct4u0"
PG_ID="dpg-dap11ebtqb8s73eukme0-a"
REPO="https://github.com/snpeerapun/learn-fullstack-render"
API_NAME="learn-todo-api"
WEB_NAME="learn-todo-web"

set -a; . ../.render.env; set +a
: "${RENDER_API_KEY:?ไม่พบ RENDER_API_KEY ใน ../.render.env}"
H=(-H "Authorization: Bearer $RENDER_API_KEY" -H "Content-Type: application/json")

echo "▸ ดึง connection string ภายในของ Postgres $PG_ID"
INTERNAL_URL=$(curl -sf "${H[@]}" "https://api.render.com/v1/postgres/$PG_ID/connection-info" \
  | python3 -c 'import json,sys;print(json.load(sys.stdin)["internalConnectionString"])')

echo "▸ สร้าง Web Service: $API_NAME"
API_JSON=$(python3 - "$OWNER_ID" "$REPO" "$API_NAME" "$INTERNAL_URL" <<'PY'
import json,sys
owner,repo,name,db=sys.argv[1:]
print(json.dumps({
 "type":"web_service","name":name,"ownerId":owner,"repo":repo,"branch":"main","rootDir":"server","autoDeploy":"yes",
 "envVars":[{"key":"DATABASE_URL","value":db},{"key":"NODE_VERSION","value":"20"}],
 "serviceDetails":{"env":"node","plan":"free","region":"singapore","healthCheckPath":"/api/health",
   "envSpecificDetails":{"buildCommand":"npm install","startCommand":"npm start"}}}))
PY
)
API_RESP=$(curl -s "${H[@]}" -X POST -d "$API_JSON" https://api.render.com/v1/services)
API_URL=$(echo "$API_RESP" | python3 -c 'import json,sys;d=json.load(sys.stdin)
if "service" not in d: raise SystemExit("สร้าง API ไม่สำเร็จ: "+d.get("message",str(d)))
print(d["service"]["serviceDetails"]["url"])')
echo "  ✓ API URL: $API_URL"

echo "▸ สร้าง Static Site: $WEB_NAME (VITE_API_URL=$API_URL)"
WEB_JSON=$(python3 - "$OWNER_ID" "$REPO" "$WEB_NAME" "$API_URL" <<'PY'
import json,sys
owner,repo,name,api=sys.argv[1:]
print(json.dumps({
 "type":"static_site","name":name,"ownerId":owner,"repo":repo,"branch":"main","rootDir":"web","autoDeploy":"yes",
 "envVars":[{"key":"VITE_API_URL","value":api}],
 "serviceDetails":{"buildCommand":"npm install && npm run build","publishPath":"dist"}}))
PY
)
WEB_RESP=$(curl -s "${H[@]}" -X POST -d "$WEB_JSON" https://api.render.com/v1/services)
WEB_URL=$(echo "$WEB_RESP" | python3 -c 'import json,sys;d=json.load(sys.stdin)
if "service" not in d: raise SystemExit("สร้างเว็บไม่สำเร็จ: "+d.get("message",str(d)))
print(d["service"]["serviceDetails"]["url"])')
echo "  ✓ Web URL: $WEB_URL"

echo
echo "▸ Render กำลัง build (~2-4 นาที) — เช็คด้วย:"
echo "    curl $API_URL/api/health"
echo "    open $WEB_URL"
echo "▸ แอปมือถือ: flutter run --dart-define=API_URL=$API_URL"
