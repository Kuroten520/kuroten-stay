/**
 * Kuroten Stay Sapporo — 管理者ルート（オーナー権限必須）
 * GET /api/admin/stats               — ダッシュボード統計
 * GET /api/admin/bookings            — 全予約一覧
 * PUT /api/admin/bookings/:id/status — 予約ステータス更新
 * GET /api/admin/contacts            — 全問い合わせ一覧
 * PUT /api/admin/contacts/:id/reply  — 問い合わせ返信
 * GET /api/admin/users               — ユーザー一覧
 * PUT /api/admin/properties/:id      — 物件情報更新
 */
import { Hono }           from 'hono'
import { verify }         from 'hono/jwt'
import { type JwtPayload, type Env } from '../middleware/auth'
import { queryOne, queryAll, queryCount, execute, now } from '../db'
import type { Booking, Contact, Property } from '../db/schema'

export const adminRoutes = new Hono<{ Bindings: Env }>()

// 全ルートにオーナー権限を要求（インライン JWT 検証）
adminRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }
  const token  = authHeader.slice(7)
  const secret = c.env?.JWT_SECRET
  if (!secret) return c.json({ error: 'JWT_SECRET未設定' }, 500)
  try {
    const payload = await verify(token, secret, 'HS256') as JwtPayload
    if (payload.role !== 'owner') {
      return c.json({ error: 'オーナー権限が必要です' }, 403)
    }
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'トークンが無効または期限切れです' }, 401)
  }
})

// ============================================================
// GET /api/admin/stats — ダッシュボード統計
// ============================================================
adminRoutes.get('/stats', async (c) => {
  const nowDate = new Date()
  const year  = nowDate.getFullYear()
  const month = nowDate.getMonth() + 1

  // 月の始まり・終わり（SQLite DATE 文字列形式）
  const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay  = new Date(year, month, 0).toISOString().split('T')[0] // 月末

  // 今月の予約数
  const bookingsThisMonth = await queryCount(
    c.env.DB,
    `SELECT COUNT(*) as count FROM bookings
     WHERE checkin_date >= ? AND checkin_date <= ?
       AND status NOT IN ('cancelled', 'no_show')`,
    [firstDay, lastDay]
  )

  // 今月の売上
  const revenueRow = await queryOne<{ total: number | null }>(
    c.env.DB,
    `SELECT SUM(total_price) as total FROM bookings
     WHERE checkin_date >= ? AND checkin_date <= ?
       AND status NOT IN ('cancelled', 'no_show')`,
    [firstDay, lastDay]
  )
  const revenueThisMonth = revenueRow?.total ?? 0

  // 未対応問い合わせ数
  const newContacts = await queryCount(
    c.env.DB,
    "SELECT COUNT(*) as count FROM contacts WHERE status = 'new'"
  )

  // 仮予約数
  const pendingBookings = await queryCount(
    c.env.DB,
    "SELECT COUNT(*) as count FROM bookings WHERE status = 'pending'"
  )

  // チェックイン中ゲスト数
  const today = new Date().toISOString().split('T')[0]
  const currentGuests = await queryCount(
    c.env.DB,
    `SELECT COUNT(*) as count FROM bookings
     WHERE status = 'checked_in'
        OR (status = 'confirmed' AND checkin_date = ?)`,
    [today]
  )

  // 物件別予約数
  const propertyBreakdown = await queryAll<{ slug: string | null; cnt: number }>(
    c.env.DB,
    `SELECT property_slug as slug, COUNT(*) as cnt
     FROM bookings
     WHERE status NOT IN ('cancelled', 'no_show')
     GROUP BY property_slug`
  )

  // 過去6ヶ月の月別予約数（SQLiteはstrftime使用）
  const monthlyBookings = await queryAll<{ month: string; count: number }>(
    c.env.DB,
    `SELECT strftime('%m月', created_at) as month,
            COUNT(*) as count
     FROM bookings
     WHERE created_at >= date('now', '-6 months')
       AND status NOT IN ('cancelled', 'no_show')
     GROUP BY strftime('%Y-%m', created_at)
     ORDER BY strftime('%Y-%m', created_at)`
  )

  return c.json({
    bookingsThisMonth,
    revenueThisMonth,
    newContacts,
    pendingBookings,
    currentGuests,
    propertyBreakdown: propertyBreakdown.map(p => ({
      name:  (p.slug ?? 'OTHER').toUpperCase(),
      count: Number(p.cnt),
    })),
    monthlyBookings: monthlyBookings.map(r => ({
      month: r.month,
      count: Number(r.count),
    })),
  })
})

