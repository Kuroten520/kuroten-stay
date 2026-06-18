/* ============================================================
   Kuroten Stay Sapporo — Auth JavaScript
   認証UI・ログイン状態管理
   ============================================================ */

'use strict';

const KurotenAuth = (() => {
  const STORAGE_KEY = 'kuroten_user';
  const ADMIN_KEY   = 'kuroten_admin';

  /* ---------- 状態 ---------- */
  let currentUser = null;

  /* ---------- 初期化 ---------- */
  function init() {
    _loadFromStorage();
    _renderAuthUI();
    _bindEvents();
    _updateHeaderUI();
  }

  /* ---------- ストレージ ---------- */
  function _loadFromStorage() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) currentUser = JSON.parse(raw);
    } catch (_) {
      currentUser = null;
    }
  }

  function _saveToStorage(user) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch (_) {}
  }

  function _clearStorage() {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
  }

  /* ---------- ヘッダーUI更新 ---------- */
  function _updateHeaderUI() {
    const loginBtn   = document.getElementById('header-login-btn');
    const userMenu   = document.getElementById('header-user-menu');
    const userName   = document.getElementById('header-user-name');

    if (!loginBtn) return;

    if (currentUser) {
      loginBtn.style.display  = 'none';
      if (userMenu)  userMenu.style.display  = 'flex';
      if (userName)  userName.textContent = currentUser.name || currentUser.email;
    } else {
      loginBtn.style.display  = 'inline-flex';
      if (userMenu)  userMenu.style.display  = 'none';
    }
  }

  /* ---------- モーダル ---------- */
  function _getModal(id) {
    return document.getElementById(id);
  }

  function openLoginModal() {
    const modal = _getModal('auth-modal');
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    // ログインタブをアクティブに
    _switchTab('login');
  }

  function closeAuthModal() {
    const modal = _getModal('auth-modal');
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
    _clearFormErrors();
  }

  function _switchTab(tab) {
    const loginForm    = document.getElementById('login-form-wrap');
    const registerForm = document.getElementById('register-form-wrap');
    const loginTab     = document.getElementById('tab-login');
    const registerTab  = document.getElementById('tab-register');

    if (tab === 'login') {
      loginForm?.classList.add('active');
      registerForm?.classList.remove('active');
      loginTab?.classList.add('active');
      registerTab?.classList.remove('active');
    } else {
      registerForm?.classList.add('active');
      loginForm?.classList.remove('active');
      registerTab?.classList.add('active');
      loginTab?.classList.remove('active');
    }
  }

  /* ---------- フォーム検証 ---------- */
  function _clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
  }

  function _setError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const error = document.getElementById(fieldId + '-error');
    if (field) field.classList.add('error');
    if (error) error.textContent = message;
  }

  function _validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ---------- ログイン処理 ---------- */
  async function _handleLogin(e) {
    e.preventDefault();
    _clearFormErrors();

    const email    = document.getElementById('login-email')?.value.trim() || '';
    const password = document.getElementById('login-password')?.value || '';

    let hasError = false;

    if (!email) {
      _setError('login-email', 'メールアドレスを入力してください');
      hasError = true;
    } else if (!_validateEmail(email)) {
      _setError('login-email', '正しいメールアドレスを入力してください');
      hasError = true;
    }

    if (!password) {
      _setError('login-password', 'パスワードを入力してください');
      hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('login-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'ログイン中...'; }

    try {
      // APIログイン試行 / フォールバック
      let user = null;
      const BASE_URL = (window.KUROTEN_CONFIG && window.KUROTEN_CONFIG.apiBaseUrl) || '';

      if (BASE_URL) {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json();
          user = data.user;
        }
      } else {
        // デモ用モックログイン
        if (password.length >= 6) {
          user = { id: 'demo-' + Date.now(), email, name: email.split('@')[0], role: 'guest' };
        }
      }

      if (user) {
        currentUser = user;
        _saveToStorage(user);
        _updateHeaderUI();
        closeAuthModal();
        _showToast('ログインしました', 'success');
      } else {
        _setError('login-password', 'メールアドレスまたはパスワードが正しくありません');
      }
    } catch (err) {
      _setError('login-password', 'ログインに失敗しました。しばらくしてから再試行してください。');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'ログイン'; }
    }
  }

  /* ---------- 新規登録処理 ---------- */
  async function _handleRegister(e) {
    e.preventDefault();
    _clearFormErrors();

    const name     = document.getElementById('register-name')?.value.trim() || '';
    const email    = document.getElementById('register-email')?.value.trim() || '';
    const password = document.getElementById('register-password')?.value || '';
    const confirm  = document.getElementById('register-confirm')?.value || '';

    let hasError = false;

    if (!name) {
      _setError('register-name', 'お名前を入力してください');
      hasError = true;
    }

    if (!email) {
      _setError('register-email', 'メールアドレスを入力してください');
      hasError = true;
    } else if (!_validateEmail(email)) {
      _setError('register-email', '正しいメールアドレスを入力してください');
      hasError = true;
    }

    if (!password) {
      _setError('register-password', 'パスワードを入力してください');
      hasError = true;
    } else if (password.length < 8) {
      _setError('register-password', 'パスワードは8文字以上で入力してください');
      hasError = true;
    }

    if (password !== confirm) {
      _setError('register-confirm', 'パスワードが一致しません');
      hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('register-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = '登録中...'; }

    try {
      let user = null;
      const BASE_URL = (window.KUROTEN_CONFIG && window.KUROTEN_CONFIG.apiBaseUrl) || '';

      if (BASE_URL) {
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        if (res.ok) {
          const data = await res.json();
          user = data.user;
        }
      } else {
        // モック登録
        user = { id: 'user-' + Date.now(), email, name, role: 'guest' };
      }

      if (user) {
        currentUser = user;
        _saveToStorage(user);
        _updateHeaderUI();
        closeAuthModal();
        _showToast('アカウントを作成しました', 'success');
      } else {
        _setError('register-email', 'このメールアドレスは既に登録されています');
      }
    } catch (err) {
      _setError('register-email', '登録に失敗しました。しばらくしてから再試行してください。');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '新規登録'; }
    }
  }

  /* ---------- ログアウト ---------- */
  function logout() {
    currentUser = null;
    _clearStorage();
    _updateHeaderUI();
    _showToast('ログアウトしました', 'info');
  }

  /* ---------- トースト通知 ---------- */
  function _showToast(message, type = 'success') {
    // 既存のトースト要素を探す
    let toast = document.getElementById('auth-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'auth-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 12px 20px;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        font-family: var(--font-sans, sans-serif);
        z-index: 9999;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        pointer-events: none;
      `;
      document.body.appendChild(toast);
    }

    const colors = { success: '#2e7d32', error: '#c62828', info: '#1565c0', warn: '#e65100' };
    toast.style.background = colors[type] || colors.success;
    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
    }, 3000);
  }

  /* ---------- イベントバインド ---------- */
  function _bindEvents() {
    // ログインボタン
    const loginBtn = document.getElementById('header-login-btn');
    loginBtn?.addEventListener('click', openLoginModal);

    // モーダルを閉じる
    const closeBtn = document.getElementById('auth-modal-close');
    closeBtn?.addEventListener('click', closeAuthModal);

    // モーダル背景クリック
    const modal = document.getElementById('auth-modal');
    modal?.addEventListener('click', e => {
      if (e.target === modal) closeAuthModal();
    });

    // ESCキー
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAuthModal();
    });

    // タブ切替
    document.getElementById('tab-login')?.addEventListener('click', () => _switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => _switchTab('register'));

    // ログインフォーム送信
    document.getElementById('login-form')?.addEventListener('submit', _handleLogin);

    // 登録フォーム送信
    document.getElementById('register-form')?.addEventListener('submit', _handleRegister);

    // ログアウトボタン
    document.getElementById('logout-btn')?.addEventListener('click', logout);

    // ユーザーメニュー
    const userMenu = document.getElementById('header-user-menu');
    const userDropdown = document.getElementById('user-dropdown');
    if (userMenu && userDropdown) {
      userMenu.addEventListener('click', () => {
        userDropdown.classList.toggle('open');
      });
      document.addEventListener('click', e => {
        if (!userMenu.contains(e.target)) {
          userDropdown.classList.remove('open');
        }
      });
    }
  }

  /* ---------- 認証モーダルHTMLを動的に生成 ---------- */
  function _renderAuthUI() {
    // 既存のモーダルがあればスキップ
    if (document.getElementById('auth-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'auth-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'ログイン・新規登録');
    modal.innerHTML = `
      <div class="auth-modal-inner">
        <button class="auth-modal-close" id="auth-modal-close" aria-label="閉じる">&times;</button>

        <div class="auth-logo">
          <span class="logo-text">Kuroten</span>
          <span class="logo-sub">Stay Sapporo</span>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab active" id="tab-login">ログイン</button>
          <button class="auth-tab" id="tab-register">新規登録</button>
        </div>

        <!-- ログインフォーム -->
        <div class="auth-form-wrap active" id="login-form-wrap">
          <form id="login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-email">メールアドレス</label>
              <input class="form-input" type="email" id="login-email"
                     placeholder="example@email.com" autocomplete="email" required>
              <span class="form-error" id="login-email-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="login-password">パスワード</label>
              <input class="form-input" type="password" id="login-password"
                     placeholder="パスワード" autocomplete="current-password" required>
              <span class="form-error" id="login-password-error"></span>
            </div>
            <button class="auth-submit-btn" type="submit" id="login-submit-btn">ログイン</button>
          </form>
        </div>

        <!-- 新規登録フォーム -->
        <div class="auth-form-wrap" id="register-form-wrap">
          <form id="register-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="register-name">お名前</label>
              <input class="form-input" type="text" id="register-name"
                     placeholder="山田 太郎" autocomplete="name" required>
              <span class="form-error" id="register-name-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="register-email">メールアドレス</label>
              <input class="form-input" type="email" id="register-email"
                     placeholder="example@email.com" autocomplete="email" required>
              <span class="form-error" id="register-email-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="register-password">パスワード（8文字以上）</label>
              <input class="form-input" type="password" id="register-password"
                     placeholder="パスワード" autocomplete="new-password" required>
              <span class="form-error" id="register-password-error"></span>
            </div>
            <div class="form-group">
              <label class="form-label" for="register-confirm">パスワード（確認）</label>
              <input class="form-input" type="password" id="register-confirm"
                     placeholder="パスワードを再入力" autocomplete="new-password" required>
              <span class="form-error" id="register-confirm-error"></span>
            </div>
            <button class="auth-submit-btn" type="submit" id="register-submit-btn">新規登録</button>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /* ---------- 公開メソッド ---------- */
  return {
    init,
    openLoginModal,
    closeAuthModal,
    logout,
    getCurrentUser: () => currentUser,
    isLoggedIn: () => currentUser !== null,
    isAdmin: () => currentUser?.role === 'admin'
  };
})();

// DOM Ready で初期化
document.addEventListener('DOMContentLoaded', () => KurotenAuth.init());

// グローバル参照
window.KurotenAuth = KurotenAuth;
