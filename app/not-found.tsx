import Link from 'next/link'

// Legacy-URL redirect for the brand rename:
//   /maestro/*    → /ui/*
//   /lakerunner/* → /data-lake/*
// Inlined so it runs before React hydrates and users don't see a 404 flash
// before the redirect kicks in.
const REDIRECT_SCRIPT = `
(function () {
  var p = window.location.pathname;
  var q = window.location.search + window.location.hash;
  if (p === '/maestro' || p.indexOf('/maestro/') === 0) {
    window.location.replace(p.replace(/^\\/maestro/, '/ui') + q);
    return;
  }
  if (p === '/lakerunner' || p.indexOf('/lakerunner/') === 0) {
    window.location.replace(p.replace(/^\\/lakerunner/, '/data-lake') + q);
  }
})();
`

export default function NotFound() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: REDIRECT_SCRIPT }} />
      <div style={{ padding: '4rem 2rem', textAlign: 'center', maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Page not found</h1>
        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
          This page doesn&apos;t exist or has moved.
        </p>
        <p>
          <Link href="/">← Back to home</Link>
        </p>
      </div>
    </>
  )
}
