/* ================================================
   Kuroten Stay Sapporo — Admin Panel JS
   ================================================ */

'use strict';

/* ---- セッション管理（localStorageベース・デモ用） ---- */
const AdminSession = {
  OWNER_EMAIL:    'owner@kuroten-stay.com',
  OWNER_PASSWORD: 'kuroten2025',
  KEY: 'kuroten_admin_session',

  save(user) {
    try { localStorage.setItem(this.KEY, JSON.stringify(user)); } catch(e) {}
  },
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)); } catch(e) { return null; }
  },
  clear() {
    try { localStorage.removeItem(this.KEY); } catch(e) {}
  },
  check() {
    return !!this.load();
  }
};

/* ======================================================
   AdminApp — メインオブジェクト
   ====================================================== */
const AdminApp = {

  currentUser: null,
  charts: {},
  state: {
    currentPage: 'dashboard',
    currentContactId: null,
    currentBookingId: null,
  },

  /* ---------- 初期化 ---------- */
  init() {
    this.bindLoginForm();
    const session = AdminSession.load();
    if (session) {
      this.loginSuccess(session, false);
    }
    this.updateTopbarDate();
    setInterval(() => this.updateTopbarDate(), 60000);
  },

  /* ---------- ログインフォーム ---------- */
  bindLoginForm() {
    const form = document.getElementById('admin-login-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email    = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;
      const errEl    = document.getElementById('login-error-msg');
      const btn      = document.getElementById('login-submit-btn');

      errEl.textContent = '';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';

      // 簡易認証（デモ）
      await new Promise(r => setTimeout(r, 600));

      if (email === AdminSession.OWNER_EMAIL && password === AdminSession.OWNER_PASSWORD) {
        const user = { email, name: 'オーナー', role: 'owner' };
        AdminSession.save(user);
        this.loginSuccess(user, true);
      } else {
        errEl.textContent = 'メールアドレスまたはパスワードが正しくありません。';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> ログイン';
      }
    });
  },

  loginSuccess(user, isNew) {
    this.currentUser = user;
    document.body.classList.add('admin-logged-in');

    const nameEl = document.getElementById('sidebar-user-name');
    if (nameEl) nameEl.textContent = user.name || user.email;

    const avatarEl = document.getElementById('sidebar-avatar');
    if (avatarEl) avatarEl.textContent = (user.name || user.email)[0].toUpperCase();

    if (isNew) this.showToast('ログインしました', 'success');
    this.bindSidebarNav();
    this.bindLogout();
    this.showPage('dashboard');
  },

  /* ---------- サイドバーナビ ---------- */
  bindSidebarNav() {
    document.querySelectorAll('.sidebar-nav-item[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.showPage(btn.getAttribute('data-page'));
      });
    });
  },

  showPage(page) {
    this.state.currentPage = page;

    // sidebar active
    document.querySelectorAll('.sidebar-nav-item[data-page]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-page') === page);
    });

    // content active
    document.querySelectorAll('.admin-page').forEach(el => {
      el.classList.toggle('active', el.id === `page-${page}`);
    });

    // topbar title
    const titles = {
      dashboard:  'ダッシュボード',
      bookings:   '予約管理',
      contacts:   '問い合わせ管理',
      properties: '物件管理',
      users:      'ユーザー一覧',
    };
    const titleEl = document.getElementById('topbar-title');
    if (titleEl) titleEl.textContent = titles[page] || page;

    // load data
    const loaders = {
      dashboard:  () => this.loadDashboard(),
      bookings:   () => this.loadBookings(),
      contacts:   () => this.loadContacts(),
      properties: () => this.loadProperties(),
      users:      () => this.loadUsers(),
    };
    if (loaders[page]) loaders[page]();
  },

  /* ---------- ログアウト ---------- */
  bindLogout() {
    const btn = document.getElementById('admin-logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      AdminSession.clear();
      document.body.classList.remove('admin-logged-in');
      this.currentUser = null;
      this.showToast('ログアウトしました', '');
    });
  },

  /* ---------- トップバー日付 ---------- */
  updateTopbarDate() {
    const el = document.getElementById('topbar-date');
    if (!el) return;
    const now = new Date();
    const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' };
    el.textContent = now.toLocaleDateString('ja-JP', opts);
  },

  /* ======================================================
     DASHBOARD
     ====================================================== */
  async loadDashboard() {
    const stats = await KurotenApi.Mock.getStats();
    // stat cards
    this._setEl('stat-bookings-month', stats.bookingsMonth);
    this._setEl('stat-bookings-change', '');
    this._setEl('stat-revenue-month', `¥${stats.revenueMonth.toLocaleString()}`);
    this._setEl('stat-revenue-change', '');
    this._setEl('stat-current-guests', stats.currentGuests);
    this._setEl('stat-new-contacts', stats.newContacts);

    // badges
    const pendingCount = document.getElementById('pending-count');
    const newContactsCount = document.getElementById('new-contacts-count');
    if (pendingCount) {
      pendingCount.textContent = '2';
      pendingCount.style.display = '';
    }
    if (newContactsCount) {
      newContactsCount.textContent = stats.newContacts;
      newContactsCount.style.display = stats.newContacts > 0 ? '' : 'none';
    }

    // charts
    this.renderBookingsChart(stats.bookingsByMonth);
    this.renderPropertyChart(stats.bookingsByProperty);

    // recent bookings table
    const data = await KurotenApi.Mock.getBookings();
    const tbody = document.getElementById('recent-bookings-body');
    if (tbody) {
      tbody.innerHTML = data.bookings.slice(0, 5).map(b => `
        <tr>
          <td><strong>${b.id}</strong></td>
          <td>${b.propertyLabel}</td>
          <td>${b.guest}</td>
          <td>${b.checkin}</td>
          <td>${b.guests}名</td>
          <td class="amount-value">¥${b.amount.toLocaleString()}</td>
          <td>${this.statusBadge(b.status)}</td>
        </tr>
      `).join('');
    }
  },

  renderBookingsChart(data) {
    const ctx = document.getElementById('bookings-chart');
    if (!ctx) return;
    if (this.charts.bookings) this.charts.bookings.destroy();
    const months = ['2月', '3月', '4月', '5月', '6月', '7月'];
    this.charts.bookings = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: '予約数',
          data: data,
          backgroundColor: 'rgba(212, 175, 55, 0.55)',
          borderColor: '#d4af37',
          borderWidth: 1,
          borderRadius: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8a9bb0', font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#8a9bb0', font: { size: 11 }, stepSize: 5 },
            beginAtZero: true,
          }
        }
      }
    });
  },

  renderPropertyChart(data) {
    const ctx = document.getElementById('property-chart');
    if (!ctx) return;
    if (this.charts.property) this.charts.property.destroy();
    this.charts.property = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['THE SUN', 'THE MOON', 'THE SMILE', 'THE SKY'],
        datasets: [{
          data: data,
          backgroundColor: ['#d4af37', '#4a90d9', '#4caf7d', '#e6994d'],
          borderColor: '#1b2838',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#8a9bb0', font: { size: 11 }, padding: 12 },
          },
        },
        cutout: '65%',
      }
    });
  },

  /* ======================================================
     BOOKINGS
     ====================================================== */
  async loadBookings(params = {}) {
    const data = await KurotenApi.Mock.getBookings(params);
    const tbody = document.getElementById('bookings-table-body');
    const label = document.getElementById('bookings-count-label');
    if (label) label.textContent = `（${data.total}件）`;

    if (!tbody) return;
    if (data.bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">予約が見つかりません</td></tr>';
      return;
    }
    tbody.innerHTML = data.bookings.map(b => `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>${b.propertyLabel}</td>
        <td>${b.guest}</td>
        <td>${b.checkin}</td>
        <td>${b.checkout}</td>
        <td>${b.guests}名</td>
        <td class="amount-value">¥${b.amount.toLocaleString()}</td>
        <td>${this.statusBadge(b.status)}</td>
        <td>
          <button class="action-btn action-btn--outline" onclick="AdminApp.openBookingDetail('${b.id}')">
            <i class="fas fa-eye"></i> 詳細
          </button>
        </td>
      </tr>
    `).join('');

    // showing label
    const showLabel = document.getElementById('bookings-showing-label');
    if (showLabel) showLabel.textContent = `${data.total}件`;

    this.bindBookingFilters();
  },

  bindBookingFilters() {
    // search
    const searchInput = document.getElementById('bookings-search');
    const statusFilter = document.getElementById('bookings-status-filter');
    const propertyFilter = document.getElementById('bookings-property-filter');
    if (!searchInput) return;

    const refresh = () => this.loadBookings({
      q:        searchInput.value,
      status:   statusFilter ? statusFilter.value : '',
      property: propertyFilter ? propertyFilter.value : '',
    });

    searchInput.oninput = refresh;
    if (statusFilter) statusFilter.onchange = refresh;
    if (propertyFilter) propertyFilter.onchange = refresh;
  },

  async openBookingDetail(id) {
    this.state.currentBookingId = id;
    const data = await KurotenApi.Mock.getBookings();
    const booking = data.bookings.find(b => b.id === id);
    if (!booking) return;

    const contentEl = document.getElementById('booking-detail-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">予約コード</div>
            <div class="detail-value"><strong>${booking.id}</strong></div>
          </div>
          <div class="detail-item">
            <div class="detail-label">ステータス</div>
            <div class="detail-value">${this.statusBadge(booking.status)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">施設</div>
            <div class="detail-value">${booking.propertyLabel}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">ゲスト名</div>
            <div class="detail-value">${booking.guest}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">チェックイン</div>
            <div class="detail-value">${booking.checkin}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">チェックアウト</div>
            <div class="detail-value">${booking.checkout}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">人数</div>
            <div class="detail-value">${booking.guests}名</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">合計金額</div>
            <div class="detail-value amount-value">¥${booking.amount.toLocaleString()}</div>
          </div>
        </div>
      `;
    }

    // 確定ボタン（pending のみ表示）
    const confirmBtn = document.getElementById('booking-confirm-btn');
    if (confirmBtn) {
      confirmBtn.style.display = booking.status === 'pending' ? '' : 'none';
    }

    this.openModal('booking-detail-modal');
  },

  confirmBooking() {
    this.showToast('予約を確定しました', 'success');
    this.closeModal('booking-detail-modal');
    this.loadBookings();
  },

  /* ======================================================
     CONTACTS
     ====================================================== */
  async loadContacts(params = {}) {
    const data = await KurotenApi.Mock.getContacts(params);
    const tbody = document.getElementById('contacts-table-body');
    if (!tbody) return;

    if (data.contacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">問い合わせが見つかりません</td></tr>';
      return;
    }
    tbody.innerHTML = data.contacts.map(c => `
      <tr>
        <td>${c.createdAt}</td>
        <td>${c.sender}<br><small style="color:#8a9bb0;">${c.email}</small></td>
        <td>${c.category}</td>
        <td>${c.subject}</td>
        <td>${this.statusBadge(c.status)}</td>
        <td>
          <button class="action-btn action-btn--outline" onclick="AdminApp.openContactReply('${c.id}')">
            <i class="fas fa-reply"></i> 返信
          </button>
        </td>
      </tr>
    `).join('');

    const showLabel = document.getElementById('contacts-showing-label');
    if (showLabel) showLabel.textContent = `${data.total}件`;

    // filter
    const statusFilter = document.getElementById('contacts-status-filter');
    if (statusFilter) {
      statusFilter.onchange = () => this.loadContacts({ status: statusFilter.value });
    }
  },

  async openContactReply(id) {
    this.state.currentContactId = id;
    const data = await KurotenApi.Mock.getContacts();
    const contact = data.contacts.find(c => c.id === id);
    if (!contact) return;

    const contentEl = document.getElementById('contact-detail-content');
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">送信者</div>
            <div class="detail-value">${contact.sender}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">メール</div>
            <div class="detail-value">${contact.email}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">受信日時</div>
            <div class="detail-value">${contact.createdAt}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">ステータス</div>
            <div class="detail-value">${this.statusBadge(contact.status)}</div>
          </div>
        </div>
        <div class="detail-divider"></div>
        <div class="detail-label" style="margin-bottom:8px;">件名: ${contact.subject}</div>
        <div class="detail-message">${contact.message}</div>
      `;
    }

    const replyTextarea = document.getElementById('reply-textarea');
    if (replyTextarea) replyTextarea.value = '';

    this.openModal('contact-reply-modal');
  },

  sendReply() {
    const msg = document.getElementById('reply-textarea')?.value.trim();
    if (!msg) {
      this.showToast('返信内容を入力してください', 'error');
      return;
    }
    this.showToast('返信を送信しました', 'success');
    this.closeModal('contact-reply-modal');
    this.loadContacts();
  },

  /* ======================================================
     PROPERTIES
     ====================================================== */
  async loadProperties() {
    const data = await KurotenApi.Mock.getProperties();
    const grid = document.getElementById('properties-grid');
    if (!grid) return;

    grid.innerHTML = data.properties.map(p => `
      <div class="property-admin-card">
        <img src="${p.img}" alt="${p.label}" class="property-admin-card-img" loading="lazy">
        <div class="property-admin-card-body">
          <div class="property-admin-card-name">${p.label}</div>
          <div class="property-admin-card-spec">
            <i class="fas fa-map-marker-alt"></i> 札幌市${p.address}
          </div>
          <div class="property-admin-card-spec">
            <i class="fas fa-users"></i> 最大${p.capacity}名 ／
            <i class="fas fa-door-open"></i> ${p.bedrooms}寝室 ／
            <i class="fas fa-bath"></i> ${p.bathrooms}バス
          </div>
          <div class="property-admin-card-spec" style="margin-top:4px;">
            ${this.statusBadge('active')}
          </div>
          <div class="property-admin-card-actions">
            <a href="/#${p.id}" target="_blank" class="action-btn action-btn--outline">
              <i class="fas fa-external-link-alt"></i> サイトで確認
            </a>
          </div>
        </div>
      </div>
    `).join('');
  },

  /* ======================================================
     USERS
     ====================================================== */
  async loadUsers(params = {}) {
    const data = await KurotenApi.Mock.getUsers(params);
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (data.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">ユーザーが見つかりません</td></tr>';
      return;
    }
    tbody.innerHTML = data.users.map(u => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td><span class="status-badge ${u.role === 'owner' ? 'status-badge--confirmed' : 'status-badge--active'}">${u.role}</span></td>
        <td>${u.createdAt}</td>
        <td>${u.lastLogin}</td>
        <td>${u.bookings}件</td>
      </tr>
    `).join('');

    const showLabel = document.getElementById('users-showing-label');
    if (showLabel) showLabel.textContent = `${data.total}件`;

    const searchInput = document.getElementById('users-search');
    if (searchInput) {
      searchInput.oninput = () => this.loadUsers({ q: searchInput.value });
    }
  },

  /* ======================================================
     HELPERS
     ====================================================== */
  statusBadge(status) {
    const map = {
      confirmed:   '確定',
      pending:     '仮予約',
      checked_in:  'チェックイン済',
      checked_out: 'チェックアウト済',
      cancelled:   'キャンセル',
      new:         '未対応',
      in_progress: '対応中',
      resolved:    '解決済み',
      closed:      'クローズ',
      active:      '稼働中',
      inactive:    '停止中',
    };
    return `<span class="status-badge status-badge--${status}">${map[status] || status}</span>`;
  },

  openModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'flex';
  },

  closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },

  showToast(message, type = '') {
    const toast = document.getElementById('admin-toast');
    const msg   = document.getElementById('admin-toast-msg');
    if (!toast || !msg) return;
    msg.textContent = message;
    toast.className = `admin-toast${type === 'error' ? ' admin-toast--error' : ''}`;
    requestAnimationFrame(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    });
  },

  _setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },
};

/* モーダルオーバーレイクリックで閉じる */
document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      AdminApp.closeModal(overlay.id);
    }
  });
});

/* 初期化 */
document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});

/* グローバルに公開（インラインonclick用） */
window.AdminApp = AdminApp;
