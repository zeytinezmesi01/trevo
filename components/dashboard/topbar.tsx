'use client'

export default function DashboardTopbar({ userName }: { userName: string }) {
  const initials = userName.slice(0, 2).toUpperCase() || 'HB'

  return (
    <header
      className="flex items-center justify-between flex-shrink-0"
      style={{
        height: '64px',
        background: 'rgba(240,244,255,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e8edf8',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2"
        style={{
          background: '#ffffff',
          border: '1px solid #e8edf8',
          borderRadius: '10px',
          padding: '0 14px',
          height: '36px',
          width: '260px',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#4f7dff'
          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,125,255,0.1)'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#e8edf8'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <svg style={{ width: '15px', height: '15px', color: '#64748b', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Ara... (müşteri, dosya, hizmet)"
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: '13px', color: '#0f172a', width: '100%',
          }}
        />
        <span
          style={{
            fontSize: '11px', color: '#64748b',
            background: '#f0f4ff', border: '1px solid #e8edf8',
            padding: '1px 6px', borderRadius: '5px', flexShrink: 0,
          }}
        >
          ⌘K
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2.5">
        {/* Notification */}
        <button
          className="flex items-center justify-center transition-all"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid #e8edf8', background: '#ffffff',
            color: '#64748b', cursor: 'pointer', position: 'relative',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4f7dff'
            e.currentTarget.style.color = '#4f7dff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8edf8'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div
            style={{
              position: 'absolute', top: '7px', right: '7px',
              width: '6px', height: '6px',
              background: '#ef4444', borderRadius: '50%',
              border: '1.5px solid white',
            }}
          />
        </button>

        {/* Settings */}
        <button
          className="flex items-center justify-center transition-all"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: '1px solid #e8edf8', background: '#ffffff',
            color: '#64748b', cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#4f7dff'
            e.currentTarget.style.color = '#4f7dff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e8edf8'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M1 12a11 11 0 0 0 11 11 11 11 0 0 0 11-11A11 11 0 0 0 12 1 11 11 0 0 0 1 12" />
          </svg>
        </button>

        {/* Avatar */}
        <div
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f7dff, #7aa0ff)',
            fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
            fontWeight: 700, fontSize: '13px', color: 'white',
            boxShadow: '0 2px 8px rgba(79,125,255,0.3)',
          }}
        >
          {initials}
        </div>
      </div>
    </header>
  )
}
