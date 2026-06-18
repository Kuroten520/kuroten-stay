/**
 * Kuroten Stay Sapporo — 管理画面メインロジック
 * AdminApp オブジェクトとして公開
 *
 * 依存: /static/js/api.js (window.KurotenApi)
 */
(function (global) {
  'use strict';

  const AdminApp = {
    currentBookingId: null,
    currentContactId: null,

    /* ------------------------------------------------------------------ */
    /* 初期化                                                               */
    /* ------------------------------------------------------------------ */
    async init() {
      // 日付表示
      const dateEl = document.getElementById('topbar-date');
      if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('ja-JP', {
          year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
        });
      }

      // ログイン状態確認
      const token = localStorage.getItem('kuroten_access_token');
      const user  = JSON.parse(localStorage.getItem('kuroten_user') || 'null');
      if (token && user?.role === 'owner') {
        this.showDashboard(user);
      } else {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'flex';
      }

      // ログインフォーム
      const loginForm = document.getElementById('admin-login-form');
      if (loginForm) loginForm.addEventListener('submit', this.handleLogin.bind(this));

      // サイドバーナビ
      document.querySelectorAll('.sidebar-nav-item[data-page]').forEach(btn => {
        btn.addEventListener('click', () => this.showPage(btn.dataset.page));
      });

      // ログアウト
      const logoutBtn = document.getElementById('admin-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await window.KurotenApi?.Auth.logout();
        });
      }

      // フィルター
      const bookingsStatusFilter   = document.getElementById('bookings-status-filter');
      const bookingsPropertyFilter = document.getElementById('bookings-property-filter');
      const contactsStatusFilter   = document.getElementById('contacts-status-filter');
      if (bookingsStatusFilter)   bookingsStatusFilter.addEventListener('change', () => this.loadBookings());
      if (bookingsPropertyFilter) bookingsPropertyFilter.addEventListener('change', () => this.loadBookings());
      if (contactsStatusFilter)   contactsStatusFilter.addEventListener('change', () => this.loadContacts());

      // 検索フィールド（デバウンス付き）
      const usersSearch = document.getElementById('users-search');
      if (usersSearch) {
        let timer;
        usersSearch.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => this.loadUsers(), 400);
        });
      }
    },

    /* ------------------------------------------------------------------ */
    /* ログイン処理                                                         */
    /* ------------------------------------------------------------------ */
    async handleLogin(e) {
      e.preventDefault();
      const email    = document.getElementById('admin-email').value.trim();
      const password = document.getElementById('admin-password').value;
      const errEl    = document.getElementById('login-error-msg');
      const btn      = document.getElementById('login-submit-btn');

      errEl.style.display = 'none';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';

      try {
        const user = await window.KurotenApi.Auth.login({ email, password });
        if (user.role !== 'owner') {
          await window.KurotenApi.Auth.logout();
          throw new Error('オーナーアカウントでログインしてください');
        }
        this.showDashboard(user);
      } catch (err) {
        errEl.textContent = err.message;
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> ログイン';
      }
    },

    /* ------------------------------------------------------------------ */
    /* ダッシュボード表示                                                   */
    /* ------------------------------------------------------------------ */
    showDashboard(user) {
      const loginScreen = document.getElementById('login-screen');
      if (loginScreen) loginScreen.style.display = 'none';

      const name = user.firstName || user.email;
      const nameEl = document.getElementById('sidebar-user-name');
      const avatarEl = document.getElementById('sidebar-avatar');
      if (nameEl) nameEl.textContent = name;
      if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();

      this.showPage('dashboard');
    },

    /* ------------------------------------------------------------------ */
    /* ページ切り替え                                                       */
    /* ------------------------------------------------------------------ */
    showPage(page) {
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.sidebar-nav-item').forEach(b => b.classList.remove('active'));

      const pageEl = document.getElementById(`page-${page}`);
      const navBtn = document.querySelector(`.sidebar-nav-item[data-page="${page}"]`);
      if (pageEl) pageEl.classList.add('active');
      if (navBtn) navBtn.classList.add('active');

      const titles = {
        dashboard:  'ダッシュボード',
        bookings:   '予約管理',
        contacts:   '問い合わせ管理',
        properties: '物件管理',
        users:      'ユーザー一覧',
      };
      const topbarTitle = document.getElementById('topbar-title');
      if (topbarTitle) topbarTitle.textContent = titles[page] || page;

      // 初回ロード
      if (page === 'dashboard')  this.loadDashboard();
      if (page === 'bookings')   this.loadBookings();
      if (page === 'contacts')   this.loadContacts();
      if (page === 'properties') this.loadProperties();
      if (page === 'users')      this.loadUsers();
    },

    /* ------------------------------------------------------------------ */
    /* ダッシュボードデータ                                                 */
    /* ------------------------------------------------------------------ */
    async loadDashboard() {
      try {
        const stats = await window.KurotenApi.Admin.getStats();

        this._setText('stat-bookings-month', stats.bookingsThisMonth ?? '—');
        this._setText('stat-revenue-month',
          stats.revenueThisMonth ? `¥${(stats.revenueThisMonth / 10000).toFixed(1)}万` : '—');
        this._setHTML('stat-current-guests', `${stats.currentGuests ?? '—'}<span>名</span>`);
        this._setText('stat-new-contacts', stats.newContacts ?? '—');

        // バッジ更新
        const pc = document.getElementById('pending-count');
        const nc = document.getElementById('new-contacts-count');
        if (pc && stats.pendingBookings > 0) {
          pc.textContent = stats.pendingBookings;
          pc.style.display = 'flex';
        }
        if (nc && stats.newContacts > 0) {
          nc.textContent = stats.newContacts;
          nc.style.display = 'flex';
        }

        this.renderBookingsChart(stats.monthlyBookings || []);
        this.renderPropertyChart(stats.propertyBreakdown || []);
        this.loadRecentBookings();
      } catch (_) {
        this.renderMockDashboard();
      }
    },

    renderMockDashboard() {
      this._setText('stat-bookings-month', '—');
      this._setText('stat-revenue-month',  '—');
      this._setHTML('stat-current-guests', '—<span>名</span>');
      this._setText('stat-new-contacts',   '—');

      this.renderBookingsChart([
        { month: '1月', count: 0 }, { month: '2月', count: 0 },
        { month: '3月', count: 0 }, { month: '4月', count: 0 },
        { month: '5月', count: 0 }, { month: '6月', count: 0 },
      ]);
      this.renderPropertyChart([
        { name: 'THE SUN', count: 1 }, { name: 'THE MOON',  count: 1 },
        { name: 'THE SMILE', count: 1 }, { name: 'THE SKY', count: 1 },
      ]);

      this._setHTML('recent-bookings-body',
        '<tr><td colspan="7" class="admin-empty"><i class="fas fa-plug"></i>APIに接続するとデータが表示されます</td></tr>');
    },

    renderBookingsChart(data) {
      const canvas = document.getElementById('bookings-chart');
      if (!canvas || !global.Chart) return;
      const ctx = canvas.getContext('2d');
      if (global._bookingsChart) global._bookingsChart.destroy();
      global._bookingsChart = new global.Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(d => d.month),
          datasets: [{
            label: '予約数',
            data: data.map(d => d.count),
            backgroundColor: 'rgba(184,151,58,0.6)',
            borderColor: 'rgba(184,151,58,1)',
            borderWidth: 2,
            borderRadius: 4,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', stepSize: 1 }, beginAtZero: true },
          },
        },
      });
    },

    renderPropertyChart(data) {
      const canvas = document.getElementById('property-chart');
      if (!canvas || !global.Chart) return;
      const ctx = canvas.getContext('2d');
      if (global._propertyChart) global._propertyChart.destroy();
      global._propertyChart = new global.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.name),
          datasets: [{
            data: data.map(d => d.count),
            backgroundColor: [
              'rgba(184,151,58,0.8)',
              'rgba(79,168,255,0.8)',
              'rgba(0,200,100,0.8)',
              'rgba(255,200,0,0.8)',
            ],
            borderColor: '#181830',
            borderWidth: 3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: 'rgba(255,255,255,0.6)', padding: 12, font: { size: 11 } },
            },
          },
        },
      });
    },

    /* ------------------------------------------------------------------ */
    /* 最近の予約                                                           */
    /* ------------------------------------------------------------------ */
    async loadRecentBookings() {
      const tbody = document.getElementById('recent-bookings-body');
      if (!tbody) return;
      try {
        const { bookings } = await window.KurotenApi.Admin.listBookings({ limit: 5 });
        if (!bookings?.length) {
          tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">予約がありません</td></tr>';
          return;
        }
        tbody.innerHTML = bookings.map(b => `
          <tr>
            <td><code style="color:var(--gold);font-size:0.8rem;">${this._esc(b.bookingCode)}</code></td>
            <td>${this._esc(b.propertySlug?.toUpperCase() || '—')}</td>
            <td>${this._esc(b.guestName || '—')}</td>
            <td>${this._esc(b.checkinDate || '—')}</td>
            <td>${b.guestCount || '—'}名</td>
            <td>¥${(b.totalPrice || 0).toLocaleString()}</td>
            <td><span class="badge badge--${this._esc(b.status)}">${this.statusLabel(b.status)}</span></td>
          </tr>
        `).join('');
      } catch (_) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">APIに接続するとデータが表示されます</td></tr>';
      }
    },

    /* ------------------------------------------------------------------ */
    /* 予約一覧                                                             */
    /* ------------------------------------------------------------------ */
    async loadBookings() {
      const tbody = document.getElementById('bookings-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="9" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</td></tr>';

      try {
        const status   = document.getElementById('bookings-status-filter')?.value;
        const property = document.getElementById('bookings-property-filter')?.value;
        const { bookings, total } = await window.KurotenApi.Admin.listBookings({
          status:       status   || undefined,
          propertySlug: property || undefined,
        });

        this._setText('bookings-count-label', `全${total || 0}件`);
        this._setText('bookings-showing-label', `${bookings?.length || 0}件表示中`);

        if (!bookings?.length) {
          tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">予約がありません</td></tr>';
          return;
        }
        tbody.innerHTML = bookings.map(b => `
          <tr>
            <td><code style="color:var(--gold);font-size:0.78rem;">${this._esc(b.bookingCode)}</code></td>
            <td>${this._esc(b.propertySlug?.toUpperCase() || '—')}</td>
            <td>
              <div style="font-weight:500;">${this._esc(b.guestName || '—')}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${this._esc(b.guestEmail || '')}</div>
            </td>
            <td>${this._esc(b.checkinDate || '—')}</td>
            <td>${this._esc(b.checkoutDate || '—')}</td>
            <td>${b.guestCount || '—'}名</td>
            <td>¥${(b.totalPrice || 0).toLocaleString()}</td>
            <td><span class="badge badge--${this._esc(b.status)}">${this.statusLabel(b.status)}</span></td>
            <td>
              <div class="actions-cell">
                <button class="action-btn action-btn--primary"
                        onclick="AdminApp.showBookingDetail('${this._esc(b.id)}')">
                  <i class="fas fa-eye"></i> 詳細
                </button>
                ${b.status === 'pending' ? `
                  <button class="action-btn action-btn--success"
                          onclick="AdminApp.updateBookingStatus('${this._esc(b.id)}','confirmed')">
                    <i class="fas fa-check"></i> 確定
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `).join('');
      } catch (_) {
        tbody.innerHTML = '<tr><td colspan="9" class="admin-empty">APIに接続するとデータが表示されます</td></tr>';
        this._setText('bookings-showing-label', '—件');
      }
    },

    async showBookingDetail(bookingId) {
      this.currentBookingId = bookingId;
      const modal = document.getElementById('booking-detail-modal');
      const content = document.getElementById('booking-detail-content');
      const confirmBtn = document.getElementById('booking-confirm-btn');
      if (!modal) return;

      modal.style.display = 'flex';
      content.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>';
      confirmBtn.style.display = 'none';

      try {
        const b = await window.KurotenApi.Bookings.get(bookingId);
        content.innerHTML = [
          ['予約コード',  `<code style="color:var(--gold)">${this._esc(b.bookingCode)}</code>`],
          ['施設',        this._esc(b.propertySlug?.toUpperCase())],
          ['ゲスト名',    this._esc(b.guestName)],
          ['メール',      this._esc(b.guestEmail)],
          ['電話番号',    this._esc(b.guestPhone || '—')],
          ['チェックイン',this._esc(b.checkinDate)],
          ['チェックアウト',this._esc(b.checkoutDate)],
          ['宿泊数',      `${b.nights}泊`],
          ['人数',        `${b.guestCount}名`],
          ['宿泊料金',    `¥${((b.pricePerNight || 0) * (b.nights || 1)).toLocaleString()}`],
          ['清掃料金',    `¥${(b.cleaningFee || 0).toLocaleString()}`],
          ['合計金額',    `<strong style="color:var(--gold)">¥${(b.totalPrice || 0).toLocaleString()}</strong>`],
          ['ステータス',  `<span class="badge badge--${this._esc(b.status)}">${this.statusLabel(b.status)}</span>`],
          ['ゲストメモ',  this._esc(b.guestNote || '—')],
        ].map(([l, v]) =>
          `<div class="detail-row"><span class="detail-label">${l}</span><span class="detail-value">${v}</span></div>`
        ).join('');

        if (b.status === 'pending') {
          confirmBtn.style.display = 'inline-flex';
        }
      } catch (_) {
        content.innerHTML = '<p class="admin-empty">データの取得に失敗しました</p>';
      }
    },

    async confirmBooking() {
      if (!this.currentBookingId) return;
      try {
        await window.KurotenApi.Admin.updateBookingStatus(this.currentBookingId, 'confirmed');
        this.closeModal('booking-detail-modal');
        this.showToast('予約を確定しました', 'success');
        this.loadBookings();
      } catch (err) {
        this.showToast(`エラー: ${err.message}`, 'error');
      }
    },

    async updateBookingStatus(bookingId, status) {
      try {
        await window.KurotenApi.Admin.updateBookingStatus(bookingId, status);
        this.showToast('ステータスを更新しました', 'success');
        this.loadBookings();
      } catch (err) {
        this.showToast(`エラー: ${err.message}`, 'error');
      }
    },

    /* ------------------------------------------------------------------ */
    /* 問い合わせ管理                                                       */
    /* ------------------------------------------------------------------ */
    async loadContacts() {
      const tbody = document.getElementById('contacts-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</td></tr>';

      try {
        const status = document.getElementById('contacts-status-filter')?.value;
        const { contacts, total } = await window.KurotenApi.Admin.listContacts({
          status: status || undefined,
        });
        this._setText('contacts-showing-label', `${contacts?.length || 0}件表示中`);

        if (!contacts?.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">問い合わせがありません</td></tr>';
          return;
        }
        const catLabels = {
          booking_inquiry: '予約問い合わせ', cancellation: 'キャンセル',
          facility: '設備', access: 'アクセス', other: 'その他',
        };
        tbody.innerHTML = contacts.map(c => `
          <tr>
            <td style="font-size:0.8rem;color:var(--text-muted);">
              ${new Date(c.createdAt).toLocaleDateString('ja-JP')}
            </td>
            <td>
              <div style="font-weight:500;">${this._esc(c.name)}</div>
              <div style="font-size:0.75rem;color:var(--text-muted);">${this._esc(c.email)}</div>
            </td>
            <td><span style="font-size:0.78rem;">${catLabels[c.category] || this._esc(c.category)}</span></td>
            <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${this._esc(c.subject)}
            </td>
            <td><span class="badge badge--${this._esc(c.status)}">${this.contactStatusLabel(c.status)}</span></td>
            <td>
              <button class="action-btn action-btn--primary"
                      onclick="AdminApp.showContactReply('${this._esc(c.id)}')">
                <i class="fas fa-reply"></i> 返信
              </button>
            </td>
          </tr>
        `).join('');
      } catch (_) {
        tbody.innerHTML = '<tr><td colspan="6" class="admin-empty">APIに接続するとデータが表示されます</td></tr>';
      }
    },

    async showContactReply(contactId) {
      this.currentContactId = contactId;
      const modal   = document.getElementById('contact-reply-modal');
      const content = document.getElementById('contact-detail-content');
      const textarea = document.getElementById('reply-textarea');
      if (!modal) return;

      if (textarea) textarea.value = '';
      modal.style.display = 'flex';
      content.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i></div>';

      try {
        // 問い合わせ詳細取得（実際はAPIから）
        const { contacts } = await window.KurotenApi.Admin.listContacts();
        const c = contacts?.find(c => c.id === contactId);
        if (c) {
          content.innerHTML = `
            <div class="detail-row">
              <span class="detail-label">送信者</span>
              <span class="detail-value">${this._esc(c.name)} &lt;${this._esc(c.email)}&gt;</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">件名</span>
              <span class="detail-value">${this._esc(c.subject)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">メッセージ</span>
              <span class="detail-value" style="white-space:pre-wrap;text-align:left;">
                ${this._esc(c.message)}
              </span>
            </div>
          `;
        } else {
          content.innerHTML = `
            <div class="detail-row">
              <span class="detail-label">問い合わせID</span>
              <span class="detail-value">${this._esc(contactId)}</span>
            </div>
          `;
        }
      } catch (_) {
        content.innerHTML = `
          <div class="detail-row">
            <span class="detail-label">問い合わせID</span>
            <span class="detail-value">${this._esc(contactId)}</span>
          </div>
        `;
      }
    },

    async sendReply() {
      const textarea = document.getElementById('reply-textarea');
      const reply = textarea?.value.trim();
      if (!reply) { this.showToast('返信内容を入力してください', 'error'); return; }

      try {
        await window.KurotenApi.Admin.replyContact(this.currentContactId, { reply });
        this.closeModal('contact-reply-modal');
        this.showToast('返信を送信しました', 'success');
        this.loadContacts();
      } catch (err) {
        this.showToast(`エラー: ${err.message}`, 'error');
      }
    },

    /* ------------------------------------------------------------------ */
    /* 物件管理                                                             */
    /* ------------------------------------------------------------------ */
    async loadProperties() {
      const grid = document.getElementById('properties-grid');
      if (!grid) return;
      grid.innerHTML = '<div class="admin-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>';

      try {
        const properties = await window.KurotenApi.Properties.list();
        grid.innerHTML = properties.map(p => `
          <div class="property-admin-card">
            <div class="property-admin-card-header">
              <span class="property-admin-card-name">${this._esc(p.nameJa)}</span>
              <span class="badge ${p.isActive ? 'badge--confirmed' : 'badge--cancelled'}">
                ${p.isActive ? '公開中' : '非公開'}
              </span>
            </div>
            <div class="property-admin-card-body">
              ${[
                ['最大定員', `${p.maxGuests}名`],
                ['寝室数',   `${p.bedrooms}部屋`],
                ['ベッド数', `${p.beds}台`],
                ['バスルーム', `${p.bathrooms}室`],
                ['1泊料金', `¥${(p.pricePerNight || 0).toLocaleString()}`],
                ['清掃料金', `¥${(p.cleaningFee || 0).toLocaleString()}`],
                ['住所', this._esc(p.addressJa || '—')],
              ].map(([l, v]) => `
                <div class="property-stat-row"><span>${l}</span><span>${v}</span></div>
              `).join('')}
            </div>
            <div class="property-admin-card-footer">
              <button class="action-btn action-btn--primary"
                      onclick="AdminApp.editProperty('${this._esc(p.id)}')">
                <i class="fas fa-edit"></i> 編集
              </button>
            </div>
          </div>
        `).join('');
      } catch (_) {
        grid.innerHTML = '<div class="admin-empty"><i class="fas fa-plug"></i>APIに接続するとデータが表示されます</div>';
      }
    },

    editProperty(propertyId) {
      this.showToast('物件編集機能はバックエンド接続後に利用できます', 'error');
    },

    /* ------------------------------------------------------------------ */
    /* ユーザー一覧                                                         */
    /* ------------------------------------------------------------------ */
    async loadUsers() {
      const tbody = document.getElementById('users-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" class="admin-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</td></tr>';

      try {
        const search = document.getElementById('users-search')?.value.trim() || '';
        const { users, total } = await window.KurotenApi.Admin.listUsers({
          search: search || undefined,
        });
        this._setText('users-showing-label', `${users?.length || 0}件表示中`);

        if (!users?.length) {
          tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">ユーザーがいません</td></tr>';
          return;
        }
        tbody.innerHTML = users.map(u => `
          <tr>
            <td>
              <div style="font-weight:500;">${this._esc(u.lastName || '')} ${this._esc(u.firstName || '')}</div>
            </td>
            <td style="font-size:0.83rem;">${this._esc(u.email)}</td>
            <td style="font-size:0.83rem;">${this._esc(u.phone || '—')}</td>
            <td><span class="badge badge--${this._esc(u.role)}">${this._esc(u.role)}</span></td>
            <td style="font-size:0.78rem;color:var(--text-muted);">
              ${new Date(u.createdAt).toLocaleDateString('ja-JP')}
            </td>
            <td style="font-size:0.78rem;color:var(--text-muted);">
              ${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('ja-JP') : '—'}
            </td>
            <td>${u.bookingCount || 0}件</td>
          </tr>
        `).join('');
      } catch (_) {
        tbody.innerHTML = '<tr><td colspan="7" class="admin-empty">APIに接続するとデータが表示されます</td></tr>';
      }
    },

    /* ------------------------------------------------------------------ */
    /* モーダル                                                             */
    /* ------------------------------------------------------------------ */
    closeModal(id) {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    },

    /* ------------------------------------------------------------------ */
    /* トースト通知                                                         */
    /* ------------------------------------------------------------------ */
    showToast(msg, type = 'success') {
      const toast = document.getElementById('admin-toast');
      const msgEl = document.getElementById('admin-toast-msg');
      const icon  = toast?.querySelector('i');
      if (!toast || !msgEl) return;

      msgEl.textContent = msg;
      toast.className = `admin-toast admin-toast--${type} show`;
      if (icon) {
        icon.className = `fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`;
      }
      clearTimeout(this._toastTimer);
      this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
    },

    /* ------------------------------------------------------------------ */
    /* ユーティリティ                                                       */
    /* ------------------------------------------------------------------ */
    statusLabel(s) {
      return ({
        pending:     '仮予約',
        confirmed:   '確定',
        checked_in:  'チェックイン済',
        checked_out: 'チェックアウト済',
        cancelled:   'キャンセル',
        no_show:     'ノーショー',
      })[s] || s;
    },

    contactStatusLabel(s) {
      return ({
        new:         '未対応',
        in_progress: '対応中',
        resolved:    '解決済み',
        closed:      'クローズ',
      })[s] || s;
    },

    /** HTML エスケープ */
    _esc(str) {
      if (str == null) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    _setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    },

    _setHTML(id, html) {
      const el = document.getElementById(id);
      if (el) el.innerHTML = html;
    },
  };

  /* 全画面グローバルに公開 */
  global.AdminApp = AdminApp;

  /* DOM 準備完了後に起動 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AdminApp.init());
  } else {
    AdminApp.init();
  }

})(window);
