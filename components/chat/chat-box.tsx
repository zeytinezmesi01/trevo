'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Message = {
  id: string
  sender_id: string
  sender_name: string
  message: string
  created_at: string
}

interface Props {
  tenantId: string
  userId: string
  userName: string
}

export default function ChatBox({ tenantId, userId, userName }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const nameCache = useRef(new Map<string, string>())
  const supabase = createClient()

  // Mesajlari yukle
  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/tenant/chat')
      if (res.ok) {
        const data = await res.json()
        setMessages(Array.isArray(data) ? data : [])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('chat-' + tenantId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          // Kendi mesajimizi tekrar ekleme (POST zaten ekledi)
          if (newMsg.sender_id === userId) return
          // Gonderen ismini cek (once cache'e bak)
          let senderName = nameCache.current.get(newMsg.sender_id)
          if (!senderName) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', newMsg.sender_id)
              .maybeSingle()
            senderName = profile?.full_name || 'Bilinmiyor'
            nameCache.current.set(newMsg.sender_id, senderName)
          }
          setMessages((prev) => [
            ...prev,
            {
              ...newMsg,
              sender_name: senderName,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenantId, userId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    setSending(true)
    setInput('')

    // Optimistik ekle
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: userId,
        sender_name: userName,
        message: text,
        created_at: new Date().toISOString(),
      },
    ])

    const res = await fetch('/api/tenant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    }).catch(() => null)

    if (!res || !res.ok) {
      // Basarisiz olursa temp mesaji cikar
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    }

    setSending(false)
  }

  const formatTime = (d: string) => {
    return new Date(d).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '380px' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #e8edf8',
        background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))',
        borderRadius: '12px 12px 0 0',
      }}>
        <span style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>Ekip Sohbeti</span>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
        background: '#f8fafc',
      }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 20 }}>Yükleniyor...</div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, padding: 20 }}>
            Henüz mesaj yok. İlk mesajı sen gönder!
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === userId
            return (
              <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                <div style={{ maxWidth: '85%' }}>
                  {!isMine && (
                    <div style={{ fontSize: 10, color: '#64748b', marginBottom: 2, fontWeight: 600 }}>
                      {m.sender_name}
                    </div>
                  )}
                  <div style={{
                    padding: '8px 12px', borderRadius: isMine ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    background: isMine ? 'var(--brand-primary, #4f7dff)' : '#ffffff',
                    color: isMine ? '#fff' : '#0f172a',
                    fontSize: 12.5, lineHeight: 1.4,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    wordBreak: 'break-word',
                  }}>
                    {m.message}
                  </div>
                  <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: isMine ? 'right' : 'left' }}>
                    {formatTime(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid #e8edf8', background: '#fff', borderRadius: '0 0 12px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !sending) handleSend() }}
            placeholder="Mesajınızı yazın..."
            style={{
              flex: 1, border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '8px 12px', fontSize: 12.5, outline: 'none',
              background: '#f8fafc',
            }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{
              border: 'none', borderRadius: 8, padding: '8px 14px',
              background: 'var(--brand-primary, #4f7dff)',
              color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            {sending ? '...' : 'Gönder'}
          </button>
        </div>
      </div>
    </div>
  )
}
