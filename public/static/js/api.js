/**
 * Kuroten Stay Sapporo — API クライアント共通処理
 * バックエンド (Hono) との通信を一元管理するモジュール
 */

// ============================================================
// 設定
// ============================================================
const API_BASE_URL = window.KUROTEN_CONFIG?.apiBaseUrl || 'http://localhost:3000'

// ============================================================
// トークン管理
// ============================================================
const TokenManager = {
  getAccessToken: () => localStorage.getItem('kuroten_access_token'),
  setAccessToken: (token) => localStorage.setItem('kuroten_access_token', token),
  clearAccessToken: () => localStorage.removeItem('kuroten_access_token'),

  getUser: () => {
    const raw = localStorage.getItem('kuroten_user')
    try { return raw ? JSON.parse(raw) : null } catch { return null }
  },
  setUser: (user) => localStorage.setItem('kuroten_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('kuroten_user'),

  isLoggedIn: () => !!TokenManager.getAccessToken(),
  isOwner: () => TokenManager.getUser()?.role === 'owner',
}

// ============================================================
// HTTPクライアント（自動リフレッシュ付き）
// ============================================================
const http = {
  /**
   * 共通fetchラッパー
   * アクセストークン付与・401時の自動リフレッシュを行う
   */
  async request(path, options = {}) {
    const url = `${API_BASE_URL}${path}`
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    // アクセストークンをヘッダーに付与
    const accessToken = TokenManager.getAccessToken()
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Cookie（リフレッシュトークン）を送信
    })

    // 401の場合 → トークンリフレッシュを試みる
    if (response.status === 401 && !options._retry) {
      const refreshed = await http.refreshToken()
      if (refreshed) {
        // リトライ
        headers['Authorization'] = `Bearer ${TokenManager.getAccessToken()}`
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          _retry: true,
        })
      } else {
        // リフレッシュも失敗 → ログアウト
        Auth.logout()
        return { error: 'セッションが切れました。再ログインしてください。', status: 401 }
      }
    }

    // レスポンス解析
    if (response.status === 204) return { data: null, status: 204 }

    const data = await response.json().catch(() => ({}))
    return { data, status: response.status, ok: response.ok }
  },

  // リフレッシュトークンでアクセストークン更新
  async refreshToken() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!response.ok) return false
      const { accessToken } = await response.json()
      TokenManager.setAccessToken(accessToken)
      return true
    } catch {
      return false
    }
  },

  get: (path, options = {}) =>
    http.request(path, { ...options, method: 'GET' }),

  post: (path, body, options = {}) =>
    http.request(path, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: (path, body, options = {}) =>
    http.request(path, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (path, body, options = {}) =>
    http.request(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (path, options = {}) =>
    http.request(path, { ...options, method: 'DELETE' }),
}

// ============================================================
// 認証 API
// ============================================================
const Auth = {
  /**
   * 新規ゲスト登録
   * @param {{ email, password, firstName, lastName, phone?, nationality? }} data
   */
  async register(data) {
    const { data: result, status, ok } = await http.post('/api/auth/register', data)
    if (!ok) throw new ApiError(result?.error || '登録に失敗しました', status)
    return result
  },

  /**
   * ログイン（ゲスト・オーナー共通）
   * @param {{ email, password }} credentials
   */
  async login(credentials) {
    const { data: result, status, ok } = await http.post('/api/auth/login', credentials)
    if (!ok) throw new ApiError(result?.error || 'ログインに失敗しました', status)

    // トークン・ユーザー情報を保存
    TokenManager.setAccessToken(result.accessToken)
    TokenManager.setUser(result.user)

    // 認証状態変更イベント発火
    window.dispatchEvent(new CustomEvent('kuroten:auth-change', {
      detail: { loggedIn: true, user: result.user }
    }))

    return result.user
  },

  /**
   * ログアウト
   */
  async logout() {
    try {
      await http.post('/api/auth/logout', {})
    } finally {
      TokenManager.clearAccessToken()
      TokenManager.clearUser()
      window.dispatchEvent(new CustomEvent('kuroten:auth-change', {
        detail: { loggedIn: false }
      }))
      window.location.href = '/'
    }
  },

  /**
   * 自分のプロフィール取得
   */
  async getMe() {
    const { data, status, ok } = await http.get('/api/auth/me')
    if (!ok) throw new ApiError(data?.error || 'プロフィール取得に失敗しました', status)
    return data
  },

  /**
   * プロフィール更新
   */
  async updateMe(updateData) {
    const { data, status, ok } = await http.put('/api/auth/me', updateData)
    if (!ok) throw new ApiError(data?.error || '更新に失敗しました', status)
    TokenManager.setUser({ ...TokenManager.getUser(), ...data })
    return data
  },

  /** 現在のユーザー情報 */
  currentUser: () => TokenManager.getUser(),
  isLoggedIn: () => TokenManager.isLoggedIn(),
  isOwner: () => TokenManager.isOwner(),
}

// ============================================================
// 物件 API
// ============================================================
const PropertiesApi = {
  /**
   * 物件一覧取得
   */
  async list() {
    const { data, ok, status } = await http.get('/api/properties')
    if (!ok) throw new ApiError(data?.error || '物件一覧の取得に失敗しました', status)
    return data.properties
  },

  /**
   * 物件詳細取得
   * @param {string} id - 物件ID または slug ('sun'|'moon'|'smile'|'sky')
   */
  async get(id) {
    const { data, ok, status } = await http.get(`/api/properties/${id}`)
    if (!ok) throw new ApiError(data?.error || '物件情報の取得に失敗しました', status)
    return data
  },

  /**
   * 空き状況確認
   * @param {string} propertyId
   * @param {string} checkinDate  - 'YYYY-MM-DD'
   * @param {string} checkoutDate - 'YYYY-MM-DD'
   */
  async checkAvailability(propertyId, checkinDate, checkoutDate) {
    const params = new URLSearchParams({ checkinDate, checkoutDate })
    const { data, ok, status } = await http.get(
      `/api/properties/${propertyId}/availability?${params}`
    )
    if (!ok) throw new ApiError(data?.error || '空き確認に失敗しました', status)
    return data // { available: boolean, blockedDates: string[] }
  },
}

// ============================================================
// 予約 API
// ============================================================
const BookingsApi = {
  /**
   * 自分の予約一覧
   */
  async list() {
    const { data, ok, status } = await http.get('/api/bookings')
    if (!ok) throw new ApiError(data?.error || '予約一覧の取得に失敗しました', status)
    return data.bookings
  },

  /**
   * 予約詳細取得
   * @param {string} bookingId
   */
  async get(bookingId) {
    const { data, ok, status } = await http.get(`/api/bookings/${bookingId}`)
    if (!ok) throw new ApiError(data?.error || '予約情報の取得に失敗しました', status)
    return data
  },

  /**
   * 新規予約作成
   * @param {{
   *   propertyId: string,
   *   checkinDate: string,   // 'YYYY-MM-DD'
   *   checkoutDate: string,  // 'YYYY-MM-DD'
   *   guestCount: number,
   *   adultCount: number,
   *   childCount?: number,
   *   infantCount?: number,
   *   guestNote?: string
   * }} bookingData
   */
  async create(bookingData) {
    const { data, ok, status } = await http.post('/api/bookings', bookingData)
    if (!ok) throw new ApiError(data?.error || '予約の作成に失敗しました', status)
    return data.booking
  },

  /**
   * 予約キャンセル
   * @param {string} bookingId
   */
  async cancel(bookingId) {
    const { data, ok, status } = await http.delete(`/api/bookings/${bookingId}`)
    if (!ok) throw new ApiError(data?.error || 'キャンセルに失敗しました', status)
    return data
  },
}

// ============================================================
// 問い合わせ API
// ============================================================
const ContactsApi = {
  /**
   * 問い合わせ送信
   * @param {{
   *   name: string,
   *   email: string,
   *   phone?: string,
   *   category: string,
   *   subject: string,
   *   message: string,
   *   propertySlug?: string
   * }} contactData
   */
  async send(contactData) {
    const { data, ok, status } = await http.post('/api/contacts', contactData)
    if (!ok) throw new ApiError(data?.error || '送信に失敗しました', status)
    return data
  },
}

// ============================================================
// 管理者 API（オーナー専用）
// ============================================================
const AdminApi = {
  /**
   * ダッシュボード統計取得
   */
  async getStats() {
    const { data, ok, status } = await http.get('/api/admin/stats')
    if (!ok) throw new ApiError(data?.error || '統計情報の取得に失敗しました', status)
    return data
  },

  /**
   * 全予約一覧（フィルター付き）
   * @param {{ status?, propertySlug?, page?, limit? }} params
   */
  async listBookings(params = {}) {
    const query = new URLSearchParams(params).toString()
    const { data, ok, status } = await http.get(`/api/admin/bookings?${query}`)
    if (!ok) throw new ApiError(data?.error || '予約一覧の取得に失敗しました', status)
    return data
  },

  /**
   * 予約ステータス更新
   * @param {string} bookingId
   * @param {string} newStatus
   */
  async updateBookingStatus(bookingId, newStatus) {
    const { data, ok, status } = await http.put(
      `/api/admin/bookings/${bookingId}/status`,
      { status: newStatus }
    )
    if (!ok) throw new ApiError(data?.error || 'ステータスの更新に失敗しました', status)
    return data
  },

  /**
   * 全問い合わせ一覧
   * @param {{ status?, page?, limit? }} params
   */
  async listContacts(params = {}) {
    const query = new URLSearchParams(params).toString()
    const { data, ok, status } = await http.get(`/api/admin/contacts?${query}`)
    if (!ok) throw new ApiError(data?.error || '問い合わせ一覧の取得に失敗しました', status)
    return data
  },

  /**
   * 問い合わせへの返信
   * @param {string} contactId
   * @param {{ reply: string }} replyData
   */
  async replyContact(contactId, replyData) {
    const { data, ok, status } = await http.put(
      `/api/admin/contacts/${contactId}/reply`,
      replyData
    )
    if (!ok) throw new ApiError(data?.error || '返信の送信に失敗しました', status)
    return data
  },

  /**
   * ユーザー一覧
   * @param {{ page?, limit?, search? }} params
   */
  async listUsers(params = {}) {
    const query = new URLSearchParams(params).toString()
    const { data, ok, status } = await http.get(`/api/admin/users?${query}`)
    if (!ok) throw new ApiError(data?.error || 'ユーザー一覧の取得に失敗しました', status)
    return data
  },

  /**
   * 物件情報更新
   * @param {string} propertyId
   * @param {object} updateData
   */
  async updateProperty(propertyId, updateData) {
    const { data, ok, status } = await http.put(
      `/api/admin/properties/${propertyId}`,
      updateData
    )
    if (!ok) throw new ApiError(data?.error || '物件情報の更新に失敗しました', status)
    return data
  },
}

// ============================================================
// エラークラス
// ============================================================
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

// ============================================================
// グローバル公開
// ============================================================
window.KurotenApi = {
  Auth,
  Properties: PropertiesApi,
  Bookings: BookingsApi,
  Contacts: ContactsApi,
  Admin: AdminApi,
  TokenManager,
  ApiError,
}
