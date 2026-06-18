import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS (開発環境向け)
app.use('/api/*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// ============================================================
// ユーティリティ: UTF-8対応 Base64 エンコード/デコード
// btoa() は Latin1 のみ対応のため、日本語を含む場合は変換が必要
// ============================================================
function encodeToken(payload: object): string {
  const json = JSON.stringify(payload)
  // UTF-8 → Uint8Array → Base64
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary)
}

function decodeToken(token: string): any {
  try {
    const binary = atob(token)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json)
  } catch {
    return null
  }
}

// ============================================================
// ヘルスチェック
// ============================================================
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', service: 'Kuroten Stay Sapporo', timestamp: new Date().toISOString() })
})

// ============================================================
// 認証 API
// ============================================================

// ログイン
app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { email, password } = body

  // オーナーアカウント（デモ用）
  const OWNERS = [
    { email: 'owner@kuroten-stay.com', password: 'kuroten2024', id: 'owner-1', firstName: 'オーナー', lastName: '', role: 'owner' },
    { email: 'admin@kuroten-stay.com', password: 'admin1234',   id: 'owner-2', firstName: '管理者',  lastName: '', role: 'owner' },
  ]

  const owner = OWNERS.find(o => o.email === email && o.password === password)
  if (owner) {
    const { password: _, ...user } = owner
    const accessToken = encodeToken({ ...user, exp: Date.now() + 86400000 })
    return c.json({ accessToken, user })
  }

  // ゲストはメール+パスワード長で簡易認証（デモ）
  if (email && password && password.length >= 6) {
    const user = { id: `guest-${Date.now()}`, email, firstName: email.split('@')[0], lastName: '', role: 'guest' }
    const accessToken = encodeToken({ ...user, exp: Date.now() + 86400000 })
    return c.json({ accessToken, user })
  }

  return c.json({ error: 'メールアドレスまたはパスワードが正しくありません' }, 401)
})

// 新規登録
app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { email, password, firstName, lastName, phone, nationality } = body

  if (!email || !password || !firstName) {
    return c.json({ error: '必須項目が入力されていません' }, 400)
  }
  if (password.length < 8) {
    return c.json({ error: 'パスワードは8文字以上で入力してください' }, 400)
  }

  const user = {
    id: `guest-${Date.now()}`,
    email,
    firstName,
    lastName: lastName || '',
    phone: phone || '',
    nationality: nationality || '',
    role: 'guest',
  }
  const accessToken = encodeToken({ ...user, exp: Date.now() + 86400000 })
  return c.json({ accessToken, user }, 201)
})

// ログアウト
app.post('/api/auth/logout', (c) => {
  return c.json({ success: true })
})

// トークンリフレッシュ（デモ）
app.post('/api/auth/refresh', (c) => {
  return c.json({ error: 'リフレッシュトークンが無効です' }, 401)
})

// 自分のプロフィール取得
app.get('/api/auth/me', (c) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: '認証が必要です' }, 401)
  try {
    const payload = decodeToken(auth.replace('Bearer ', ''))
    if (!payload) return c.json({ error: '無効なトークンです' }, 401)
    if (payload.exp < Date.now()) return c.json({ error: 'トークンが期限切れです' }, 401)
    return c.json(payload)
  } catch {
    return c.json({ error: '無効なトークンです' }, 401)
  }
})

// プロフィール更新
app.put('/api/auth/me', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  return c.json({ success: true, ...body })
})

// ============================================================
// 物件 API
// ============================================================
const PROPERTIES = [
  {
    id: 'sun', slug: 'sun', name: 'THE SUN',
    capacity: 12, bedrooms: 4, beds: 6, bathrooms: 2,
    address: '北海道札幌市豊平区美園',
    checkin: '15:00', checkout: '10:00',
    parking: '車庫付き1台（車高制限2550mm以下）',
    airhostUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/sun',
  },
  {
    id: 'moon', slug: 'moon', name: 'THE MOON',
    capacity: 12, bedrooms: 4, beds: 6, bathrooms: 2,
    address: '北海道札幌市豊平区美園',
    checkin: '15:00', checkout: '10:00',
    parking: '屋根付き無料駐車場2台（車高制限2550mm以下）',
    airhostUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/moon',
  },
  {
    id: 'smile', slug: 'smile', name: 'THE SMILE',
    capacity: 10, bedrooms: 4, beds: 7, bathrooms: 2,
    address: '北海道札幌市東区',
    checkin: '15:00', checkout: '10:00',
    parking: '屋根付き無料駐車場2台（車高制限2200mm以下）',
    airhostUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/smile',
  },
  {
    id: 'sky', slug: 'sky', name: 'THE SKY',
    capacity: 6, bedrooms: 2, beds: 3, bathrooms: 1,
    address: '北海道札幌市中央区南2条西10丁目',
    checkin: '15:00', checkout: '10:00',
    parking: 'なし',
    airhostUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/sky',
  },
]

