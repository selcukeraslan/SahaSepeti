/** Supabase yapılandırması eksik olduğunda beyaz ekran yerine gösterilir. */
export function ConfigError({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
        background: '#f8fafc',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: 28,
          boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>⚙️ Yapılandırma gerekli</h1>
        <p style={{ marginTop: 12, color: '#475569', lineHeight: 1.6 }}>{message}</p>
        <pre
          style={{
            marginTop: 16,
            background: '#0f172a',
            color: '#e2e8f0',
            padding: 16,
            borderRadius: 10,
            fontSize: 13,
            overflowX: 'auto',
          }}
        >
          {`# .env\nVITE_SUPABASE_URL=https://xxxx.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
        </pre>
        <p style={{ marginTop: 12, color: '#94a3b8', fontSize: 13 }}>
          Supabase → Project Settings → API. Değerleri girdikten sonra{' '}
          <code>npm run dev</code> komutunu yeniden başlatın.
        </p>
      </div>
    </div>
  )
}
