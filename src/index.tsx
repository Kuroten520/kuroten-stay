import { Hono } from 'hono'

const app = new Hono()

// API routes (placeholder for future backend integration)
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'Kuroten Stay Sapporo' })
})

// API: Contact form submission (mock response)
app.post('/api/contact', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  console.log('[Contact Form]', body)
  return c.json({ success: true, message: 'お問い合わせを受け付けました。担当者よりご連絡いたします。' })
})

// Note: Static files (index.html, admin.html, /static/*) are served by
// Cloudflare Pages directly from the dist/ directory.
// The _routes.json ensures only /api/* routes go through this Worker.

export default app
