import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from pydantic import BaseModel

load_dotenv()

DB_FILE = Path(__file__).parent / "chats.json"
llm = ChatGroq(model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def load() -> dict:
    return json.loads(DB_FILE.read_text()) if DB_FILE.exists() else {}


def save(chats: dict) -> None:
    DB_FILE.write_text(json.dumps(chats, indent=2))


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Message(BaseModel):
    content: str


@app.get("/chats")
def list_chats():
    chats = load()
    items = [
        {"id": c["id"], "title": c["title"], "updated_at": c["updated_at"]}
        for c in chats.values()
    ]
    return sorted(items, key=lambda c: c["updated_at"], reverse=True)


@app.post("/chats")
def new_chat():
    chats = load()
    chat = {
        "id": uuid.uuid4().hex,
        "title": "New chat",
        "updated_at": now(),
        "messages": [],
    }
    chats[chat["id"]] = chat
    save(chats)
    return chat


@app.get("/chats/{chat_id}")
def get_chat(chat_id: str):
    chat = load().get(chat_id)
    if not chat:
        raise HTTPException(404, "Chat not found")
    return chat


@app.delete("/chats/{chat_id}")
def delete_chat(chat_id: str):
    chats = load()
    if chats.pop(chat_id, None) is None:
        raise HTTPException(404, "Chat not found")
    save(chats)
    return {"ok": True}


@app.post("/chats/{chat_id}/messages")
def send_message(chat_id: str, body: Message):
    chats = load()
    chat = chats.get(chat_id)
    if not chat:
        raise HTTPException(404, "Chat not found")

    chat["messages"].append({"role": "user", "content": body.content})
    if chat["title"] == "New chat":
        chat["title"] = body.content[:40]

    history = [SystemMessage("You are a helpful assistant.")]
    for m in chat["messages"]:
        cls = HumanMessage if m["role"] == "user" else AIMessage
        history.append(cls(m["content"]))

    try:
        reply = llm.invoke(history).content
    except Exception as e:
        raise HTTPException(502, f"LLM error: {e}")

    chat["messages"].append({"role": "assistant", "content": reply})
    chat["updated_at"] = now()
    save(chats)
    return chat
