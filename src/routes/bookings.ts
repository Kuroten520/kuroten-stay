/**
 * Kuroten Stay Sapporo — 予約ルート（要認証）
 * GET    /api/bookings      — 自分の予約一覧
 * GET    /api/bookings/:id  — 予約詳細
 * POST   /api/bookings      — 予約作成
 * DELETE /api/bookings/:id  — 予約キャンセル
 */
import { Hono }              from 'hono'
import { verify }             from 'hono/jwt'
import { type JwtPayload, type Env } from '../middleware/auth'
import { queryOne, queryAll, execute, generateUUID, now } from '../db'
import type { Booking, Property, User } from '../db/schema'

export const bookingsRoutes = new Hono<{ Bindings: Env }>()

// 全ルートに認証を要求（インライン JWT 検証）
bookingsRoutes.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: '認証が必要です' }, 401)
  }
  const token  = authHeader.slice(7)
  const secret = c.env?.JWT_SECRET
  if (!secret) return c.json({ error: 'JWT_SECRET未設定' }, 500)
  try {
    const payload = await verify(token, secret, 'HS256') as JwtPayload
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'トークンが無効または期限切れです' }, 401)
  }
})

// ---- 予約コード生成 ----
function generateBookingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'KT-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// ============================================================
// GET /api/bookings — 自分の予約一覧
// ============================================================
bookingsRoutes.get('/', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload

  const myBookings = await queryAll<Booking>(
    c.env.DB,
    `SELECT b.*, p.slug as property_slug
     FROM bookings b
     LEFT JOIN properties p ON b.property_id = p.id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC`,
    [payload.sub]
  )

  // snake_case → camelCase 変換
  return c.json({
    bookings: myBookings.map(toBookingResponse)
  })
})

// ============================================================
// GET /api/bookings/:id — 予約詳細
// ============================================================
bookingsRoutes.get('/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  const id      = c.req.param('id')

  const booking = await queryOne<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE id = ? AND user_id = ? LIMIT 1',
    [id, payload.sub]
  )

  if (!booking) return c.json({ error: '予約が見つかりません' }, 404)

  return c.json(toBookingResponse(booking))
})

// ============================================================
// POST /api/bookings — 予約作成
// ============================================================
bookingsRoutes.post('/', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  const body    = await c.req.json().catch(() => ({}))

  const {
    propertyId, checkinDate, checkoutDate,
    guestCount, adultCount, childCount = 0,
    infantCount = 0, guestNote,
  } = body

  if (!propertyId || !checkinDate || !checkoutDate || !guestCount) {
    return c.json({ error: '必須項目（propertyId, checkinDate, checkoutDate, guestCount）を入力してください' }, 400)
  }

  // 物件取得（slug or uuid）
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId)
  const property = await queryOne<Property>(
    c.env.DB,
    isUUID
      ? 'SELECT * FROM properties WHERE id = ? AND is_active = 1 LIMIT 1'
      : 'SELECT * FROM properties WHERE slug = ? AND is_active = 1 LIMIT 1',
    [propertyId]
  )
  if (!property) return c.json({ error: '物件が見つかりません' }, 404)

  // 宿泊数計算
  const checkin  = new Date(checkinDate)
  const checkout = new Date(checkoutDate)
  const nights   = Math.round((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24))

  if (nights <= 0) {
    return c.json({ error: 'チェックアウト日はチェックイン日より後にしてください' }, 400)
  }

  // 重複チェック
  const overlapping = await queryOne<{ id: string }>(
    c.env.DB,
    `SELECT id FROM bookings
     WHERE property_id = ?
       AND status NOT IN ('cancelled', 'no_show')
       AND checkin_date  < ?
       AND checkout_date > ?
     LIMIT 1`,
    [property.id, checkoutDate, checkinDate]
  )
  if (overlapping) {
    return c.json({ error: 'この期間は予約が入っています。別の日程をお選びください。' }, 409)
  }

  // ゲスト情報（ユーザー名取得）
  const user = await queryOne<User>(
    c.env.DB,
    'SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1',
    [payload.sub]
  )
  const guestName = user
    ? `${user.lastName || ''} ${user.firstName || ''}`.trim() || user.email
    : payload.email

  const totalPrice  = property.pricePerNight * nights + property.cleaningFee
  const bookingId   = generateUUID()
  const bookingCode = generateBookingCode()
  const timestamp   = now()

  await execute(c.env.DB,
    `INSERT INTO bookings (
       id, booking_code, user_id, property_id, property_slug,
       guest_name, guest_email, guest_phone,
       checkin_date, checkout_date, nights, guest_count,
       adult_count, child_count, infant_count,
       price_per_night, cleaning_fee, total_price,
       status, guest_note, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      bookingId, bookingCode, payload.sub, property.id, property.slug,
      guestName, payload.email, null,
      checkinDate, checkoutDate, nights, guestCount,
      adultCount || guestCount, childCount, infantCount,
      property.pricePerNight, property.cleaningFee, totalPrice,
      guestNote || null, timestamp, timestamp,
    ]
  )

  const created = await queryOne<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE id = ? LIMIT 1',
    [bookingId]
  )

  return c.json({ booking: toBookingResponse(created!) }, 201)
})

// ============================================================
// DELETE /api/bookings/:id — 予約キャンセル
// ============================================================
bookingsRoutes.delete('/:id', async (c) => {
  const payload = c.get('jwtPayload') as JwtPayload
  const id      = c.req.param('id')

  const booking = await queryOne<Booking>(
    c.env.DB,
    'SELECT * FROM bookings WHERE id = ? AND user_id = ? LIMIT 1',
    [id, payload.sub]
  )

  if (!booking) return c.json({ error: '予約が見つかりません' }, 404)

  if (!['pending', 'confirmed'].includes(booking.status)) {
    return c.json({ error: 'この予約はキャンセルできません（ステータス: ' + booking.status + '）' }, 400)
  }

  await execute(c.env.DB,
    "UPDATE bookings SET status = 'cancelled', updated_at = ? WHERE id = ?",
    [now(), id]
  )

  return c.json({ message: 'キャンセルしました', bookingId: id })
})

// ============================================================
// snake_case → camelCase レスポンス変換
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
