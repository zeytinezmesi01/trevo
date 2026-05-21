export default function DashboardLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ height: 32, width: 200, borderRadius: 8, background: '#e2e8f0', animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 16, width: 300, borderRadius: 8, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ height: 140, borderRadius: 16, background: '#fff', border: '1px solid #e8edf8', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div style={{ height: 300, borderRadius: 16, background: '#fff', border: '1px solid #e8edf8', animation: 'pulse 1.5s infinite' }} />
        <div style={{ height: 300, borderRadius: 16, background: '#fff', border: '1px solid #e8edf8', animation: 'pulse 1.5s infinite' }} />
      </div>
    </div>
  )
}
