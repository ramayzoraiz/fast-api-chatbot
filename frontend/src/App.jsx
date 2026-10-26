import { useEffect, useRef, useState } from 'react'
import './App.css'

const API = 'http://localhost:8000'

const api = async (path, options) => {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || res.statusText)
  return res.json()
}

export default function App() {
  const [chats, setChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

  const refresh = () => api('/chats').then(setChats).catch((e) => setError(e.message))

  useEffect(() => { refresh() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const newChat = () => {
    setActiveId(null)
    setMessages([])
    setError('')
  }

  const loadChat = async (id) => {
    setError('')
    try {
      const chat = await api(`/chats/${id}`)
      setActiveId(id)
      setMessages(chat.messages)
    } catch (e) { setError(e.message) }
  }

  const deleteChat = async (id) => {
    await api(`/chats/${id}`, { method: 'DELETE' }).catch((e) => setError(e.message))
    if (id === activeId) newChat()
    refresh()
  }

  const send = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError('')
    setMessages((m) => [...m, { role: 'user', content: text }])
    setLoading(true)
    try {
      let id = activeId
      if (!id) {
        id = (await api('/chats', { method: 'POST' })).id
        setActiveId(id)
      }
      const chat = await api(`/chats/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text }),
      })
      setMessages(chat.messages)
      refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new" onClick={newChat}>+ New chat</button>
        <ul>
          {chats.map((c) => (
            <li key={c.id} className={c.id === activeId ? 'active' : ''} onClick={() => loadChat(c.id)}>
              <span>{c.title}</span>
              <button
                title="Delete"
                onClick={(e) => { e.stopPropagation(); deleteChat(c.id) }}
              >×</button>
            </li>
          ))}
        </ul>
      </aside>
      <main className="chat">
        <div className="messages">
          {messages.length === 0 && <p className="empty">Start a conversation…</p>}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>{m.content}</div>
          ))}
          {loading && <div className="msg assistant">…</div>}
          {error && <div className="error">{error}</div>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={send}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message" autoFocus />
          <button disabled={loading || !input.trim()}>Send</button>
        </form>
      </main>
    </div>
  )
}