app.get('/api/properties', (c) => {
  return c.json({ properties: PROPERTIES })
})

app.get('/api/properties/:id', (c) => {
  const id = c.req.param('id')
  const property = PROPERTIES.find(p => p.id === id || p.slug === id)
  if (!property) return c.json({ error: '物件が見つかりません' }, 404)
  return c.json(property)
})

app.get('/api/properties/:id/availability', (c) => {
  const id = c.req.param('id')
  const property = PROPERTIES.find(p => p.id === id || p.slug === id)
  if (!property) return c.json({ error: '物件が見つかりません' }, 404)
  // デモ: 常に空き有り
  return c.json({ available: true, blockedDates: [], propertyId: id })
})

// ============================================================
// 問い合わせ API
// ============================================================
app.post('/api/contacts', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { name, email, message } = body

  if (!name || !email || !message) {
    return c.json({ error: '必須項目が入力されていません（name, email, message）' }, 400)
  }

  console.log('[Contact]', { name, email, subject: body.subject, propertySlug: body.propertySlug })
  return c.json({
    success: true,
    message: 'お問い合わせを受け付けました。担当者よりご連絡いたします。',
    id: `CQ-${Date.now()}`,
  }, 201)
})

// 旧エンドポイント（後方互換）
app.post('/api/contact', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  console.log('[Contact Legacy]', body)
  return c.json({ success: true, message: 'お問い合わせを受け付けました。担当者よりご連絡いたします。' })
})

// ============================================================
// 予約 API（ゲスト）
// ============================================================
app.get('/api/bookings', (c) => {
  // デモ: 空の予約一覧
  return c.json({ bookings: [] })
})

app.get('/api/bookings/:id', (c) => {
  return c.json({ error: '予約が見つかりません' }, 404)
})

app.post('/api/bookings', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { propertyId, checkinDate, checkoutDate, guestCount } = body

  if (!propertyId || !checkinDate || !checkoutDate || !guestCount) {
    return c.json({ error: '必須項目が入力されていません' }, 400)
  }

  const booking = {
    id: `BK-${Date.now()}`,
    propertyId,
    checkinDate,
    checkoutDate,
    guestCount,
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
  return c.json({ booking }, 201)
})

app.delete('/api/bookings/:id', (c) => {
  return c.json({ success: true, message: 'キャンセルしました' })
})

// ============================================================
// 管理者 API（オーナー専用）
// ============================================================

// 認証ミドルウェア（簡易）
const requireOwner = async (c: any, next: any) => {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) return c.json({ error: '認証が必要です' }, 401)
  try {
    const payload = decodeToken(auth.replace('Bearer ', ''))
    if (!payload) return c.json({ error: '無効なトークンです' }, 401)
    if (payload.exp < Date.now()) return c.json({ error: 'トークンが期限切れです' }, 401)
    if (payload.role !== 'owner') return c.json({ error: '権限がありません' }, 403)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: '無効なトークンです' }, 401)
  }
}

// ダッシュボード統計
app.get('/api/admin/stats', requireOwner, (c) => {
  return c.json({
    totalBookings: 128,
    monthlyRevenue: 1250000,
    occupancyRate: 78,
    totalInquiries: 34,
    recentBookings: [
      { id: 'BK001', property: 'THE SUN',   guest: '山田 太郎', checkin: '2026-06-20', checkout: '2026-06-23', guests: 8,  status: 'confirmed', amount: 96000  },
      { id: 'BK002', property: 'THE MOON',  guest: '佐藤 花子', checkin: '2026-06-22', checkout: '2026-06-24', guests: 4,  status: 'pending',   amount: 48000  },
      { id: 'BK003', property: 'THE SMILE', guest: '田中 一郎', checkin: '2026-06-25', checkout: '2026-06-28', guests: 6,  status: 'confirmed', amount: 72000  },
      { id: 'BK004', property: 'THE SKY',   guest: 'John Smith', checkin: '2026-06-28', checkout: '2026-07-01', guests: 4, status: 'confirmed', amount: 52000  },
      { id: 'BK005', property: 'THE SUN',   guest: '鈴木 美咲', checkin: '2026-07-01', checkout: '2026-07-04', guests: 5,  status: 'pending',   amount: 60000  },
    ],
    monthlyData: [
      { month: '1月', revenue: 820000,  bookings: 22 },
      { month: '2月', revenue: 950000,  bookings: 26 },
      { month: '3月', revenue: 1100000, bookings: 31 },
      { month: '4月', revenue: 880000,  bookings: 24 },
      { month: '5月', revenue: 1200000, bookings: 34 },
      { month: '6月', revenue: 1250000, bookings: 35 },
    ],
    propertyOccupancy: [
      { property: 'THE SUN',   rate: 85 },
      { property: 'THE MOON',  rate: 72 },
      { property: 'THE SMILE', rate: 68 },
      { property: 'THE SKY',   rate: 80 },
    ],
  })
})

