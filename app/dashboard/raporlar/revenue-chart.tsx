'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Bucket = { label: string; month: number; year: number; total: number }

const formatTRY = (v: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v)

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Bucket }> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        background: '#0f172a',
        color: '#fff',
        borderRadius: '8px',
        padding: '10px 14px',
        fontSize: '13px',
        fontFamily: 'var(--font-display), Plus Jakarta Sans, sans-serif',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        border: 'none',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{d.label} {d.year}</div>
      <div style={{ color: '#7aa0ff' }}>{formatTRY(d.total)}</div>
    </div>
  )
}

export default function RevenueChart({ data }: { data: Bucket[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8edf8" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'var(--font-body), Inter, sans-serif' }}
          axisLine={{ stroke: '#e8edf8' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={(v: number) => formatTRY(v)}
          tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'var(--font-body), Inter, sans-serif' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,125,255,0.06)' }} />
        <Bar dataKey="total" radius={[6, 6, 6, 6]} barSize={32}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.total > 0 ? '#4f7dff' : '#e8edf8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
