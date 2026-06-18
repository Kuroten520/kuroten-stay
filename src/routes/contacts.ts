/**
 * Kuroten Stay Sapporo — 問い合わせルート
 * POST /api/contacts — 問い合わせ送信（認証不要）
 */
import { Hono }          from 'hono'
import { execute, generateUUID, now } from '../db'
import type { Env }      from '../middleware/auth'

export const contactsRoutes = new Hono<{ Bindings: Env }>()

// ============================================================
// POST /api/contacts — 問い合わせ送信
// ============================================================
contactsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}))
  const { name, email, phone, category, subject, message, propertySlug } = body

  if (!name || !email || !subject || !message) {
    return c.json({ error: '必須項目（name, email, subject, message）を入力してください' }, 400)
  }

  // メールアドレス形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return c.json({ error: '正しいメールアドレスを入力してください' }, 400)
  }

  const contactId = generateUUID()
  const timestamp = now()

  await execute(c.env.DB,
    `INSERT INTO contacts (
       id, name, email, phone, category, subject, message,
       property_slug, status, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`,
    [
      contactId, name, email, phone || null,
      category || 'other', subject, message,
      propertySlug || null, timestamp, timestamp,
    ]
  )

  return c.json({
    message: 'お問い合わせを受け付けました。担当者よりご連絡いたします。',
    id: contactId,
  }, 201)
})