// 予約一覧（管理者）
app.get('/api/admin/bookings', requireOwner, (c) => {
  return c.json({
    total: 5,
    data: [
      { id: 'BK001', property: 'THE SUN',   guest: '山田 太郎', email: 'yamada@example.com', phone: '090-1234-5678', checkin: '2026-06-20', checkout: '2026-06-23', guests: 8,  status: 'confirmed', amount: 96000,  createdAt: '2026-06-01' },
      { id: 'BK002', property: 'THE MOON',  guest: '佐藤 花子', email: 'sato@example.com',   phone: '090-2345-6789', checkin: '2026-06-22', checkout: '2026-06-24', guests: 4,  status: 'pending',   amount: 48000,  createdAt: '2026-06-02' },
      { id: 'BK003', property: 'THE SMILE', guest: '田中 一郎', email: 'tanaka@example.com', phone: '090-3456-7890', checkin: '2026-06-25', checkout: '2026-06-28', guests: 6,  status: 'confirmed', amount: 72000,  createdAt: '2026-06-03' },
      { id: 'BK004', property: 'THE SKY',   guest: 'John Smith',  email: 'john@example.com',  phone: '',              checkin: '2026-06-28', checkout: '2026-07-01', guests: 4,  status: 'confirmed', amount: 52000,  createdAt: '2026-06-04' },
      { id: 'BK005', property: 'THE SUN',   guest: '鈴木 美咲', email: 'suzuki@example.com', phone: '090-5678-9012', checkin: '2026-07-01', checkout: '2026-07-04', guests: 5,  status: 'cancelled', amount: 60000,  createdAt: '2026-06-05' },
    ],
  })
})

// 予約ステータス更新
app.put('/api/admin/bookings/:id/status', requireOwner, async (c) => {
  const id = c.req.param('id')
  const { status } = await c.req.json().catch(() => ({}))
  return c.json({ success: true, bookingId: id, status })
})

// 問い合わせ一覧（管理者）
app.get('/api/admin/contacts', requireOwner, (c) => {
  return c.json({
    total: 3,
    data: [
      { id: 'CQ001', name: '伊藤 太郎',  email: 'ito@example.com',  phone: '011-123-4567', property: 'THE SUN',   checkin: '2026-07-10', checkout: '2026-07-14', guests: 8, message: 'BBQセットの貸し出しはできますか？',         status: 'unread',  createdAt: '2026-06-10' },
      { id: 'CQ002', name: 'Wang Li',    email: 'wang@example.com', phone: '',              property: 'THE MOON',  checkin: '2026-08-01', checkout: '2026-08-05', guests: 4, message: '中国語サポートはありますか？',               status: 'replied', createdAt: '2026-06-09' },
      { id: 'CQ003', name: '高橋 花子',  email: 'taka@example.com', phone: '090-9999-8888', property: 'THE SMILE', checkin: '2026-07-20', checkout: '2026-07-22', guests: 6, message: 'ペット同伴は可能でしょうか？',               status: 'read',    createdAt: '2026-06-08' },
    ],
  })
})

// 問い合わせ返信
app.put('/api/admin/contacts/:id/reply', requireOwner, async (c) => {
  const id = c.req.param('id')
  const { reply } = await c.req.json().catch(() => ({}))
  return c.json({ success: true, contactId: id, reply })
})

// ユーザー一覧
app.get('/api/admin/users', requireOwner, (c) => {
  return c.json({
    total: 4,
    data: [
      { id: 'U001', firstName: 'オーナー', lastName: '',   email: 'owner@kuroten-stay.com', role: 'owner', createdAt: '2024-01-01' },
      { id: 'U002', firstName: '管理者',   lastName: '',   email: 'admin@kuroten-stay.com', role: 'owner', createdAt: '2024-01-15' },
      { id: 'U003', firstName: '太郎',     lastName: '山田', email: 'yamada@example.com',   role: 'guest', createdAt: '2026-05-10' },
      { id: 'U004', firstName: '花子',     lastName: '佐藤', email: 'sato@example.com',     role: 'guest', createdAt: '2026-06-01' },
    ],
  })
})

// 物件情報更新
app.put('/api/admin/properties/:id', requireOwner, async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  return c.json({ success: true, propertyId: id, ...body })
})

// ============================================================
// 静的ファイルはCloudflare Pagesが直接サーブ
// _routes.json により /api/* のみ Worker を通過する
// ============================================================

export default app
