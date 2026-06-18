/**
 * Kuroten Stay Sapporo — 認証ミドルウェア
 * Cloudflare Workers + Hono JWT
 */
import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'

// ============================================================
// JWT ペイロード型
// ============================================================
export type JwtPayload = {
  sub:   string          // userId
  email: string
  role:  'guest' | 'owner'
  iat:   number
  exp:   number
}

// ============================================================
// Bindings 型（wrangler.jsonc のバインディング）
// ============================================================
export type Env = {
  DB:              D1Database
  JWT_SECRET:      string
  REFRESH_SECRET:  string
  ALLOWED_ORIGIN:  string
}

// ============================================================
// 認証ミドルウェア（必須）
// ============================================================
export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }

  const token = authHeader.slice(7)
  const secret = c.env.JWT_SECRET

  if (!secret) {
    return c.json({ error: 'サーバー設定エラー: JWT_SECRETが未設定です' }, 500)
  }

  try {
    const payload = await verify(token, secret) as JwtPayload
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'トークンが無効または期限切れです' }, 401)
  }
}

// ============================================================
// オーナー専用ミドルウェア（authMiddleware を内包）
// ============================================================
export async function ownerMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }

  const token = authHeader.slice(7)
  const secret = c.env.JWT_SECRET

  if (!secret) {
    return c.json({ error: 'サーバー設定エラー: JWT_SECRETが未設定です' }, 500)
  }

  try {
    const payload = await verify(token, secret) as JwtPayload
    if (payload.role !== 'owner') {
      return c.json({ error: 'オーナー権限が必要です' }, 403)
    }
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'トークンが無効または期限切れです' }, 401)
  }
}