// ============================================================
// GET /api/admin/bookings — 全予約一覧
// ============================================================
adminRoutes.get('/bookings', async (c) => {
  const { status, propertySlug, page = '1', limit = '50' } = c.req.query()

  const conditions: string[] = []
  const params: unknown[]    = []

  if (status) {
    conditions.push('b.status = ?')
    params.push(status)
  }
  if (propertySlug) {
    conditions.push('b.property_slug = ?')
    params.push(propertySlug)
  }

  const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const offset = (Number(page) - 1) * Number(limit)

  const bookings = await queryAll<Booking>(
    c.env.DB,
    `SELECT b.* FROM bookings b
     ${where}
     ORDER BY b.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  )

  const total = await queryCount(
    c.env.DB,
    `SELECT COUNT(*) as count FROM bookings b ${where}`,
    params
  )

  return c.json({
    bookings: bookings.map(toBookingResponse),
    total,
    page:  Number(page),
    limit: Number(limit),
  })
})

// ============================================================
// PUT /api/admin/bookings/:id/status — 予約ステータス更新
// ============================================================
adminRoutes.put('/bookings/:id/status', async (c) => {
  const id     = c.req.param('id')
  const body   = await c.req.json().catch(() => ({}))
  const { status } = body

  const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']
  if (!validStatuses.includes(status)) {
    return c.json({ error: '無効なステータスです' }, 400)
  }

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM bookings WHERE id = ? LIMIT 1',
    [id]
  )
  if (!existing) return c.json({ error: '予約が見つかりません' }, 404)

  await execute(c.env.DB,
    'UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?',
    [status, now(), id]
  )

  const updated = await queryOne<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE id = ? LIMIT 1',
    [id]
  )

  return c.json(toBookingResponse(updated!))
})

// ============================================================
// GET /api/admin/contacts — 全問い合わせ一覧
// ============================================================
adminRoutes.get('/contacts', async (c) => {
  const { status, page = '1', limit = '50' } = c.req.query()

  const conditions: string[] = []
  const params: unknown[]    = []

  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }

  const where  = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const offset = (Number(page) - 1) * Number(limit)

  const contacts = await queryAll<Contact>(
    c.env.DB,
    `SELECT * FROM contacts ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  )

  const total = await queryCount(
    c.env.DB,
    `SELECT COUNT(*) as count FROM contacts ${where}`,
    params
  )

  return c.json({ contacts: contacts.map(toContactResponse), total })
})

// ============================================================
// PUT /api/admin/contacts/:id/reply — 問い合わせ返信
// ============================================================
adminRoutes.put('/contacts/:id/reply', async (c) => {
  const id   = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))
  const { reply } = body

  if (!reply) return c.json({ error: '返信内容を入力してください' }, 400)

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM contacts WHERE id = ? LIMIT 1',
    [id]
  )
  if (!existing) return c.json({ error: '問い合わせが見つかりません' }, 404)

  const timestamp = now()
  await execute(c.env.DB,
    `UPDATE contacts
     SET reply_message = ?, status = 'resolved', replied_at = ?, updated_at = ?
     WHERE id = ?`,
    [reply, timestamp, timestamp, id]
  )

  const updated = await queryOne<Contact>(
    c.env.DB,
    'SELECT * FROM contacts WHERE id = ? LIMIT 1',
    [id]
  )

  return c.json(toContactResponse(updated!))
})

