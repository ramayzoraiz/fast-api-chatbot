# FastAPI + LangChain + Groq Chatbot

A simple chatbot with a React frontend. A sidebar lists past conversations, and you can start a new chat, load a previous one, or delete one. History is stored in `backend/chats.json`.

- **Backend:** FastAPI, LangChain (`langchain-groq`), managed with [uv](https://docs.astral.sh/uv/)
- **Frontend:** React (Vite), managed with [bun](https://bun.sh/)

## Prerequisites

- `uv` and `bun` installed
- A [Groq API key](https://console.groq.com/keys)

## Run the backend

```bash
cd backend
echo "GROQ_API_KEY=your_key_here" > .env
uv sync
uv run uvicorn main:app --reload
```

The API runs at http://localhost:8000 (interactive docs at `/docs`).

Optional: set `GROQ_MODEL` in `.env` to change the model (default `qwen/qwen3.8-27b`).

## Run the frontend

In a second terminal:

```bash
cd frontend
bun install
bun dev
```

Open http://localhost:5173.

The frontend expects the backend at `http://localhost:8000` (set in `frontend/src/App.jsx`), and the backend only allows CORS from `localhost:5173`.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/chats` | List chats (newest first) |
| POST | `/chats` | Create a new chat |
| GET | `/chats/{id}` | Load a chat with its messages |
| DELETE | `/chats/{id}` | Delete a chat |
| POST | `/chats/{id}/messages` | Send a message and get the reply |
