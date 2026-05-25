# VedaAI Assignment Builder

A MERN stack assignment builder with a React frontend, Express API, and MongoDB persistence.

## Run locally

1. Open a terminal in this folder.
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd frontend && npm install
   ```
4. Start the backend and frontend together:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` in your browser.

## Project structure

- `backend/` — Express server, MongoDB connection, assignment API routes
- `frontend/` — React + Vite UI for dashboard, assignment creation, and preview

## Environment

Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` if needed.

## Notes

- The frontend proxies `/api` requests to the backend running on port `5000`
- The backend uses MongoDB at `mongodb://127.0.0.1:27017/vedaai` by default
