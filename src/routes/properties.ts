/**
 * Kuroten Stay Sapporo — 物件ルート
 * GET /api/properties                    — 物件一覧
 * GET /api/properties/:id               — 物件詳細（slug or uuid）
 * GET /api/properties/:id/availability  — 空き確認
 */
import { Hono }                  from 'hono'
import { queryOne, queryAll }    from '../db'
import type { Env }              from '../middleware/auth'
import type { Property, Booking } from '../db/schema'

export const propertiesRoutes = new Hono<{ Bindings: Env }>()

// ============================================================
// D1はsnake_caseで返すため camelCase に変換するヘルパー
// ============================================================
function toPropertyResponse(p: any) {
  return {
    id:              p.id,
    slug:            p.slug,
    nameJa:          p.name_ja          ?? p.nameJa,
    nameEn:          p.name_en          ?? p.nameEn,
    descriptionJa:   p.description_ja   ?? p.descriptionJa,
    descriptionEn:   p.description_en   ?? p.descriptionEn,
    maxGuests:       p.max_guests        ?? p.maxGuests,
    bedrooms:        p.bedrooms,
    beds:            p.beds,
    bathrooms:       p.bathrooms,
    pricePerNight:   p.price_per_night   ?? p.pricePerNight,
    cleaningFee:     p.cleaning_fee      ?? p.cleaningFee,
    addressJa:       p.address_ja        ?? p.addressJa,
    addressEn:       p.address_en        ?? p.addressEn,
    checkInTime:     p.check_in_time     ?? p.checkInTime,
    checkOutTime:    p.check_out_time    ?? p.checkOutTime,
    isActive:        (p.is_active        ?? p.isActive) === 1,
    thumbnailUrl:    p.thumbnail_url     ?? p.thumbnailUrl,
    images:          p.images,
    amenities:       p.amenities,
    createdAt:       p.created_at        ?? p.createdAt,
    updatedAt:       p.updated_at        ?? p.updatedAt,
  }
}

// ============================================================
// GET /api/properties — 物件一覧
// ============================================================
propertiesRoutes.get('/', async (c) => {
  const properties = await queryAll<Property>(
    c.env.DB,
    'SELECT * FROM properties WHERE is_active = 1 ORDER BY slug'
  )
  return c.json({ properties: properties.map(toPropertyResponse) })
})

// ============================================================
// GET /api/properties/:id — 物件詳細
// ============================================================
propertiesRoutes.get('/:id', async (c) => {
  const id = c.req.param('id')
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  const property = await queryOne<Property>(
    c.env.DB,
    isUUID
      ? 'SELECT * FROM properties WHERE id = ? LIMIT 1'
      : 'SELECT * FROM properties WHERE slug = ? LIMIT 1',
    [id]
  )

  if (!property) {
    return c.json({ error: '物件が見つかりません' }, 404)
  }

  return c.json(toPropertyResponse(property))
})

// ============================================================
// GET /api/properties/:id/availability — 空き確認
// ============================================================
propertiesRoutes.get('/:id/availability', async (c) => {
  const id = c.req.param('id')
  const { checkinDate, checkoutDate } = c.req.query()

  if (!checkinDate || !checkoutDate) {
    return c.json({ error: 'チェックイン・チェックアウト日を指定してください' }, 400)
  }

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  const property = await queryOne<Property>(
    c.env.DB,
    isUUID
      ? 'SELECT * FROM properties WHERE id = ? LIMIT 1'
      : 'SELECT * FROM properties WHERE slug = ? LIMIT 1',
    [id]
  )

  if (!property) {
    return c.json({ error: '物件が見つかりません' }, 404)
  }

  // 対象期間に有効な予約が重複しているか確認
  // チェックイン日 < リクエストのチェックアウト AND チェックアウト日 > リクエストのチェックイン
  const overlapping = await queryAll<{ id: string }>(
    c.env.DB,
    `SELECT id FROM bookings
     WHERE property_id = ?
       AND status NOT IN ('cancelled', 'no_show')
       AND checkin_date  < ?
       AND checkout_date > ?`,
    [property.id, checkoutDate, checkinDate]
  )

  // ブロック日の取得
  const blocked = await queryAll<{ blocked_date: string }>(
    c.env.DB,
    `SELECT blocked_date FROM property_blocked_dates
     WHERE property_id = ?
       AND blocked_date >= ?
       AND blocked_date <= ?`,
    [property.id, checkinDate, checkoutDate]
  )

  const available = overlapping.length === 0 && blocked.length === 0

  return c.json({
    available,
    propertyId:   property.id,
    propertySlug: property.slug,
    blockedDates: blocked.map(b => b.blocked_date),
  })
})
