/**
 * Kuroten Stay Sapporo — 認証ルート
 * POST /api/auth/register  — 新規登録
 * POST /api/auth/login     — ログイン
 * POST /api/auth/refresh   — アクセストークン更新
 * POST /api/auth/logout    — ログアウト
 * GET  /api/auth/me        — プロフィール取得
 * PUT  /api/auth/me        — プロフィール更新
 */
import { Hono }                   from 'hono'
import { sign, verify }           from 'hono/jwt'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { authMiddleware, type JwtPayload, type Env } from '../middleware/auth'
import { queryOne, queryAll, execute, generateUUID, now } from '../db'
import type { User } from '../db/schema'

export const authRoutes = new Hono<{ Bindings: Env }>()

// ============================================================
// インライン JWT 検証ヘルパー（authRoutes 内で使用）
// ============================================================
async function requireAuth(c: any): Promise<JwtPayload | null> {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token  = authHeader.slice(7)
  const secret = c.env?.JWT_SECRET
  if (!secret) return null
  try {
    return await verify(token, secret, 'HS256') as JwtPayload
  } catch {
    return null
  }
}

// ---- 定数 ----
const ACCESS_TOKEN_TTL  = 60 * 15           // 15分（秒）
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30 // 30日（秒）

// ============================================================
// パスワードハッシュ（Web Crypto API — CF Workers対応）
// ============================================================
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  // ソルト生成（16バイトランダム）
  const saltBytes = crypto.getRandomValues(new Uint8Array(16))
  const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  // PBKDF2でハッシュ
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 },
    keyMaterial,
    256
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return `pbkdf2:${salt}:${hash}`
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2:')) {
    // 旧形式（デモデータ: プレーンテキスト比較）
    return password === stored
  }
  const [, salt, storedHash] = stored.split(':')
  const encoder = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hashBuffer = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100000 },
    keyMaterial,
    256
  )
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hash === storedHash
}

