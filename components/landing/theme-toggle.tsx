'use client'

import { useEffect } from 'react'

export default function ThemeToggle() {
  useEffect(() => {
    const saved = localStorage.getItem('trevo-theme')
    if (saved === 'light') document.body.classList.add('light')
  }, [])

  function toggle() {
    const isLight = document.body.classList.contains('light')
    if (isLight) {
      document.body.classList.remove('light')
      localStorage.setItem('trevo-theme', 'dark')
    } else {
      document.body.classList.add('light')
      localStorage.setItem('trevo-theme', 'light')
    }
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label="Tema değiştir"
      title="Gece / Gündüz"
    >
      <div className="knob">
        {/* Moon */}
        <svg className="icon-moon" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M8.5 6A4 4 0 0 1 4 1.5a4 4 0 1 0 4.5 4.5z" fill="white" />
        </svg>
        {/* Sun */}
        <svg className="icon-sun" width="10" height="10" viewBox="0 0 10 10" fill="none">
          <circle cx="5" cy="5" r="2" fill="white" />
          <line x1="5" y1="0.5" x2="5" y2="2" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="5" y1="8" x2="5" y2="9.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="0.5" y1="5" x2="2" y2="5" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="8" y1="5" x2="9.5" y2="5" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="1.8" y1="1.8" x2="2.8" y2="2.8" stroke="white" strokeWidth="1" strokeLinecap="round" />
          <line x1="7.2" y1="7.2" x2="8.2" y2="8.2" stroke="white" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  )
}
