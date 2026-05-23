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

type RegKey = {
  id: string
  email: string
  role: string
  used_at: string | null
  expires_at: string
  created_at: string
}

export default function EkipPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ email: '', role: 'member' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  // Key management
  const [keys, setKeys] = useState<RegKey[]>([])
  const [keyModal, setKeyModal] = useState(false)
  const [keyForm, setKeyForm] = useState({ email: '', role: 'member' })
  const [generatedKey, setGeneratedKey] = useState('')
  const [userRole, setUserRole] = useState('')

  const supabase = useMemo(() => createClient(), [])

  const fetchData = async () => {
    try {
      const [membersRes, keysRes] = await Promise.all([
        fetch('/api/tenant/members'),
        fetch('/api/tenant/registration-keys'),
      ])
      if (membersRes.ok) {
        const json = await membersRes.json()
        setMembers(json.members || [])
        setInvitations(json.invitations || [])
        setUserRole(json.userRole || '')
      }
      if (keysRes.ok) {
        const json = await keysRes.json()
        setKeys(Array.isArray(json) ? json : [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

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
        setMsg('Davet gönderildi!')
        setTimeout(() => setMsg(''), 3000)
        fetchData()
      } else {
        setMsg(data.error || 'Hata oluştu')
        setTimeout(() => setMsg(''), 4000)
      }
    } catch {
      setMsg('Sunucu hatası, tekrar deneyin')
      setTimeout(() => setMsg(''), 4000)
    }
    setSaving(false)
  }

  const handleRemove = async (memberId: string) => {
    if (!confirm('Bu üyeyi çıkarmak istediğine emin misin?')) return
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

  const handleGenerateKey = async () => {
    if (!keyForm.email) return
    setSaving(true)
    setMsg('')
    try {
      const res = await fetch('/api/tenant/registration-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(keyForm),
      })
      const data = await res.json()
      if (res.ok) {
        setGeneratedKey(data.key)
        setKeyForm({ email: '', role: 'member' })
        fetchData()
      } else {
        setMsg(data.error || 'Key olusturulamadi')
        setTimeout(() => setMsg(''), 4000)
      }
    } catch {
      setMsg('Sunucu hatasi')
      setTimeout(() => setMsg(''), 4000)
    }
    setSaving(false)
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Bu anahtari iptal etmek istediginize emin misiniz?')) return
    await fetch(`/api/tenant/registration-keys/${keyId}`, { method: 'DELETE' })
    fetchData()
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMsg('Anahtar kopyalandi!')
    setTimeout(() => setMsg(''), 2000)
  }

  const roleLabel = (r: string) => {
    const map: Record<string, string> = { owner: 'Sahip', admin: 'Yönetici', member: 'Üye', viewer: 'Görüntüleyici' }
    return map[r] || r
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>Ekip</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>Çalışanlarını davet et, birlikte yönetin</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm font-medium" style={{ color: msg.includes('Hata') || msg.includes('hatasi') ? '#ef4444' : '#10b981' }}>{msg}</span>}
          {userRole === 'owner' || userRole === 'admin' ? (
            <button onClick={() => setModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--brand-primary, var(--brand-primary, #4f7dff)), var(--brand-primary-hover, var(--brand-primary-hover, #6a96ff)))', boxShadow: '0 2px 8px rgba(79,125,255,0.3)' }}>
              + Üye Davet Et
            </button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16" style={{ color: '#94a3b8', fontSize: 14 }}>Yükleniyor...</div>
      ) : (
        <div className="space-y-6">
          {/* Members */}
          <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8edf8' }}>
              <h2 className="font-semibold" style={{ fontSize: 15, color: '#0f172a' }}>Aktif Üyeler ({members.length})</h2>
            </div>
            {members.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#94a3b8', fontSize: 14 }}>Henüz üye yok</div>
            ) : (
              <table className="w-full">
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
                  <tr>
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Üye</th>
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
                            {(m.email || 'Ü')[0].toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{m.email || '—'}</span>
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
                          <button onClick={() => handleRemove(m.id)} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Çıkar</button>
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
                    <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gönderim</th>
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
                        <button onClick={() => handleCancelInvite(inv.id)} style={{ fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>İptal</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Registration Keys */}
      {userRole === 'owner' && (
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#fff', borderColor: '#e8edf8' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e8edf8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 className="font-semibold" style={{ fontSize: 15, color: '#0f172a' }}>Kayıt Anahtarları ({keys.filter(k => !k.used_at).length})</h2>
            <button onClick={() => { setGeneratedKey(''); setKeyModal(true) }} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
              + Key Üret
            </button>
          </div>
          {keys.length === 0 ? (
            <div className="text-center py-8" style={{ color: '#94a3b8', fontSize: 14 }}>
              Henüz kayıt anahtarı yok. Yeni ekip üyeleri için anahtar üretin.
            </div>
          ) : (
            <table className="w-full">
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e8edf8' }}>
                <tr>
                  <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>E-posta</th>
                  <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rol</th>
                  <th style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Durum</th>
                  <th style={{ padding: '10px 24px' }}></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 500, fontSize: 14, color: '#0f172a' }}>{k.email}</td>
                    <td style={{ padding: '14px 24px', fontSize: 13, color: '#64748b' }}>{roleLabel(k.role)}</td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, background: k.used_at ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', color: k.used_at ? '#10b981' : '#f59e0b' }}>
                        {k.used_at ? 'Kullanıldı' : 'Bekliyor'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      {!k.used_at && (
                        <button onClick={() => handleDeleteKey(k.id)} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>İptal</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {modal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Üye Davet Et</h2>
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
                  <option value="admin">Yönetici</option>
                  <option value="member">Üye</option>
                  <option value="viewer">Görüntüleyici</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: '#f1f5f9', color: '#64748b' }}>İptal</button>
              <button onClick={handleInvite} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
                {saving ? 'Gönderiliyor...' : 'Davet Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Generate Modal */}
      {keyModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#0f172a' }}>Kayıt Anahtarı Üret</h2>

            {generatedKey ? (
              <div className="space-y-3">
                <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
                  Anahtar oluşturuldu. Bu anahtarı ekip üyesine verin. Tek kullanımlıktır.
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="text-xs text-gray-500 mb-1">Kayıt Anahtarı</div>
                  <div className="text-lg font-mono font-bold text-gray-900 break-all select-all">{generatedKey}</div>
                </div>
                <button onClick={() => copyToClipboard(generatedKey)} className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
                  Kopyala
                </button>
                <button onClick={() => { setKeyModal(false); setGeneratedKey('') }} className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: '#f1f5f9', color: '#64748b' }}>
                  Kapat
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Ekip üyesinin e-postası *</label>
                  <input type="email" value={keyForm.email} onChange={(e) => setKeyForm({ ...keyForm, email: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', color: '#0f172a', '--tw-ring-color': 'var(--brand-primary, #4f7dff)' } as React.CSSProperties}
                    placeholder="calisan@ajans.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748b' }}>Rol</label>
                  <select value={keyForm.role} onChange={(e) => setKeyForm({ ...keyForm, role: e.target.value })}
                    className="w-full rounded-xl px-4 py-2.5 text-sm border focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', color: '#0f172a' }}>
                    <option value="admin">Yönetici</option>
                    <option value="member">Üye</option>
                    <option value="viewer">Görüntüleyici</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setKeyModal(false); setGeneratedKey('') }} className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors" style={{ background: '#f1f5f9', color: '#64748b' }}>İptal</button>
                  <button onClick={handleGenerateKey} disabled={saving || !keyForm.email} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--brand-primary, #4f7dff), var(--brand-primary-hover, #6a96ff))' }}>
                    {saving ? 'Üretiliyor...' : 'Anahtar Üret'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
