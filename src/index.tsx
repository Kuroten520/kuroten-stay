import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static files (CSS, JS, images)
app.use('/static/*', serveStatic({ root: './' }))

// Admin page
app.get('/admin', serveStatic({ path: './admin.html' }))

// Root → index.html
app.get('/', serveStatic({ path: './index.html' }))

// Fallback: serve any HTML files from public directory
app.get('/:file{.+\\.html}', serveStatic({ root: './' }))

// Catch-all → index.html (SPA pattern)
app.get('/*', serveStatic({ path: './index.html' }))

export default app