// ============================================================
// GET /api/admin/users — ユーザー一覧
// ============================================================
adminRoutes.get('/users', async (c) => {
  const { page = '1', limit = '50' } = c.req.query()
  const offset = (Number(page) - 1) * Number(limit)

  const users = await queryAll<{
    id: string; email: string; first_name: string | null; last_name: string | null;
    phone: string | null; role: string; created_at: string; last_login_at: string | null;
  }>(
    c.env.DB,
    `SELECT id, email, first_name, last_name, phone, role, created_at, last_login_at
     FROM users
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [Number(limit), offset]
  )

  const total = await queryCount(c.env.DB, 'SELECT COUNT(*) as count FROM users')

  return c.json({
    users: users.map(u => ({
      id:          u.id,
      email:       u.email,
      firstName:   u.first_name,
      lastName:    u.last_name,
      phone:       u.phone,
      role:        u.role,
      createdAt:   u.created_at,
      lastLoginAt: u.last_login_at,
    })),
    total,
    page:  Number(page),
    limit: Number(limit),
  })
})

// ============================================================
// PUT /api/admin/properties/:id — 物件情報更新
// ============================================================
adminRoutes.put('/properties/:id', async (c) => {
  const id   = c.req.param('id')
  const body = await c.req.json().catch(() => ({}))

  const existing = await queryOne<{ id: string }>(
    c.env.DB,
    'SELECT id FROM properties WHERE id = ? LIMIT 1',
    [id]
  )
  if (!existing) return c.json({ error: '物件が見つかりません' }, 404)

  // 更新可能フィールドのみ抽出
  const fields = [
    'name_ja', 'name_en', 'description_ja', 'description_en',
    'max_guests', 'bedrooms', 'beds', 'bathrooms',
    'price_per_night', 'cleaning_fee',
    'address_ja', 'address_en',
    'check_in_time', 'check_out_time',
    'is_active',
  ]

  // camelCase → snake_case マッピング
  const camelToSnake: Record<string, string> = {
    nameJa: 'name_ja', nameEn: 'name_en',
    descriptionJa: 'description_ja', descriptionEn: 'description_en',
    maxGuests: 'max_guests', pricePerNight: 'price_per_night',
    cleaningFee: 'cleaning_fee', addressJa: 'address_ja', addressEn: 'address_en',
    checkInTime: 'check_in_time', checkOutTime: 'check_out_time', isActive: 'is_active',
  }

  const updates: string[] = []
  const values: unknown[] = []

  for (const [key, val] of Object.entries(body)) {
    const snakeKey = camelToSnake[key] || key
    if (fields.includes(snakeKey)) {
      updates.push(`${snakeKey} = ?`)
      values.push(val)
    }
  }

  if (updates.length === 0) {
    return c.json({ error: '更新するフィールドがありません' }, 400)
  }

  updates.push('updated_at = ?')
  values.push(now())
  values.push(id)

  await execute(c.env.DB,
    `UPDATE properties SET ${updates.join(', ')} WHERE id = ?`,
    values
  )

  const updated = await queryOne<Property>(
    c.env.DB,
    'SELECT * FROM properties WHERE id = ? LIMIT 1',
    [id]
  )

  return c.json(updated)
})

// ============================================================
// snake_case → camelCase 変換ヘルパー
// ============================================================
function toBookingResponse(b: any) {
  return {
    id:            b.id,
    bookingCode:   b.booking_code   ?? b.bookingCode,
    userId:        b.user_id        ?? b.userId,
    propertyId:    b.property_id    ?? b.propertyId,
    propertySlug:  b.property_slug  ?? b.propertySlug,
    guestName:     b.guest_name     ?? b.guestName,
    guestEmail:    b.guest_email    ?? b.guestEmail,
    guestPhone:    b.guest_phone    ?? b.guestPhone,
    checkinDate:   b.checkin_date   ?? b.checkinDate,
    checkoutDate:  b.checkout_date  ?? b.checkoutDate,
    nights:        b.nights,
    guestCount:    b.guest_count    ?? b.guestCount,
    adultCount:    b.adult_count    ?? b.adultCount,
    childCount:    b.child_count    ?? b.childCount,
    infantCount:   b.infant_count   ?? b.infantCount,
    pricePerNight: b.price_per_night ?? b.pricePerNight,
    cleaningFee:   b.cleaning_fee   ?? b.cleaningFee,
    totalPrice:    b.total_price    ?? b.totalPrice,
    status:        b.status,
    guestNote:     b.guest_note     ?? b.guestNote,
    adminNote:     b.admin_note     ?? b.adminNote,
    createdAt:     b.created_at     ?? b.createdAt,
    updatedAt:     b.updated_at     ?? b.updatedAt,
  }
}

function toContactResponse(c: any) {
  return {
    id:           c.id,
    name:         c.name,
    email:        c.email,
    phone:        c.phone,
    category:     c.category,
    subject:      c.subject,
    message:      c.message,
    propertySlug: c.property_slug ?? c.propertySlug,
    status:       c.status,
    replyMessage: c.reply_message ?? c.replyMessage,
    repliedAt:    c.replied_at    ?? c.repliedAt,
    createdAt:    c.created_at    ?? c.createdAt,
    updatedAt:    c.updated_at    ?? c.updatedAt,
  }
}
