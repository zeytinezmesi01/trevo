'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ChatBox from './chat-box'

interface Props {
  tenantId: string
  userId: string
  userName: string
}

export default function ChatWidget({ tenantId, userId, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const supabase = createClient()

  // Yeni mesajlari dinle (widget acik degilken badge goster)
  useEffect(() => {
    const channel = supabase
      .channel('chat-widget-' + tenantId)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `tenant_id=eq.${tenantId}` },
        (payload) => {
          const newMsg = payload.new as { sender_id: string }
          if (newMsg.sender_id !== userId) {
            setUnread((prev) => prev + 1)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, userId])

  const handleToggle = () => {
    if (!open) setUnread(0)
    setOpen(!open)
  }

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      {/* Chat penceresi */}
      {open && (
        <div style={{
          width: 340, marginBottom: 12,
          background: '#fff', borderRadius: 14,
          boxShadow: '0 10px 40px rgba(0,0,0,0.15), 0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #e8edf8', overflow: 'hidden',
        }}>
          <ChatBox tenantId={tenantId} userId={userId} userName={userName} />
        </div>
      )}

      {/* Floating buton */}
      <button
        onClick={handleToggle}
        style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))',
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(79,125,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', marginLeft: 'auto',
        }}
      >
        {open ? (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        {unread > 0 && !open && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#ef4444', color: '#fff',
            width: 20, height: 20, borderRadius: '50%',
            fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid white',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  )
}