// ---- アクセス・リフレッシュトークン生成 ----
async function generateTokens(user: User, env: Env): Promise<{ accessToken: string; refreshToken: string }> {
  const currentTime = Math.floor(Date.now() / 1000)

  const accessToken = await sign(
    {
      sub:   user.id,
      email: user.email,
      role:  user.role,
      iat:   currentTime,
      exp:   currentTime + ACCESS_TOKEN_TTL,
    },
    env.JWT_SECRET,
    'HS256'
  )

  const refreshToken = await sign(
    {
      sub:  user.id,
      type: 'refresh',
      iat:  currentTime,
      exp:  currentTime + REFRESH_TOKEN_TTL,
    },
    env.REFRESH_SECRET,
    'HS256'
  )

  // リフレッシュトークンをDBに保存
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString()
  await execute(env.DB,
    `INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [generateUUID(), user.id, refreshToken, expiresAt, now()]
  )

  return { accessToken, refreshToken }
}

// ============================================================
// POST /api/auth/register — 新規登録
// ============================================================
authRoutes.post('/register', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { email, password, firstName, lastName, phone, nationality } = body

  if (!email || !password) {
    return c.json({ error: 'メールアドレスとパスワードは必須です' }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: 'パスワードは8文字以上で入力してください' }, 400)
  }

  // 既存ユーザーチェック
  const existing = await queryOne<User>(
    c.env.DB,
    'SELECT id FROM users WHERE email = ? LIMIT 1',
    [email]
  )
  if (existing) {
    return c.json({ error: 'このメールアドレスはすでに登録されています' }, 409)
  }

  const hashedPassword = await hashPassword(password)
  const userId = generateUUID()
  const timestamp = now()

  await execute(c.env.DB,
    `INSERT INTO users
       (id, email, password, first_name, last_name, phone, nationality, role, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'guest', 1, ?, ?)`,
    [userId, email, hashedPassword, firstName || null, lastName || null,
     phone || null, nationality || null, timestamp, timestamp]
  )

  return c.json({
    message: '登録が完了しました',
    user: { id: userId, email, firstName: firstName || null, lastName: lastName || null, role: 'guest' }
  }, 201)
})

// ============================================================
// POST /api/auth/login — ログイン
// ============================================================
authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { email, password } = body

  if (!email || !password) {
    return c.json({ error: 'メールアドレスとパスワードを入力してください' }, 400)
  }

  const user = await queryOne<User>(
    c.env.DB,
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  )
  if (!user) {
    return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
  }

  const passwordMatch = await verifyPassword(password, user.password)
  if (!passwordMatch) {
    return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
  }

  // D1はスネークケースで返るため is_active または isActive 両方チェック
  const active = (user as any).is_active ?? user.isActive
  if (!active) {
    return c.json({ error: 'このアカウントは無効化されています' }, 403)
  }

  // 最終ログイン日時を更新
  await execute(c.env.DB,
    'UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?',
    [now(), now(), user.id]
  )

  const { accessToken, refreshToken } = await generateTokens(user, c.env)

  // リフレッシュトークンをHttpOnly Cookieにセット
  setCookie(c, 'refresh_token', refreshToken, {
    httpOnly: true,
    secure:   true,
    sameSite: 'Lax',
    maxAge:   REFRESH_TOKEN_TTL,
    path:     '/',
  })

  return c.json({
    accessToken,
    user: {
      id:        user.id,
      email:     user.email,
      firstName: user.firstName,
      lastName:  user.lastName,
      phone:     user.phone,
      role:      user.role,
    }
  })
})

// ============================================================
// POST /api/auth/refresh — アクセストークン更新
// ============================================================
authRoutes.post('/refresh', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token')
  if (!refreshToken) {
    return c.json({ error: 'リフレッシュトークンがありません' }, 401)
  }

  try {
    const payload = await verify(refreshToken, c.env.REFRESH_SECRET, 'HS256') as any

    // DBで有効なトークンか確認
    const stored = await queryOne<{ id: string; user_id: string; expires_at: string }>(
      c.env.DB,
      'SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1',
      [refreshToken]
    )
    if (!stored) {
      return c.json({ error: 'リフレッシュトークンが無効です' }, 401)
    }
    if (new Date(stored.expires_at) < new Date()) {
      return c.json({ error: 'リフレッシュトークンが期限切れです' }, 401)
    }

    const user = await queryOne<User>(
      c.env.DB,
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [payload.sub]
    )
    const active2 = (user as any).is_active ?? user.isActive
    if (!user || !active2) {
      return c.json({ error: 'ユーザーが見つかりません' }, 401)
    }

    // 古いトークンを削除（ローテーション）
    await execute(c.env.DB,
      'DELETE FROM refresh_tokens WHERE token = ?',
      [refreshToken]
    )

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(user, c.env)

    setCookie(c, 'refresh_token', newRefreshToken, {
      httpOnly: true,
      secure:   true,
      sameSite: 'Lax',
      maxAge:   REFRESH_TOKEN_TTL,
      path:     '/',
    })

    return c.json({ accessToken })
  } catch {
    return c.json({ error: 'トークンが無効です' }, 401)
  }
})

// ============================================================
// POST /api/auth/logout — ログアウト
// ============================================================
authRoutes.post('/logout', async (c) => {
  const refreshToken = getCookie(c, 'refresh_token')

  if (refreshToken) {
    await execute(c.env.DB,
      'DELETE FROM refresh_tokens WHERE token = ?',
      [refreshToken]
    ).catch(() => {})
  }

  deleteCookie(c, 'refresh_token', { path: '/' })
  return c.json({ message: 'ログアウトしました' })
})

// ============================================================
// GET /api/auth/me — 自分のプロフィール取得
// ============================================================
authRoutes.get('/me', async (c) => {
  const payload = await requireAuth(c)
  if (!payload) return c.json({ error: '認証が必要です' }, 401)

  const user = await queryOne<any>(
    c.env.DB,
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [payload.sub]
  )
  if (!user) return c.json({ error: 'ユーザーが見つかりません' }, 404)

  return c.json({
    id:          user.id,
    email:       user.email,
    firstName:   user.first_name ?? user.firstName,
    lastName:    user.last_name  ?? user.lastName,
    phone:       user.phone,
    nationality: user.nationality,
    role:        user.role,
    createdAt:   user.created_at  ?? user.createdAt,
    lastLoginAt: user.last_login_at ?? user.lastLoginAt,
  })
})

// ============================================================
// PUT /api/auth/me — プロフィール更新
// ============================================================
authRoutes.put('/me', async (c) => {
  const payload = await requireAuth(c)
  if (!payload) return c.json({ error: '認証が必要です' }, 401)
  const body    = await c.req.json().catch(() => ({}))
  const { firstName, lastName, phone, nationality } = body

  await execute(c.env.DB,
    `UPDATE users
     SET first_name = COALESCE(?, first_name),
         last_name  = COALESCE(?, last_name),
         phone      = COALESCE(?, phone),
         nationality= COALESCE(?, nationality),
         updated_at = ?
     WHERE id = ?`,
    [firstName ?? null, lastName ?? null, phone ?? null, nationality ?? null, now(), payload.sub]
  )

  const updated = await queryOne<User>(
    c.env.DB,
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [payload.sub]
  )

  return c.json({
    id:          updated!.id,
    email:       updated!.email,
    firstName:   updated!.firstName,
    lastName:    updated!.lastName,
    phone:       updated!.phone,
    nationality: updated!.nationality,
    role:        updated!.role,
  })
})
