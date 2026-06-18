/**
 * Kuroten Stay Sapporo — メインエントリーポイント
 * Cloudflare Workers/Pages 対応
 *
 * ルート構成:
 *   /api/auth/*       → authRoutes
 *   /api/properties/* → propertiesRoutes
 *   /api/bookings/*   → bookingsRoutes
 *   /api/contacts     → contactsRoutes
 *   /api/admin/*      → adminRoutes
 *   /api/health       → ヘルスチェック
 *
 * 静的ファイル（HTML/CSS/JS）は Cloudflare Pages が直接配信
 * _routes.json で /api/* のみ Worker を通過させる
 */
import { Hono }              from 'hono'
import { cors }              from 'hono/cors'
import { logger }            from 'hono/logger'
import { authRoutes }        from './routes/auth'
import { propertiesRoutes }  from './routes/properties'
import { bookingsRoutes }    from './routes/bookings'
import { adminRoutes }       from './routes/admin'
import { contactsRoutes }    from './routes/contacts'
import type { Env }          from './middleware/auth'

const app = new Hono<{ Bindings: Env }>()

// ============================================================
// ミドルウェア
// ============================================================
app.use('*', logger())

app.use('/api/*', cors({
  origin: (origin) => {
    // Cloudflare Pages の自動プレビューURL・本番URLを許可
    if (!origin) return '*'
    if (origin.endsWith('.pages.dev')) return origin
    if (origin.includes('localhost'))  return origin
    if (origin.includes('127.0.0.1')) return origin
    if (origin.includes('sandbox.novita.ai')) return origin
    return origin // 柔軟に全許可（本番では絞ること）
  },
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ============================================================
// API ルート
// ============================================================
app.route('/api/auth',       authRoutes)
app.route('/api/properties', propertiesRoutes)
app.route('/api/bookings',   bookingsRoutes)
app.route('/api/admin',      adminRoutes)
app.route('/api/contacts',   contactsRoutes)

// 旧エンドポイント互換（/api/contact → /api/contacts）
app.post('/api/contact', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  console.log('[Contact Legacy]', body)
  return c.json({ success: true, message: 'お問い合わせを受け付けました。' })
})

// ============================================================
// ヘルスチェック
// ============================================================
app.get('/api/health', async (c) => {
  // D1が設定されていれば接続確認
  let dbStatus = 'not_configured'
  if (c.env?.DB) {
    try {
      await c.env.DB.prepare('SELECT 1').first()
      dbStatus = 'connected'
    } catch {
      dbStatus = 'error'
    }
  }

  return c.json({
    status:    'ok',
    service:   'Kuroten Stay Sapporo',
    timestamp: new Date().toISOString(),
    db:        dbStatus,
    runtime:   'cloudflare-workers',
  })
})

// ============================================================
// 静的ファイルはCloudflare Pagesが直接サーブ
// _routes.json により /api/* のみ Worker を通過する
// ============================================================

export default app
