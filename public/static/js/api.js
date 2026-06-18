/* ============================================================
   Kuroten Stay Sapporo — api.js
   window.KurotenApi — フロントエンド APIクライアント
   (実際のバックエンドAPIが実装されたら接続先を変更)
   ============================================================ */

(function () {
  'use strict';

  // ---- helpers ----
  async function request(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
    };
    const token = KurotenApi.Auth.getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch('/api' + path, opts);
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.message || 'API error'), { status: res.status, data });
    return data;
  }

  // ================================================================
  //   Auth
  // ================================================================
  const Auth = {
    TOKEN_KEY: 'kuroten-token',
    USER_KEY:  'kuroten-user',

    getToken() {
      try { return localStorage.getItem(this.TOKEN_KEY); } catch { return null; }
    },
    setToken(t) {
      try { localStorage.setItem(this.TOKEN_KEY, t); } catch {}
    },
    getUser() {
      try { return JSON.parse(localStorage.getItem(this.USER_KEY) || 'null'); } catch { return null; }
    },
    setUser(u) {
      try { localStorage.setItem(this.USER_KEY, JSON.stringify(u)); } catch {}
    },
    clear() {
      try {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      } catch {}
    },
    isLoggedIn() {
      return !!this.getToken();
    },

    /** ログイン */
    async login(email, password) {
      // Demo implementation (replace with real API call)
      if (email && password) {
        const user = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          role: 'user',
        };
        const token = 'demo_token_' + Date.now();
        this.setToken(token);
        this.setUser(user);
        return { user, token };
      }
      throw new Error('メールアドレスまたはパスワードが正しくありません');
      // Real API:
      // const data = await request('POST', '/auth/login', { email, password });
      // this.setToken(data.token);
      // this.setUser(data.user);
      // return data;
    },

    /** 会員登録 */
    async register(payload) {
      // Demo implementation
      const user = {
        id: Date.now(),
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        role: 'user',
      };
      const token = 'demo_token_' + Date.now();
      this.setToken(token);
      this.setUser(user);
      return { user, token };
      // Real API:
      // const data = await request('POST', '/auth/register', payload);
      // this.setToken(data.token);
      // this.setUser(data.user);
      // return data;
    },

    /** ログアウト */
    async logout() {
      this.clear();
      // Real API: await request('POST', '/auth/logout');
    },

    /** プロフィール取得 */
    async getProfile() {
      const user = this.getUser();
      if (user) return user;
      throw new Error('Not authenticated');
      // Real API: return request('GET', '/auth/profile');
    },
  };

  // ================================================================
  //   Bookings
  // ================================================================
  const Bookings = {
    DEMO_BOOKINGS: [],

    /** 予約一覧取得 */
    async list() {
      // Demo: return stored bookings
      return [...this.DEMO_BOOKINGS];
      // Real API: return request('GET', '/bookings');
    },

    /** 予約作成 */
    async create(payload) {
      const booking = {
        id: 'KR-' + Date.now(),
        ...payload,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      this.DEMO_BOOKINGS.push(booking);
      return booking;
      // Real API: return request('POST', '/bookings', payload);
    },

    /** 予約詳細 */
    async get(id) {
      const b = this.DEMO_BOOKINGS.find(x => x.id === id);
      if (!b) throw new Error('予約が見つかりません');
      return b;
      // Real API: return request('GET', `/bookings/${id}`);
    },

    /** 予約キャンセル */
    async cancel(id) {
      const b = this.DEMO_BOOKINGS.find(x => x.id === id);
      if (b) b.status = 'cancelled';
      return b;
      // Real API: return request('DELETE', `/bookings/${id}`);
    },
  };

  // ================================================================
  //   Properties
  // ================================================================
  const Properties = {
    DEMO: [
      {
        id: 'sun',
        name: 'THE SUN',
        location: '北海道札幌市豊平区美園6条7丁目1-7',
        capacity: 11,
        beds: 7,
        bedrooms: 4,
        bathrooms: 2,
        image: 'https://www.genspark.ai/api/files/s/K59E9l7m',
        bookingUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/',
      },
      {
        id: 'moon',
        name: 'THE MOON',
        location: '北海道札幌市豊平区美園6条7丁目',
        capacity: 12,
        beds: 8,
        bedrooms: 4,
        bathrooms: 2,
        image: 'https://www.genspark.ai/api/files/s/U79RlOAt',
        bookingUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/',
      },
      {
        id: 'smile',
        name: 'THE SMILE',
        location: '北海道札幌市東区北8条東16丁目',
        capacity: 10,
        beds: 6,
        bedrooms: 4,
        bathrooms: 1,
        image: 'https://www.genspark.ai/api/files/s/LP6yMCRj',
        bookingUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/',
      },
      {
        id: 'sky',
        name: 'THE SKY',
        location: '北海道札幌市東区北9条東11丁目',
        capacity: 10,
        beds: 4,
        bedrooms: 2,
        bathrooms: 1,
        image: 'https://www.genspark.ai/api/files/s/CWWCQbTG',
        bookingUrl: 'https://booking.airhost.co/ja/ACCOUNT_ID/',
      },
    ],

    /** 物件一覧 */
    async list() {
      return [...this.DEMO];
      // Real API: return request('GET', '/properties');
    },

    /** 物件詳細 */
    async get(id) {
      const p = this.DEMO.find(x => x.id === id);
      if (!p) throw new Error('物件が見つかりません');
      return p;
      // Real API: return request('GET', `/properties/${id}`);
    },
  };

  // ================================================================
  //   Admin (管理者専用)
  // ================================================================
  const Admin = {
    /** 予約一覧（全件） */
    async getBookings(params) {
      // Real API: return request('GET', '/admin/bookings?' + new URLSearchParams(params));
      return [];
    },

    /** 予約ステータス更新 */
    async updateBookingStatus(id, status) {
      // Real API: return request('PATCH', `/admin/bookings/${id}/status`, { status });
      return { id, status };
    },

    /** 問い合わせ一覧 */
    async getInquiries() {
      // Real API: return request('GET', '/admin/inquiries');
      return [];
    },

    /** 問い合わせ解決 */
    async resolveInquiry(id) {
      // Real API: return request('PATCH', `/admin/inquiries/${id}/resolve`);
      return { id, status: 'resolved' };
    },

    /** ユーザー一覧 */
    async getUsers() {
      // Real API: return request('GET', '/admin/users');
      return [];
    },

    /** 統計情報 */
    async getStats() {
      // Real API: return request('GET', '/admin/stats');
      return {
        bookingsThisMonth: 47,
        occupancyRate: 78,
        revenueThisMonth: 1860000,
        openInquiries: 3,
      };
    },
  };

  // ================================================================
  //   Inquiry (問い合わせ)
  // ================================================================
  const Inquiry = {
    /** 問い合わせ送信 */
    async send(payload) {
      // Demo: log to console
      console.info('[KurotenApi.Inquiry.send]', payload);
      return { success: true, id: Date.now() };
      // Real API: return request('POST', '/inquiries', payload);
    },
  };

  // ================================================================
  //   Expose globally
  // ================================================================
  window.KurotenApi = {
    Auth,
    Bookings,
    Properties,
    Admin,
    Inquiry,
    // Utility
    _request: request,
  };

})();
