# VedaAI Assignment Builder

A full-stack assignment builder with:
- `frontend/` React + Vite
- `backend/` Express API
- MongoDB persistence

## Run Locally

1. Install backend dependencies:
   ```bash
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   npm install --prefix frontend
   ```
3. Create local env:
   - Copy `backend/.env.example` to `backend/.env`
4. Start app:
   ```bash
   npm run dev
   ```
5. Open:
   - Frontend: `http://127.0.0.1:5174`
   - API health: `http://127.0.0.1:5000/api/health`

## Deploy on Render

This repo includes `render.yaml` for one-click Blueprint deployment.

### Required env var on Render
- `MONGO_URI` (use MongoDB Atlas connection string)

### Steps
1. Push latest code to GitHub.
2. In Render, choose **Blueprint** deploy from the repository.
3. Set `MONGO_URI` in the service Environment.
4. Deploy.

Render uses:
- Build command: `npm install && npm run build`
- Start command: `npm start`

The backend serves built frontend files from `frontend/dist` in production.
