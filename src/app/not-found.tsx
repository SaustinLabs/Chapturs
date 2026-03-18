export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}>
          <path d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
          Page Not Found
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          We couldn&apos;t find the page you were looking for.
        </p>
        <a href="/" style={{ display: 'inline-block', padding: '0.5rem 1rem', background: '#2563eb', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.875rem' }}>
          Return Home
        </a>
      </div>
    </div>
  )
}
