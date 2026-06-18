-- ============================================================
-- Kuroten Stay Sapporo — 初期スキーマ
-- Cloudflare D1（SQLite互換）
-- ============================================================

-- ============================================================
-- users テーブル
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  email        TEXT NOT NULL UNIQUE,
  password     TEXT NOT NULL,
  first_name   TEXT,
  last_name    TEXT,
  phone        TEXT,
  nationality  TEXT,
  role         TEXT NOT NULL DEFAULT 'guest'
               CHECK (role IN ('guest', 'owner')),
  is_active    INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users(role);

-- ============================================================
-- properties テーブル（物件マスタ）
-- ============================================================
CREATE TABLE IF NOT EXISTS properties (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name_ja         TEXT NOT NULL,
  name_en         TEXT,
  description_ja  TEXT,
  description_en  TEXT,
  max_guests      INTEGER NOT NULL DEFAULT 1,
  bedrooms        INTEGER NOT NULL DEFAULT 1,
  beds            INTEGER NOT NULL DEFAULT 1,
  bathrooms       INTEGER NOT NULL DEFAULT 1,
  price_per_night INTEGER NOT NULL DEFAULT 0,
  cleaning_fee    INTEGER NOT NULL DEFAULT 0,
  address_ja      TEXT,
  address_en      TEXT,
  check_in_time   TEXT DEFAULT '15:00',
  check_out_time  TEXT DEFAULT '10:00',
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_slug ON properties(slug);

-- ============================================================
-- bookings テーブル（予約）
-- ============================================================
CREATE TABLE IF NOT EXISTS bookings (
  id             TEXT PRIMARY KEY,
  booking_code   TEXT NOT NULL UNIQUE,
  user_id        TEXT REFERENCES users(id),
  property_id    TEXT NOT NULL REFERENCES properties(id),
  property_slug  TEXT,
  guest_name     TEXT NOT NULL,
  guest_email    TEXT NOT NULL,
  guest_phone    TEXT,
  checkin_date   TEXT NOT NULL,
  checkout_date  TEXT NOT NULL,
  nights         INTEGER NOT NULL,
  guest_count    INTEGER NOT NULL,
  adult_count    INTEGER NOT NULL DEFAULT 1,
  child_count    INTEGER NOT NULL DEFAULT 0,
  infant_count   INTEGER NOT NULL DEFAULT 0,
  price_per_night INTEGER NOT NULL,
  cleaning_fee   INTEGER NOT NULL DEFAULT 0,
  total_price    INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','checked_in','checked_out','cancelled','no_show')),
  guest_note     TEXT,
  admin_note     TEXT,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id      ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id  ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_slug ON bookings(property_slug);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_checkin_date ON bookings(checkin_date);

-- ============================================================
-- contacts テーブル（問い合わせ）
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  category      TEXT NOT NULL DEFAULT 'other'
                CHECK (category IN ('booking_inquiry','cancellation','facility','access','other')),
  subject       TEXT NOT NULL,
  message       TEXT NOT NULL,
  property_slug TEXT,
  status        TEXT NOT NULL DEFAULT 'new'
                CHECK (status IN ('new','in_progress','resolved','closed')),
  reply_message TEXT,
  replied_at    TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_email  ON contacts(email);

-- ============================================================
-- refresh_tokens テーブル（JWTリフレッシュトークン）
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id),
  token      TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens(token);

-- ============================================================
-- property_blocked_dates テーブル（予約不可日）
-- ============================================================
CREATE TABLE IF NOT EXISTS property_blocked_dates (
  id           TEXT PRIMARY KEY,
  property_id  TEXT NOT NULL REFERENCES properties(id),
  blocked_date TEXT NOT NULL,
  reason       TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_property_id  ON property_blocked_dates(property_id);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_blocked_date ON property_blocked_dates(blocked_date);
