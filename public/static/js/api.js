/**
 * Kuroten Stay Sapporo — API クライアント
 * window.KurotenApi として公開
 *
 * バックエンドAPIが実装されるまでは localStorage を使ったモック動作。
 * APIが接続されたら BASE_URL を実際のエンドポイントに変更し、
 * モック処理を削除してください。
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 設定                                                                 */
  /* ------------------------------------------------------------------ */
  const BASE_URL = '/api';          // Hono バックエンドのベースURL
  const TOKEN_KEY = 'kuroten_access_token';
  const USER_KEY  = 'kuroten_user';

  /* ------------------------------------------------------------------ */
  /* ユーティリティ                                                       */
  /* ------------------------------------------------------------------ */

  /** 保存済みトークンを取得 */
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * fetch ラッパー
   * @param {string} path  - '/api/...' のパス
   * @param {RequestInit} opts - fetch オプション
   * @returns {Promise<any>}
   */
  async function request(path, opts = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, {
      ...opts,
      headers,
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try {
        const body = await res.json();
        errMsg = body.message || body.error || errMsg;
      } catch (_) { /* ignore */ }
      const err = new Error(errMsg);
      err.status = res.status;
      throw err;
    }

    // 204 No Content など
    const ct = res.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) {
      return res.json();
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* モックデータ（バックエンド未接続時のフォールバック）                */
  /* ------------------------------------------------------------------ */
  const MOCK_OWNER = {
    id: 'mock-owner-001',
    email: 'owner@kuroten-stay.com',
    firstName: 'オーナー',
    lastName: '',
    role: 'owner',
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
  };

  const MOCK_PROPERTIES = [
    {
      id: 'prop-sun', slug: 'sun',
      nameJa: 'THE SUN', nameEn: 'THE SUN',
      maxGuests: 10, bedrooms: 4, beds: 5, bathrooms: 2,
      pricePerNight: 50000, cleaningFee: 5000,
      addressJa: '北海道札幌市中央区',
      isActive: true,
    },
    {
      id: 'prop-moon', slug: 'moon',
      nameJa: 'THE MOON', nameEn: 'THE MOON',
      maxGuests: 8, bedrooms: 3, beds: 4, bathrooms: 2,
      pricePerNight: 45000, cleaningFee: 5000,
      addressJa: '北海道札幌市中央区',
      isActive: true,
    },
    {
      id: 'prop-smile', slug: 'smile',
      nameJa: 'THE SMILE', nameEn: 'THE SMILE',
      maxGuests: 6, bedrooms: 3, beds: 3, bathrooms: 1,
      pricePerNight: 38000, cleaningFee: 4000,
      addressJa: '北海道札幌市中央区',
      isActive: true,
    },
    {
      id: 'prop-sky', slug: 'sky',
      nameJa: 'THE SKY', nameEn: 'THE SKY',
      maxGuests: 8, bedrooms: 3, beds: 4, bathrooms: 2,
      pricePerNight: 42000, cleaningFee: 4500,
      addressJa: '北海道札幌市中央区',
      isActive: true,
    },
  ];

  const MOCK_BOOKINGS = [
    {
      id: 'bk-001',
      bookingCode: 'KRS-240601-001',
      propertySlug: 'sun',
      guestName: '田中 太郎',
      guestEmail: 'tanaka@example.com',
      guestPhone: '090-1234-5678',
      checkinDate: '2025-07-10',
      checkoutDate: '2025-07-13',
      nights: 3,
      guestCount: 6,
      pricePerNight: 50000,
      cleaningFee: 5000,
      totalPrice: 155000,
      status: 'confirmed',
      guestNote: '子供2名同伴',
      createdAt: '2025-06-01T10:00:00Z',
    },
    {
      id: 'bk-002',
      bookingCode: 'KRS-240615-002',
      propertySlug: 'moon',
      guestName: '鈴木 花子',
      guestEmail: 'suzuki@example.com',
      guestPhone: '080-9876-5432',
      checkinDate: '2025-08-01',
      checkoutDate: '2025-08-04',
      nights: 3,
      guestCount: 4,
      pricePerNight: 45000,
      cleaningFee: 5000,
      totalPrice: 140000,
      status: 'pending',
      guestNote: '',
      createdAt: '2025-06-15T14:30:00Z',
    },
    {
      id: 'bk-003',
      bookingCode: 'KRS-240620-003',
      propertySlug: 'smile',
      guestName: 'John Smith',
      guestEmail: 'john@example.com',
      guestPhone: '',
      checkinDate: '2025-07-20',
      checkoutDate: '2025-07-23',
      nights: 3,
      guestCount: 3,
      pricePerNight: 38000,
      cleaningFee: 4000,
      totalPrice: 118000,
      status: 'confirmed',
      guestNote: 'Early check-in requested',
      createdAt: '2025-06-20T09:15:00Z',
    },
  ];

  const MOCK_CONTACTS = [
    {
      id: 'ct-001',
      name: '佐藤 一郎',
      email: 'sato@example.com',
      phone: '070-1111-2222',
      category: 'booking_inquiry',
      subject: '7月の空き状況について',
      message: '7月10日から3泊でTHE SUNを利用したいのですが、空き状況を教えていただけますか？',
      status: 'new',
      createdAt: '2025-06-17T11:00:00Z',
    },
    {
      id: 'ct-002',
      name: '山田 次郎',
      email: 'yamada@example.com',
      phone: '',
      category: 'facility',
      subject: '駐車場について',
      message: '車で行く予定ですが、駐車場はありますか？台数と料金を教えてください。',
      status: 'in_progress',
      createdAt: '2025-06-16T09:30:00Z',
    },
    {
      id: 'ct-003',
      name: '伊藤 美咲',
      email: 'ito@example.com',
      phone: '090-5555-6666',
      category: 'cancellation',
      subject: 'キャンセルポリシーについて',
      message: 'キャンセルポリシーを詳しく教えていただけますか？',
      status: 'resolved',
      createdAt: '2025-06-14T16:45:00Z',
    },
  ];

  const MOCK_USERS = [
    {
      id: 'user-001',
      firstName: 'オーナー', lastName: '',
      email: 'owner@kuroten-stay.com',
      phone: '011-123-4567',
      role: 'owner',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
      bookingCount: 0,
    },
    {
      id: 'user-002',
      firstName: '太郎', lastName: '田中',
      email: 'tanaka@example.com',
      phone: '090-1234-5678',
      role: 'guest',
      createdAt: '2025-05-01T10:00:00Z',
      lastLoginAt: '2025-06-01T10:00:00Z',
      bookingCount: 1,
    },
    {
      id: 'user-003',
      firstName: '花子', lastName: '鈴木',
      email: 'suzuki@example.com',
      phone: '080-9876-5432',
      role: 'guest',
      createdAt: '2025-05-20T14:00:00Z',
      lastLoginAt: '2025-06-15T14:30:00Z',
      bookingCount: 1,
    },
  ];

  const MOCK_STATS = {
    bookingsThisMonth: 3,
    revenueThisMonth: 413000,
    currentGuests: 6,
    newContacts: 1,
    pendingBookings: 1,
    monthlyBookings: [
      { month: '1月', count: 2 },
      { month: '2月', count: 4 },
      { month: '3月', count: 6 },
      { month: '4月', count: 5 },
      { month: '5月', count: 8 },
      { month: '6月', count: 3 },
    ],
    propertyBreakdown: [
      { name: 'THE SUN',   count: 4 },
      { name: 'THE MOON',  count: 3 },
      { name: 'THE SMILE', count: 3 },
      { name: 'THE SKY',   count: 2 },
    ],
  };

  /* ------------------------------------------------------------------ */
  /* モック ヘルパー                                                      */
  /* ------------------------------------------------------------------ */

  /** APIが使えない場合にモックを返す汎用ラッパー */
  async function tryApi(apiFn, mockFn) {
    try {
      return await apiFn();
    } catch (err) {
      // バックエンド未接続（404/network error）の場合はモックにフォールバック
      if (err.status === 404 || err instanceof TypeError) {
        return mockFn();
      }
      throw err;
    }
  }

  /* ------------------------------------------------------------------ */
  /* Auth モジュール                                                      */
  /* ------------------------------------------------------------------ */
  const Auth = {
    /**
     * ログイン
     * @param {{ email: string, password: string }} credentials
     * @returns {Promise<User>}
     */
    async login({ email, password }) {
      return tryApi(
        async () => {
          const data = await request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
          });
          if (data.accessToken) {
            localStorage.setItem(TOKEN_KEY, data.accessToken);
          }
          if (data.user) {
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          }
          return data.user;
        },
        () => {
          // モックログイン（owner@kuroten-stay.com / admin のみ許可）
          const validEmails = ['owner@kuroten-stay.com', 'admin@kuroten-stay.com'];
          if (!validEmails.includes(email)) {
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }
          if (password.length < 4) {
            throw new Error('メールアドレスまたはパスワードが正しくありません');
          }
          const user = { ...MOCK_OWNER, email };
          localStorage.setItem(TOKEN_KEY, 'mock-token-' + Date.now());
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          return user;
        }
      );
    },

    /**
     * ログアウト
     */
    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (_) { /* ignore */ }
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.location.href = '/admin';
    },

    /**
     * 現在のユーザー情報を取得
     * @returns {Promise<User|null>}
     */
    async me() {
      return tryApi(
        () => request('/auth/me'),
        () => {
          const stored = localStorage.getItem(USER_KEY);
          return stored ? JSON.parse(stored) : null;
        }
      );
    },

    /** localStorage からユーザー情報を同期取得 */
    getStoredUser() {
      const stored = localStorage.getItem(USER_KEY);
      return stored ? JSON.parse(stored) : null;
    },

    /** ログイン済みか確認 */
    isLoggedIn() {
      return !!localStorage.getItem(TOKEN_KEY);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Properties モジュール                                               */
  /* ------------------------------------------------------------------ */
  const Properties = {
    /**
     * 物件一覧を取得
     * @returns {Promise<Property[]>}
     */
    async list() {
      return tryApi(
        () => request('/properties'),
        () => MOCK_PROPERTIES
      );
    },

    /**
     * 物件詳細を取得
     * @param {string} slugOrId
     * @returns {Promise<Property>}
     */
    async get(slugOrId) {
      return tryApi(
        () => request(`/properties/${slugOrId}`),
        () => {
          const p = MOCK_PROPERTIES.find(p => p.slug === slugOrId || p.id === slugOrId);
          if (!p) throw new Error('物件が見つかりません');
          return p;
        }
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* Bookings モジュール（ゲスト向け）                                    */
  /* ------------------------------------------------------------------ */
  const Bookings = {
    /**
     * 予約作成
     * @param {BookingInput} data
     * @returns {Promise<Booking>}
     */
    async create(data) {
      return tryApi(
        () => request('/bookings', { method: 'POST', body: JSON.stringify(data) }),
        () => ({
          id: 'bk-new-' + Date.now(),
          bookingCode: 'KRS-' + Date.now(),
          ...data,
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      );
    },

    /**
     * 予約詳細を取得
     * @param {string} bookingId
     * @returns {Promise<Booking>}
     */
    async get(bookingId) {
      return tryApi(
        () => request(`/bookings/${bookingId}`),
        () => {
          const b = MOCK_BOOKINGS.find(b => b.id === bookingId);
          if (!b) throw new Error('予約が見つかりません');
          return b;
        }
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* Contacts モジュール（問い合わせ送信）                                */
  /* ------------------------------------------------------------------ */
  const Contacts = {
    /**
     * 問い合わせ送信
     * @param {ContactInput} data
     * @returns {Promise<{ id: string }>}
     */
    async submit(data) {
      return tryApi(
        () => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
        () => ({ id: 'ct-new-' + Date.now(), ...data, status: 'new', createdAt: new Date().toISOString() })
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* Admin モジュール（管理者向け）                                       */
  /* ------------------------------------------------------------------ */
  const Admin = {
    /**
     * ダッシュボード統計を取得
     * @returns {Promise<Stats>}
     */
    async getStats() {
      return tryApi(
        () => request('/admin/stats'),
        () => MOCK_STATS
      );
    },

    /**
     * 予約一覧を取得（管理者）
     * @param {{ status?: string, propertySlug?: string, limit?: number, page?: number }} params
     * @returns {Promise<{ bookings: Booking[], total: number }>}
     */
    async listBookings(params = {}) {
      return tryApi(
        async () => {
          const qs = new URLSearchParams();
          if (params.status)       qs.set('status', params.status);
          if (params.propertySlug) qs.set('propertySlug', params.propertySlug);
          if (params.limit)        qs.set('limit', String(params.limit));
          if (params.page)         qs.set('page', String(params.page));
          return request(`/admin/bookings?${qs}`);
        },
        () => {
          let list = [...MOCK_BOOKINGS];
          if (params.status)       list = list.filter(b => b.status === params.status);
          if (params.propertySlug) list = list.filter(b => b.propertySlug === params.propertySlug);
          const limit = params.limit || 50;
          return { bookings: list.slice(0, limit), total: list.length };
        }
      );
    },

    /**
     * 予約ステータス更新（管理者）
     * @param {string} bookingId
     * @param {string} status
     * @returns {Promise<Booking>}
     */
    async updateBookingStatus(bookingId, status) {
      return tryApi(
        () => request(`/admin/bookings/${bookingId}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
        () => {
          const b = MOCK_BOOKINGS.find(b => b.id === bookingId);
          if (b) b.status = status;
          return b || {};
        }
      );
    },

    /**
     * 問い合わせ一覧を取得（管理者）
     * @param {{ status?: string, page?: number }} params
     * @returns {Promise<{ contacts: Contact[], total: number }>}
     */
    async listContacts(params = {}) {
      return tryApi(
        async () => {
          const qs = new URLSearchParams();
          if (params.status) qs.set('status', params.status);
          if (params.page)   qs.set('page', String(params.page));
          return request(`/admin/contacts?${qs}`);
        },
        () => {
          let list = [...MOCK_CONTACTS];
          if (params.status) list = list.filter(c => c.status === params.status);
          return { contacts: list, total: list.length };
        }
      );
    },

    /**
     * 問い合わせへの返信（管理者）
     * @param {string} contactId
     * @param {{ reply: string }} data
     * @returns {Promise<void>}
     */
    async replyContact(contactId, { reply }) {
      return tryApi(
        () => request(`/admin/contacts/${contactId}/reply`, {
          method: 'POST',
          body: JSON.stringify({ reply }),
        }),
        () => {
          const c = MOCK_CONTACTS.find(c => c.id === contactId);
          if (c) c.status = 'in_progress';
          return {};
        }
      );
    },

    /**
     * ユーザー一覧を取得（管理者）
     * @param {{ page?: number, search?: string }} params
     * @returns {Promise<{ users: User[], total: number }>}
     */
    async listUsers(params = {}) {
      return tryApi(
        async () => {
          const qs = new URLSearchParams();
          if (params.search) qs.set('search', params.search);
          if (params.page)   qs.set('page', String(params.page));
          return request(`/admin/users?${qs}`);
        },
        () => {
          let list = [...MOCK_USERS];
          if (params.search) {
            const q = params.search.toLowerCase();
            list = list.filter(u =>
              u.email.toLowerCase().includes(q) ||
              `${u.lastName} ${u.firstName}`.toLowerCase().includes(q)
            );
          }
          return { users: list, total: list.length };
        }
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* 公開 API                                                             */
  /* ------------------------------------------------------------------ */
  global.KurotenApi = {
    Auth,
    Properties,
    Bookings,
    Contacts,
    Admin,
  };

})(window);
