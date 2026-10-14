import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',timeout:90000,workers:1,use:{baseURL:'http://localhost:5173',viewport:{width:1440,height:1000},trace:'retain-on-failure'},reporter:'list',webServer:[
 {command:'cd .. && mkdir -p .cache && DATABASE_URL=sqlite:///.cache/e2e.db uv run alembic upgrade head && DATABASE_URL=sqlite:///.cache/e2e.db COOKIE_SECURE=false SESSION_SECRET=ci-browser-only-012345678901234567890 uv run uvicorn backend.main:app --host 127.0.0.1 --port 8001',url:'http://localhost:8001/healthz',reuseExistingServer:!process.env.CI},
 {command:'npm run dev',url:'http://localhost:5173',reuseExistingServer:!process.env.CI},
 {command:'cd ../runner && npx vite preview --host 127.0.0.1 --port 5174',url:'http://localhost:5174',reuseExistingServer:!process.env.CI}
]});
