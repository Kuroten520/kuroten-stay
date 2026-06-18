import { Hono } from 'hono'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Serve static CSS/JS files
app.use('/static/*', serveStatic({ root: './' }))

// Serve index.html for all routes (SPA pattern)
app.get('/', serveStatic({ path: './index.html' }))
app.get('/*', serveStatic({ root: './' }))

export default app
