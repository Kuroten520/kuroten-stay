/**
 * Kuroten Stay Sapporo — 認証UI処理
 * ログイン・登録モーダル、ヘッダーのユーザーメニュー管理
 */

document.addEventListener('DOMContentLoaded', () => {
  AuthUI.init()
})

const AuthUI = {
  // ============================================================
  // 初期化
  // ============================================================
  init() {
    this.injectHTML()       // モーダルHTMLを挿入
    this.bindEvents()       // イベント登録
    this.updateHeader()     // ヘッダーのログイン状態を反映

    // 認証状態変更イベント受信
    window.addEventListener('kuroten:auth-change', () => {
      this.updateHeader()
    })
  },

  // ============================================================
  // HTMLインジェクション（モーダル・ヘッダーUI）
  // ============================================================
  injectHTML() {
    // ヘッダーにログインボタン挿入
    const header = document.querySelector('.header-inner')
    if (header && !document.getElementById('auth-header-btns')) {
      const authBtns = document.createElement('div')
      authBtns.id = 'auth-header-btns'
      authBtns.className = 'auth-header-btns'
      authBtns.innerHTML = `
        <!-- 未ログイン時 -->
        <div id="auth-guest-btns" class="auth-guest-btns" style="display:none;">
          <button class="auth-btn auth-btn--login" id="open-login-btn">ログイン</button>
          <button class="auth-btn auth-btn--register" id="open-register-btn">新規登録</button>
        </div>
        <!-- ログイン済み時 -->
        <div id="auth-user-menu" class="auth-user-menu" style="display:none;">
          <button class="auth-user-btn" id="user-menu-toggle" aria-expanded="false">
            <i class="fas fa-user-circle"></i>
            <span id="user-menu-name">ゲスト</span>
            <i class="fas fa-chevron-down"></i>
          </button>
          <div class="auth-user-dropdown" id="user-dropdown" role="menu" hidden>
            <a href="#" class="auth-dropdown-item" id="my-bookings-link">
              <i class="fas fa-calendar-check"></i> 予約一覧
            </a>
            <a href="#" class="auth-dropdown-item" id="my-profile-link">
              <i class="fas fa-user-edit"></i> プロフィール
            </a>
            <a href="admin.html" class="auth-dropdown-item" id="admin-link" style="display:none;">
              <i class="fas fa-cog"></i> 管理画面
            </a>
            <hr class="auth-dropdown-divider">
            <button class="auth-dropdown-item auth-dropdown-item--danger" id="logout-btn">
              <i class="fas fa-sign-out-alt"></i> ログアウト
            </button>
          </div>
        </div>
      `
      header.appendChild(authBtns)
    }

    // モーダルをbody末尾に挿入
    if (!document.getElementById('auth-modals')) {
      document.body.insertAdjacentHTML('beforeend', `
        <div id="auth-modals">

          <!-- ========== ログインモーダル ========== -->
          <div class="auth-modal-overlay" id="login-modal" role="dialog"
               aria-modal="true" aria-labelledby="login-modal-title" hidden>
            <div class="auth-modal">
              <button class="auth-modal-close" data-close="login-modal" aria-label="閉じる">
                <i class="fas fa-times"></i>
              </button>
              <div class="auth-modal-header">
                <h2 class="auth-modal-title" id="login-modal-title">ログイン</h2>
                <p class="auth-modal-sub">Kuroten Stay Sapporo へようこそ</p>
              </div>
              <form class="auth-form" id="login-form" novalidate>
                <div class="auth-form-group">
                  <label for="login-email" class="auth-label">メールアドレス</label>
                  <input type="email" id="login-email" name="email"
                         class="auth-input" placeholder="example@email.com"
                         autocomplete="email" required>
                  <span class="auth-field-error" id="login-email-error"></span>
                </div>
                <div class="auth-form-group">
                  <label for="login-password" class="auth-label">パスワード</label>
                  <div class="auth-input-wrap">
                    <input type="password" id="login-password" name="password"
                           class="auth-input" placeholder="••••••••"
                           autocomplete="current-password" required>
                    <button type="button" class="auth-pw-toggle"
                            data-target="login-password" aria-label="パスワード表示切替">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                  <span class="auth-field-error" id="login-password-error"></span>
                </div>
                <div class="auth-error-banner" id="login-error" hidden></div>
                <button type="submit" class="auth-submit-btn" id="login-submit-btn">
                  <span class="auth-btn-text">ログイン</span>
                  <span class="auth-btn-spinner" hidden><i class="fas fa-spinner fa-spin"></i></span>
                </button>
              </form>
              <div class="auth-modal-footer">
                <p>アカウントをお持ちでない方は
                  <button class="auth-link-btn" id="switch-to-register">新規登録</button>
                </p>
              </div>
            </div>
          </div>

          <!-- ========== 新規登録モーダル ========== -->
          <div class="auth-modal-overlay" id="register-modal" role="dialog"
               aria-modal="true" aria-labelledby="register-modal-title" hidden>
            <div class="auth-modal">
              <button class="auth-modal-close" data-close="register-modal" aria-label="閉じる">
                <i class="fas fa-times"></i>
              </button>
              <div class="auth-modal-header">
                <h2 class="auth-modal-title" id="register-modal-title">新規登録</h2>
                <p class="auth-modal-sub">アカウントを作成して予約を管理しましょう</p>
              </div>
              <form class="auth-form" id="register-form" novalidate>
                <div class="auth-form-row">
                  <div class="auth-form-group">
                    <label for="reg-lastname" class="auth-label">苗字</label>
                    <input type="text" id="reg-lastname" name="lastName"
                           class="auth-input" placeholder="山田" required>
                    <span class="auth-field-error" id="reg-lastname-error"></span>
                  </div>
                  <div class="auth-form-group">
                    <label for="reg-firstname" class="auth-label">名前</label>
                    <input type="text" id="reg-firstname" name="firstName"
                           class="auth-input" placeholder="太郎" required>
                    <span class="auth-field-error" id="reg-firstname-error"></span>
                  </div>
                </div>
                <div class="auth-form-group">
                  <label for="reg-email" class="auth-label">メールアドレス</label>
                  <input type="email" id="reg-email" name="email"
                         class="auth-input" placeholder="example@email.com"
                         autocomplete="email" required>
                  <span class="auth-field-error" id="reg-email-error"></span>
                </div>
                <div class="auth-form-group">
                  <label for="reg-phone" class="auth-label">電話番号 <span class="auth-optional">（任意）</span></label>
                  <input type="tel" id="reg-phone" name="phone"
                         class="auth-input" placeholder="090-0000-0000">
                </div>
                <div class="auth-form-group">
                  <label for="reg-password" class="auth-label">パスワード</label>
                  <div class="auth-input-wrap">
                    <input type="password" id="reg-password" name="password"
                           class="auth-input" placeholder="8文字以上"
                           autocomplete="new-password" required minlength="8">
                    <button type="button" class="auth-pw-toggle"
                            data-target="reg-password" aria-label="パスワード表示切替">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                  <span class="auth-field-error" id="reg-password-error"></span>
                </div>
                <div class="auth-form-group">
                  <label for="reg-password-confirm" class="auth-label">パスワード（確認）</label>
                  <div class="auth-input-wrap">
                    <input type="password" id="reg-password-confirm" name="passwordConfirm"
                           class="auth-input" placeholder="••••••••"
                           autocomplete="new-password" required>
                    <button type="button" class="auth-pw-toggle"
                            data-target="reg-password-confirm" aria-label="パスワード表示切替">
                      <i class="fas fa-eye"></i>
                    </button>
                  </div>
                  <span class="auth-field-error" id="reg-password-confirm-error"></span>
                </div>
                <div class="auth-error-banner" id="register-error" hidden></div>
                <button type="submit" class="auth-submit-btn" id="register-submit-btn">
                  <span class="auth-btn-text">アカウントを作成する</span>
                  <span class="auth-btn-spinner" hidden><i class="fas fa-spinner fa-spin"></i></span>
                </button>
              </form>
              <div class="auth-modal-footer">
                <p>すでにアカウントをお持ちの方は
                  <button class="auth-link-btn" id="switch-to-login">ログイン</button>
                </p>
              </div>
            </div>
          </div>

          <!-- ========== 予約一覧モーダル ========== -->
          <div class="auth-modal-overlay" id="bookings-modal" role="dialog"
               aria-modal="true" aria-labelledby="bookings-modal-title" hidden>
            <div class="auth-modal auth-modal--wide">
              <button class="auth-modal-close" data-close="bookings-modal" aria-label="閉じる">
                <i class="fas fa-times"></i>
              </button>
              <div class="auth-modal-header">
                <h2 class="auth-modal-title" id="bookings-modal-title">
                  <i class="fas fa-calendar-check"></i> 予約一覧
                </h2>
              </div>
              <div id="bookings-list-container">
                <div class="auth-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>
              </div>
            </div>
          </div>

        </div>
      `)
    }
  },

  // ============================================================
  // イベントバインド
  // ============================================================
  bindEvents() {
    // モーダルを開く
    document.getElementById('open-login-btn')?.addEventListener('click', () => AuthUI.openModal('login-modal'))
    document.getElementById('open-register-btn')?.addEventListener('click', () => AuthUI.openModal('register-modal'))

    // モーダルを閉じる
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => AuthUI.closeModal(btn.dataset.close))
    })

    // オーバーレイクリックで閉じる
    document.querySelectorAll('.auth-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) AuthUI.closeModal(overlay.id)
      })
    })

    // モーダル切り替え
    document.getElementById('switch-to-register')?.addEventListener('click', () => {
      AuthUI.closeModal('login-modal')
      AuthUI.openModal('register-modal')
    })
    document.getElementById('switch-to-login')?.addEventListener('click', () => {
      AuthUI.closeModal('register-modal')
      AuthUI.openModal('login-modal')
    })

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.auth-modal-overlay:not([hidden])').forEach(m => {
          AuthUI.closeModal(m.id)
        })
      }
    })

    // パスワード表示切り替え
    document.querySelectorAll('.auth-pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target)
        const icon = btn.querySelector('i')
        if (input.type === 'password') {
          input.type = 'text'
          icon.classList.replace('fa-eye', 'fa-eye-slash')
        } else {
          input.type = 'password'
          icon.classList.replace('fa-eye-slash', 'fa-eye')
        }
      })
    })

    // ユーザーメニュー
    document.getElementById('user-menu-toggle')?.addEventListener('click', () => {
      const dropdown = document.getElementById('user-dropdown')
      const btn = document.getElementById('user-menu-toggle')
      const isOpen = !dropdown.hidden
      dropdown.hidden = isOpen
      btn.setAttribute('aria-expanded', String(!isOpen))
    })

    // メニュー外クリックで閉じる
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('auth-user-menu')
      const dropdown = document.getElementById('user-dropdown')
      if (menu && !menu.contains(e.target) && dropdown && !dropdown.hidden) {
        dropdown.hidden = true
      }
    })

    // 予約一覧リンク
    document.getElementById('my-bookings-link')?.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('user-dropdown').hidden = true
      AuthUI.openBookingsModal()
    })

    // ログアウト
    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      document.getElementById('user-dropdown').hidden = true
      await window.KurotenApi?.Auth.logout()
    })

    // ログインフォーム
    document.getElementById('login-form')?.addEventListener('submit', AuthUI.handleLogin)

    // 登録フォーム
    document.getElementById('register-form')?.addEventListener('submit', AuthUI.handleRegister)
  },

  // ============================================================
  // フォーム処理
  // ============================================================
  async handleLogin(e) {
    e.preventDefault()
    const form = e.target
    const email = form.email.value.trim()
    const password = form.password.value

    // バリデーション
    let valid = true
    if (!email) {
      AuthUI.showFieldError('login-email-error', 'メールアドレスを入力してください')
      valid = false
    } else { AuthUI.clearFieldError('login-email-error') }

    if (!password) {
      AuthUI.showFieldError('login-password-error', 'パスワードを入力してください')
      valid = false
    } else { AuthUI.clearFieldError('login-password-error') }

    if (!valid) return

    AuthUI.setLoading('login-submit-btn', true)
    AuthUI.hideError('login-error')

    try {
      await window.KurotenApi.Auth.login({ email, password })
      AuthUI.closeModal('login-modal')
      AuthUI.showToast('ログインしました', 'success')
    } catch (err) {
      AuthUI.showError('login-error', err.message)
    } finally {
      AuthUI.setLoading('login-submit-btn', false)
    }
  },

  async handleRegister(e) {
    e.preventDefault()
    const form = e.target
    const firstName = form.firstName.value.trim()
    const lastName = form.lastName.value.trim()
    const email = form.email.value.trim()
    const phone = form.phone.value.trim()
    const password = form.password.value
    const passwordConfirm = form.passwordConfirm.value

    // バリデーション
    let valid = true
    if (!lastName) { AuthUI.showFieldError('reg-lastname-error', '苗字を入力してください'); valid = false }
    else { AuthUI.clearFieldError('reg-lastname-error') }

    if (!firstName) { AuthUI.showFieldError('reg-firstname-error', '名前を入力してください'); valid = false }
    else { AuthUI.clearFieldError('reg-firstname-error') }

    if (!email) { AuthUI.showFieldError('reg-email-error', 'メールアドレスを入力してください'); valid = false }
    else { AuthUI.clearFieldError('reg-email-error') }

    if (password.length < 8) { AuthUI.showFieldError('reg-password-error', 'パスワードは8文字以上で入力してください'); valid = false }
    else { AuthUI.clearFieldError('reg-password-error') }

    if (password !== passwordConfirm) { AuthUI.showFieldError('reg-password-confirm-error', 'パスワードが一致しません'); valid = false }
    else { AuthUI.clearFieldError('reg-password-confirm-error') }

    if (!valid) return

    AuthUI.setLoading('register-submit-btn', true)
    AuthUI.hideError('register-error')

    try {
      await window.KurotenApi.Auth.register({ email, password, firstName, lastName, phone: phone || undefined })
      // 登録後 自動ログイン
      await window.KurotenApi.Auth.login({ email, password })
      AuthUI.closeModal('register-modal')
      AuthUI.showToast('アカウントを作成してログインしました！', 'success')
    } catch (err) {
      AuthUI.showError('register-error', err.message)
    } finally {
      AuthUI.setLoading('register-submit-btn', false)
    }
  },

  // ============================================================
  // 予約一覧モーダル
  // ============================================================
  async openBookingsModal() {
    AuthUI.openModal('bookings-modal')
    const container = document.getElementById('bookings-list-container')
    container.innerHTML = '<div class="auth-loading"><i class="fas fa-spinner fa-spin"></i> 読み込み中...</div>'

    try {
      const bookings = await window.KurotenApi.Bookings.list()
      if (bookings.length === 0) {
        container.innerHTML = '<p class="auth-empty">予約がありません</p>'
        return
      }
      container.innerHTML = `
        <div class="bookings-list">
          ${bookings.map(b => `
            <div class="booking-item">
              <div class="booking-item-header">
                <span class="booking-code">${b.bookingCode}</span>
                <span class="booking-status booking-status--${b.status}">${AuthUI.statusLabel(b.status)}</span>
              </div>
              <div class="booking-item-body">
                <p><strong>施設:</strong> ${b.propertySlug?.toUpperCase()}</p>
                <p><strong>チェックイン:</strong> ${b.checkinDate}</p>
                <p><strong>チェックアウト:</strong> ${b.checkoutDate}</p>
                <p><strong>宿泊数:</strong> ${b.nights}泊</p>
                <p><strong>人数:</strong> ${b.guestCount}名</p>
                <p><strong>合計金額:</strong> ¥${b.totalPrice?.toLocaleString()}</p>
              </div>
              ${b.status === 'pending' || b.status === 'confirmed' ? `
                <div class="booking-item-actions">
                  <button class="booking-cancel-btn" onclick="AuthUI.cancelBooking('${b.id}')">
                    キャンセルする
                  </button>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `
    } catch (err) {
      container.innerHTML = `<p class="auth-error-text">予約情報の取得に失敗しました: ${err.message}</p>`
    }
  },

  async cancelBooking(bookingId) {
    if (!confirm('この予約をキャンセルしますか？')) return
    try {
      await window.KurotenApi.Bookings.cancel(bookingId)
      AuthUI.showToast('予約をキャンセルしました', 'success')
      AuthUI.openBookingsModal() // 再読み込み
    } catch (err) {
      AuthUI.showToast(`キャンセルに失敗しました: ${err.message}`, 'error')
    }
  },

  statusLabel(status) {
    const labels = {
      pending: '仮予約',
      confirmed: '確定',
      checked_in: 'チェックイン済',
      checked_out: 'チェックアウト済',
      cancelled: 'キャンセル',
      no_show: 'ノーショー',
    }
    return labels[status] || status
  },

  // ============================================================
  // ヘッダー更新
  // ============================================================
  updateHeader() {
    const isLoggedIn = window.KurotenApi?.Auth.isLoggedIn()
    const user = window.KurotenApi?.Auth.currentUser()

    const guestBtns = document.getElementById('auth-guest-btns')
    const userMenu = document.getElementById('auth-user-menu')
    const adminLink = document.getElementById('admin-link')
    const userName = document.getElementById('user-menu-name')

    if (isLoggedIn && user) {
      if (guestBtns) guestBtns.style.display = 'none'
      if (userMenu) userMenu.style.display = 'flex'
      if (userName) userName.textContent = user.firstName || user.email
      if (adminLink) adminLink.style.display = user.role === 'owner' ? 'flex' : 'none'
    } else {
      if (guestBtns) guestBtns.style.display = 'flex'
      if (userMenu) userMenu.style.display = 'none'
    }
  },

  // ============================================================
  // ユーティリティ
  // ============================================================
  openModal(id) {
    const modal = document.getElementById(id)
    if (modal) {
      modal.hidden = false
      document.body.style.overflow = 'hidden'
      modal.querySelector('input')?.focus()
    }
  },

  closeModal(id) {
    const modal = document.getElementById(id)
    if (modal) {
      modal.hidden = true
      document.body.style.overflow = ''
    }
  },

  setLoading(btnId, isLoading) {
    const btn = document.getElementById(btnId)
    if (!btn) return
    const text = btn.querySelector('.auth-btn-text')
    const spinner = btn.querySelector('.auth-btn-spinner')
    btn.disabled = isLoading
    if (text) text.style.display = isLoading ? 'none' : ''
    if (spinner) spinner.hidden = !isLoading
  },

  showError(id, message) {
    const el = document.getElementById(id)
    if (el) { el.textContent = message; el.hidden = false }
  },

  hideError(id) {
    const el = document.getElementById(id)
    if (el) { el.textContent = ''; el.hidden = true }
  },

  showFieldError(id, message) {
    const el = document.getElementById(id)
    if (el) el.textContent = message
  },

  clearFieldError(id) {
    const el = document.getElementById(id)
    if (el) el.textContent = ''
  },

  showToast(message, type = 'info') {
    const existing = document.getElementById('kuroten-toast')
    if (existing) existing.remove()

    const toast = document.createElement('div')
    toast.id = 'kuroten-toast'
    toast.className = `kuroten-toast kuroten-toast--${type}`
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    `
    document.body.appendChild(toast)

    requestAnimationFrame(() => toast.classList.add('kuroten-toast--show'))
    setTimeout(() => {
      toast.classList.remove('kuroten-toast--show')
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  },
}

// グローバル公開（予約キャンセルボタンから呼び出すため）
window.AuthUI = AuthUI
