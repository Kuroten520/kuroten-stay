/**
 * Kuroten Stay Sapporo — D1データベースヘルパー
 * Cloudflare D1（SQLite互換）用ユーティリティ
 */

// ============================================================
// UUID生成（CF Workers対応: crypto.randomUUID()）
// ============================================================
export function generateUUID(): string {
  return crypto.randomUUID()
}

// ============================================================
// 日付ヘルパー
// ============================================================
export function now(): string {
  return new Date().toISOString()
}

export function nowDate(): string {
  return new Date().toISOString().split('T')[0]
}

// ============================================================
// D1クエリヘルパー
// ============================================================

/** SELECT 一件取得 */
export async function queryOne<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T | null> {
  const result = await db.prepare(sql).bind(...params).first<T>()
  return result ?? null
}

/** SELECT 複数取得 */
export async function queryAll<T>(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const { results } = await db.prepare(sql).bind(...params).all<T>()
  return results
}

/** INSERT / UPDATE / DELETE 実行 */
export async function execute(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<D1Result> {
  return db.prepare(sql).bind(...params).run()
}

/** SELECT COUNT(*) → number */
export async function queryCount(
  db: D1Database,
  sql: string,
  params: unknown[] = []
): Promise<number> {
  const row = await db.prepare(sql).bind(...params).first<{ count: number }>()
  return row?.count ?? 0
}
