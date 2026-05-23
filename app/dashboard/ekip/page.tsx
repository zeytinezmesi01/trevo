'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type Member = {
  id: string
  user_id: string | null
  role: string
  status: string
  joined_at: string | null
  invited_at: string
  email?: string
}

type Invitation = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
}

export default function EkipPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = useMemo(() => createClient(), [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/tenant/members')
      if (res.ok) {
        const json = await res.json()
        setMembers(json.members || [])
        setInvitations(json.invitations || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/tenant/members')
        if (res.ok) {
          const json = await res.json()
          setMembers(json.members || [])
          setInvitations(json.invitations || [])
        }
      } catch {}
      setLoading(false)
    })()
  }, [])

  const handleInvite = async () => {
    if (!form.email) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/tenant/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setForm({ email: '', role: 'member' })
        setModal(false)
        setMsg('Davet gÃ¶nderildi!')
        setTimeout(() => setMsg(''), 3000)
        fetchData()
      } else {
        setMsg(data.error || 'Hata oluÅŸtu')
        setTimeout(() => setMsg(''), 4000)
      }
    } catch {
      setMsg('Sunucu hatasÄ±, tekrar deneyin')
      setTimeout(() => setMsg(''), 4000)
    }
    setSaving(false)
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Bu Ã¼yeyi Ã§Ä±karmak istediÄŸine emin misin?')) return
    await fetch('/api/tenant/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    fetchData()
  }

  const handleCancelInvite = async (inviteId: string) => {
    await supabase.from('team_invitations').update({ status: 'expired' }).eq('id', inviteId)
    fetchData()
  }

  const roleLabel = (r: string) => {
    const map: Record<string, string> = { owner: 'Sahip', admin: 'YÃ¶netici', member: 'Ãœye', viewer: 'GÃ¶rÃ¼ntÃ¼leyici' }
    return map[r] || r
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Ekip</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Ã‡alÄ±ÅŸanlarÄ±nÄ± davet et, birlikte yÃ¶netin</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm font-medium" style={{ color: msg.includes('Hata') ? '#ef4444' : '#10b981' }}>{msg}</span>}
          <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--brand-primary, var(--brand-primary, #4f7dff)), var(--brand-primary-hover, var(--brand-primary-hover, #6a96ff)))', boxShadow: '0 2px 8px rgba(79,125,255,0.3)' }}>
            + Ãœye Davet Et
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8', fontSize: 14 }}>YÃ¼kleniyor...</div>
      ) : (
        <div className="space-y-6">
          {/* Members */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8edf8' }}>
              <h2 className="font-semibold" style={{ fontSize: 15, color: '#0f172a' }}>Aktif Ãœyeler ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#94a3b8', fontSize: 14 }}>HenÃ¼z Ã¼ye yok</div>
            ) : (
              <table className="w-full">
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
                  <tr>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ãœye</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Durum</th>
                    <th style={{ padding: '10px 24px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 24px' }}>
                        <div className="flex items-center gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,125,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: 'var(--brand-primary, #4f7dff)' }}>
                            {(m.email || 'Ãœ')[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{m.email || 'â€”'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748b' }}>{roleLabel(m.role)}</td>
                      <td style={{ padding: '14px 24px' }}>
                        <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: m.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', color: m.status === 'active' ? '#10b981' : '#f59e0b' }}>
                          {m.status === 'active' ? 'Aktif' : 'Bekliyor'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        {m.role !== 'owner' && (
                          <button onClick={() => handleRemove(m.id)} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Ã‡Ä±kar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8edf8' }}>
                <h2 className="font-semibold" style={{ fontSize: 15, color: '#0f172a' }}>Bekleyen Davetler ({invitations.length})</h2>
              </div>
              <table className="w-full">
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
                  <tr>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-posta</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GÃ¶nderim</th>
                    <th style={{ padding: '10px 24px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{inv.email}</td>
                      <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748b' }}>{roleLabel(inv.role)}</td>
                      <td style={{ padding: '14px 24px', fontSize: 13, color: '#94a3b8' }}>{new Date(inv.created_at).toLocaleDateString('tr-TR')}</td>
                      <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                        <button onClick={() => handleCancelInvite(inv.id)} style={{ fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Ä°ptal</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Ãœye Davet Et</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>E-posta *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e2e8f0', color: '#0f172a', '--tw-ring-color': 'var(--brand-primary, #4f7dff)' } as React.CSSProperties}
                  placeholder="calisan@ajans.com" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Rol</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e2e8f0', color: '#0f172a' }}>
                  <option value="admin">YÃ¶netici</option>
                  <option value="member">Ãœye</option>
                  <option value="viewer">GÃ¶rÃ¼ntÃ¼leyici</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: '#f1f5f9', color: '#64748b' }}>Ä°ptal</button>
              <button onClick={handleInvite} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
                {saving ? 'GÃ¶nderiliyor...' : 'Davet GÃ¶nder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
