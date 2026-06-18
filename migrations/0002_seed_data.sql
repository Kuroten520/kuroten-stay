-- ============================================================
-- Kuroten Stay Sapporo — 初期シードデータ
-- ============================================================

-- ============================================================
-- 物件マスタ（4物件）
-- ============================================================
INSERT OR IGNORE INTO properties (
  id, slug, name_ja, name_en,
  description_ja, description_en,
  max_guests, bedrooms, beds, bathrooms,
  price_per_night, cleaning_fee,
  address_ja, address_en,
  check_in_time, check_out_time,
  is_active, created_at, updated_at
) VALUES
  (
    'prop-sun-0001', 'sun', 'THE SUN', 'THE SUN',
    '最大12名様収容の広々とした一軒家。4つの寝室と2つのバスルームを完備。',
    'Spacious house accommodating up to 12 guests. 4 bedrooms and 2 bathrooms.',
    12, 4, 6, 2,
    32000, 8000,
    '北海道札幌市豊平区美園',
    'Misono, Toyohira-ku, Sapporo, Hokkaido',
    '15:00', '10:00',
    1,
    datetime('now'), datetime('now')
  ),
  (
    'prop-moon-0001', 'moon', 'THE MOON', 'THE MOON',
    '最大12名様収容。屋根付き無料駐車場2台完備。',
    'Accommodates up to 12 guests. Free covered parking for 2 cars.',
    12, 4, 6, 2,
    32000, 8000,
    '北海道札幌市豊平区美園',
    'Misono, Toyohira-ku, Sapporo, Hokkaido',
    '15:00', '10:00',
    1,
    datetime('now'), datetime('now')
  ),
  (
    'prop-smile-0001', 'smile', 'THE SMILE', 'THE SMILE',
    '最大10名様収容。4つの寝室と7台のベッドを完備。',
    'Accommodates up to 10 guests. 4 bedrooms with 7 beds.',
    10, 4, 7, 2,
    28000, 7000,
    '北海道札幌市東区',
    'Higashi-ku, Sapporo, Hokkaido',
    '15:00', '10:00',
    1,
    datetime('now'), datetime('now')
  ),
  (
    'prop-sky-0001', 'sky', 'THE SKY', 'THE SKY',
    '最大6名様収容。札幌中心部に位置するコンパクトな一軒家。',
    'Accommodates up to 6 guests. Compact house in central Sapporo.',
    6, 2, 3, 1,
    18000, 5000,
    '北海道札幌市中央区南2条西10丁目',
    'S2 W10, Chuo-ku, Sapporo, Hokkaido',
    '15:00', '10:00',
    1,
    datetime('now'), datetime('now')
  );

-- ============================================================
-- オーナーアカウント（管理者）
-- パスワード: KurotenOwner2024! → PBKDF2ハッシュ（暫定: プレーンテキスト形式で保存）
-- ⚠️ 本番運用前に必ずパスワードを変更すること
-- ============================================================
INSERT OR IGNORE INTO users (
  id, email, password, first_name, last_name,
  role, is_active, created_at, updated_at
) VALUES
  (
    'user-owner-0001',
    'owner@kuroten-stay.com',
    'kuroten2024',
    'オーナー', '',
    'owner', 1,
    datetime('now'), datetime('now')
  ),
  (
    'user-admin-0001',
    'admin@kuroten-stay.com',
    'admin1234',
    '管理者', '',
    'owner', 1,
    datetime('now'), datetime('now')
  );
