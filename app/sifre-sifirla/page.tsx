'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SifreSifirlaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`,
    })

    if (err) setError('Bir hata oluştu. Lütfen tekrar deneyin.')
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
        <div style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Şifre Sıfırlama Linki Gönderildi</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>{email} adresine şifre sıfırlama bağlantısı gönderdik. Lütfen e-postanı kontrol et.</p>
          <Link href="/giris" style={{ color: '#4f7dff', fontSize: 14, fontWeight: 600 }}>Giriş sayfasına dön</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4ff' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ fontSize: 24, fontWeight: 800, color: '#4f7dff', fontFamily: 'Syne, sans-serif', textDecoration: 'none' }}>trevo</Link>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', marginTop: 16, marginBottom: 4 }}>Şifreni Sıfırla</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>E-posta adresini gir, sana sıfırlama linki gönderelim.</p>
        </div>

        <form onSubmit={handleReset} style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8edf8', padding: 32 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#64748b', marginBottom: 6 }}>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
              placeholder="sen@sirket.com" />
          </div>
          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #4f7dff, #6a96ff)', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#64748b' }}>
          <Link href="/giris" style={{ color: '#4f7dff', fontWeight: 500 }}>Giriş sayfasına dön</Link>
        </p>
      </div>
    </div>
  )
}
