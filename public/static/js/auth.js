/* ============================================================
   Kuroten Stay Sapporo — auth.js
   ログイン・登録モーダル、ユーザーメニュー、トースト通知
   ============================================================ */

(function () {
  'use strict';

  // ================================================================
  //   Toast 通知
  // ================================================================
  function showToast(message, type = 'success', duration = 3500) {
    let toast = document.getElementById('kuroten-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kuroten-toast';
      toast.className = 'kuroten-toast';
      toast.innerHTML = '<i class="fas fa-check-circle"></i><span class="kuroten-toast-msg"></span>';
      document.body.appendChild(toast);
    }

    const icon = toast.querySelector('i');
    const msg = toast.querySelector('.kuroten-toast-msg') || toast.querySelector('span');

    toast.className = 'kuroten-toast kuroten-toast--' + type;
    icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
    msg.textContent = message;

    toast.classList.add('kuroten-toast--show');
    setTimeout(() => toast.classList.remove('kuroten-toast--show'), duration);
  }

  window.KurotenToast = showToast;

  // ================================================================
  //   ヘッダー認証ウィジェットの更新
  // ================================================================
  function updateAuthWidget() {
    const container = document.getElementById('auth-header-widget');
    if (!container) return;

    const api = window.KurotenApi;
    if (!api) return;

    if (api.Auth.isLoggedIn()) {
      const user = api.Auth.getUser();
      const name = user?.name || user?.email || 'ゲスト';
      container.innerHTML = `
        <div class="auth-user-menu" id="auth-user-menu">
          <button class="auth-user-btn" id="auth-user-btn" aria-haspopup="true" aria-expanded="false">
            <i class="fas fa-user-circle"></i>
            <span>${escapeHTML(name)}</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="auth-user-dropdown" id="auth-user-dropdown" hidden>
            <button class="auth-dropdown-item" onclick="KurotenAuth.openMyBookings()">
              <i class="fas fa-calendar-check"></i> 予約一覧
            </button>
            <hr class="auth-dropdown-divider">
            <button class="auth-dropdown-item auth-dropdown-item--danger" onclick="KurotenAuth.logout()">
              <i class="fas fa-sign-out-alt"></i> ログアウト
            </button>
          </div>
        </div>
      `;
      initUserMenu();
    } else {
      container.innerHTML = `
        <div class="auth-guest-btns">
          <button class="auth-btn auth-btn--login" onclick="KurotenAuth.openLogin()">ログイン</button>
          <button class="auth-btn auth-btn--register" onclick="KurotenAuth.openRegister()">会員登録</button>
        </div>
      `;
    }
  }

  function initUserMenu() {
    const btn = document.getElementById('auth-user-btn');
    const dropdown = document.getElementById('auth-user-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      dropdown.hidden = expanded;
    });

    document.addEventListener('click', e => {
      if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
        btn.setAttribute('aria-expanded', 'false');
        dropdown.hidden = true;
      }
    });
  }

  // ================================================================
  //   モーダル ヘルパー
  // ================================================================
  function createOverlay(content) {
    const overlay = document.createElement('div');
    overlay.className = 'auth-modal-overlay';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal(overlay);
    });
    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        closeModal(overlay);
        document.removeEventListener('keydown', handler);
      }
    });
    return overlay;
  }

  function closeModal(overlay) {
    if (!overlay) return;
    overlay.remove();
    document.body.style.overflow = '';
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ================================================================
  //   ログインモーダル
  // ================================================================
  function openLogin() {
    const overlay = createOverlay(`
      <div class="auth-modal" role="dialog" aria-labelledby="login-title" aria-modal="true">
        <button class="auth-modal-close" onclick="this.closest('.auth-modal-overlay').remove(); document.body.style.overflow='';" aria-label="閉じる">
          <i class="fas fa-times"></i>
        </button>
        <div class="auth-modal-header">
          <h2 class="auth-modal-title" id="login-title">ログイン</h2>
          <p class="auth-modal-sub">Kuroten Stay Sapporo アカウント</p>
        </div>
        <div id="login-error-banner" class="auth-error-banner" style="display:none"></div>
        <form class="auth-form" id="login-form" onsubmit="KurotenAuth._submitLogin(event)">
          <div class="auth-form-group">
            <label class="auth-label" for="login-email">メールアドレス</label>
            <input class="auth-input" type="email" id="login-email" placeholder="email@example.com" required autocomplete="email">
          </div>
          <div class="auth-form-group">
            <label class="auth-label" for="login-pw">パスワード</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="password" id="login-pw" placeholder="••••••••" required autocomplete="current-password">
              <button type="button" class="auth-pw-toggle" aria-label="パスワードを表示/非表示" onclick="togglePw('login-pw', this)">
                <i class="fas fa-eye"></i>
              </button>
            </div>
          </div>
          <button type="submit" class="auth-submit-btn" id="login-submit-btn">
            <i class="fas fa-sign-in-alt"></i> ログイン
          </button>
        </form>
        <div class="auth-modal-footer">
          アカウントをお持ちでない方は
          <button class="auth-link-btn" onclick="this.closest('.auth-modal-overlay').remove(); document.body.style.overflow=''; KurotenAuth.openRegister();">
            新規会員登録
          </button>
        </div>
      </div>
    `);

    overlay.querySelector('#login-email').focus();
  }

  async function submitLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-pw').value;
    const btn = document.getElementById('login-submit-btn');
    const errBanner = document.getElementById('login-error-banner');

    errBanner.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ログイン中...';

    try {
      await window.KurotenApi.Auth.login(email, pw);
      const overlay = document.querySelector('.auth-modal-overlay');
      closeModal(overlay);
      updateAuthWidget();
      showToast('ログインしました', 'success');
    } catch (err) {
      errBanner.textContent = err.message || 'ログインに失敗しました';
      errBanner.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> ログイン';
    }
  }

  // ================================================================
  //   会員登録モーダル
  // ================================================================
  function openRegister() {
    const overlay = createOverlay(`
      <div class="auth-modal" role="dialog" aria-labelledby="register-title" aria-modal="true">
        <button class="auth-modal-close" onclick="this.closest('.auth-modal-overlay').remove(); document.body.style.overflow='';" aria-label="閉じる">
          <i class="fas fa-times"></i>
        </button>
        <div class="auth-modal-header">
          <h2 class="auth-modal-title" id="register-title">新規会員登録</h2>
          <p class="auth-modal-sub">無料で登録して予約を管理できます</p>
        </div>
        <div id="register-error-banner" class="auth-error-banner" style="display:none"></div>
        <form class="auth-form" id="register-form" onsubmit="KurotenAuth._submitRegister(event)">
          <div class="auth-form-row">
            <div class="auth-form-group">
              <label class="auth-label" for="reg-lastname">姓</label>
              <input class="auth-input" type="text" id="reg-lastname" placeholder="山田" required>
            </div>
            <div class="auth-form-group">
              <label class="auth-label" for="reg-firstname">名</label>
              <input class="auth-input" type="text" id="reg-firstname" placeholder="太郎" required>
            </div>
          </div>
          <div class="auth-form-group">
            <label class="auth-label" for="reg-email">メールアドレス</label>
            <input class="auth-input" type="email" id="reg-email" placeholder="email@example.com" required autocomplete="email">
            <div class="auth-field-error" id="reg-email-error"></div>
          </div>
          <div class="auth-form-group">
            <label class="auth-label" for="reg-pw">パスワード <span class="auth-optional">（8文字以上）</span></label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="password" id="reg-pw" placeholder="••••••••" required minlength="8" autocomplete="new-password">
              <button type="button" class="auth-pw-toggle" aria-label="パスワードを表示/非表示" onclick="togglePw('reg-pw', this)">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="auth-field-error" id="reg-pw-error"></div>
          </div>
          <div class="auth-form-group">
            <label class="auth-label" for="reg-phone">電話番号 <span class="auth-optional">（任意）</span></label>
            <input class="auth-input" type="tel" id="reg-phone" placeholder="090-0000-0000">
          </div>
          <button type="submit" class="auth-submit-btn" id="register-submit-btn">
            <i class="fas fa-user-plus"></i> 会員登録する
          </button>
        </form>
        <div class="auth-modal-footer">
          すでにアカウントをお持ちの方は
          <button class="auth-link-btn" onclick="this.closest('.auth-modal-overlay').remove(); document.body.style.overflow=''; KurotenAuth.openLogin();">
            ログイン
          </button>
        </div>
      </div>
    `);

    overlay.querySelector('#reg-lastname').focus();
  }

  async function submitRegister(e) {
    e.preventDefault();
    const lastname = document.getElementById('reg-lastname').value.trim();
    const firstname = document.getElementById('reg-firstname').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-pw').value;
    const phone = document.getElementById('reg-phone').value.trim();

    const emailErr = document.getElementById('reg-email-error');
    const pwErr = document.getElementById('reg-pw-error');
    emailErr.textContent = '';
    pwErr.textContent = '';

    if (pw.length < 8) {
      pwErr.textContent = 'パスワードは8文字以上で入力してください';
      return;
    }

    const btn = document.getElementById('register-submit-btn');
    const errBanner = document.getElementById('register-error-banner');
    errBanner.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登録中...';

    try {
      await window.KurotenApi.Auth.register({
        name: lastname + ' ' + firstname,
        email,
        password: pw,
        phone: phone || undefined,
      });
      const overlay = document.querySelector('.auth-modal-overlay');
      closeModal(overlay);
      updateAuthWidget();
      showToast('会員登録が完了しました！ようこそ、Kuroten Stay Sapporoへ！', 'success', 4000);
    } catch (err) {
      errBanner.textContent = err.message || '登録に失敗しました';
      errBanner.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> 会員登録する';
    }
  }

  // ================================================================
  //   マイ予約モーダル
  // ================================================================
  function openMyBookings() {
    const overlay = createOverlay(`
      <div class="auth-modal auth-modal--wide" role="dialog" aria-labelledby="mybookings-title" aria-modal="true">
        <button class="auth-modal-close" onclick="this.closest('.auth-modal-overlay').remove(); document.body.style.overflow='';" aria-label="閉じる">
          <i class="fas fa-times"></i>
        </button>
        <div class="auth-modal-header">
          <h2 class="auth-modal-title" id="mybookings-title">予約一覧</h2>
          <p class="auth-modal-sub">現在の予約状況をご確認いただけます</p>
        </div>
        <div id="mybookings-content">
          <p class="auth-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</p>
        </div>
      </div>
    `);

    loadMyBookings(overlay);
  }

  async function loadMyBookings(overlay) {
    const content = overlay.querySelector('#mybookings-content');
    try {
      const bookings = await window.KurotenApi.Bookings.list();
      if (!bookings.length) {
        content.innerHTML = '<p class="auth-empty"><i class="fas fa-calendar-times"></i> 予約がありません</p>';
        return;
      }
      content.innerHTML = `
        <div class="bookings-list">
          ${bookings.map(b => `
            <div class="booking-item">
              <div class="booking-item-header">
                <span class="booking-code">${escapeHTML(b.id)}</span>
                <span class="booking-status booking-status--${escapeHTML(b.status)}">${statusLabel(b.status)}</span>
              </div>
              <div class="booking-item-body">
                <p><strong>施設:</strong> ${escapeHTML(b.property || '')}</p>
                <p><strong>人数:</strong> ${escapeHTML(String(b.guests || ''))}名</p>
                <p><strong>チェックイン:</strong> ${escapeHTML(b.checkin || '')}</p>
                <p><strong>チェックアウト:</strong> ${escapeHTML(b.checkout || '')}</p>
              </div>
              ${b.status === 'pending' || b.status === 'confirmed' ? `
                <div class="booking-item-actions">
                  <button class="booking-cancel-btn" onclick="KurotenAuth._cancelBooking('${escapeHTML(b.id)}', this)">
                    キャンセル
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      content.innerHTML = `<p class="auth-error-text"><i class="fas fa-exclamation-triangle"></i> ${err.message}</p>`;
    }
  }

  function statusLabel(s) {
    const map = {
      pending: '未確認',
      confirmed: '確認済',
      checked_in: '滞在中',
      checked_out: 'チェックアウト済',
      cancelled: 'キャンセル',
    };
    return map[s] || s;
  }

  async function cancelBooking(id, btn) {
    if (!confirm('この予約をキャンセルしますか？')) return;
    btn.disabled = true;
    btn.textContent = 'キャンセル中...';
    try {
      await window.KurotenApi.Bookings.cancel(id);
      showToast('予約をキャンセルしました', 'success');
      // Reload bookings
      const overlay = document.querySelector('.auth-modal-overlay');
      if (overlay) loadMyBookings(overlay);
    } catch (err) {
      showToast('キャンセルに失敗しました: ' + err.message, 'error');
      btn.disabled = false;
      btn.textContent = 'キャンセル';
    }
  }

  // ================================================================
  //   パスワード表示トグル
  // ================================================================
  function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
      input.type = 'text';
      icon.className = 'fas fa-eye-slash';
      btn.setAttribute('aria-label', 'パスワードを非表示');
    } else {
      input.type = 'password';
      icon.className = 'fas fa-eye';
      btn.setAttribute('aria-label', 'パスワードを表示');
    }
  }
  window.togglePw = togglePw;

  // ================================================================
  //   ログアウト
  // ================================================================
  async function logout() {
    await window.KurotenApi.Auth.logout();
    updateAuthWidget();
    showToast('ログアウトしました', 'success');
  }

  // ================================================================
  //   初期化
  // ================================================================
  function init() {
    // Inject auth widget into header if placeholder exists
    const placeholder = document.getElementById('auth-header-widget');
    if (!placeholder) {
      // Create widget placeholder in header
      const header = document.querySelector('.header-inner');
      if (header) {
        const widget = document.createElement('div');
        widget.id = 'auth-header-widget';
        widget.className = 'auth-header-btns';
        header.appendChild(widget);
      }
    }
    updateAuthWidget();
  }

  // ================================================================
  //   Expose global API
  // ================================================================
  window.KurotenAuth = {
    openLogin,
    openRegister,
    openMyBookings,
    logout,
    updateAuthWidget,
    showToast,
    // Internal (called from inline onclick)
    _submitLogin: submitLogin,
    _submitRegister: submitRegister,
    _cancelBooking: cancelBooking,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
