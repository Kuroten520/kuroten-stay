/* ============================================================
   Kuroten Stay Sapporo — main.js
   ヒーロースライドショー、ギャラリー、ライトボックス、
   スクロールアニメーション、マップタブ、ハンバーガーメニュー
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     ヒーロースライドショー
  ---------------------------------------------------------- */
  let currentSlide = 0;
  let slideTimer = null;
  const SLIDE_INTERVAL = 5000;

  function initSlideshow() {
    const slides = document.querySelectorAll('#hero-slideshow .slide');
    const dots = document.querySelectorAll('.slide-dot');
    if (!slides.length) return;

    function goToSlide(n) {
      slides[currentSlide].classList.remove('active');
      if (dots[currentSlide]) {
        dots[currentSlide].classList.remove('active');
        dots[currentSlide].setAttribute('aria-selected', 'false');
      }
      currentSlide = (n + slides.length) % slides.length;
      slides[currentSlide].classList.add('active');
      if (dots[currentSlide]) {
        dots[currentSlide].classList.add('active');
        dots[currentSlide].setAttribute('aria-selected', 'true');
      }
    }

    function startAuto() {
      stopAuto();
      slideTimer = setInterval(() => goToSlide(currentSlide + 1), SLIDE_INTERVAL);
    }

    function stopAuto() {
      if (slideTimer) clearInterval(slideTimer);
    }

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        goToSlide(i);
        startAuto();
      });
    });

    // Touch/swipe support
    let touchStartX = 0;
    const hero = document.getElementById('hero');
    if (hero) {
      hero.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 50) {
          goToSlide(dx < 0 ? currentSlide + 1 : currentSlide - 1);
          startAuto();
        }
      }, { passive: true });
    }

    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stopAuto() : startAuto();
    });

    startAuto();
  }

  /* ----------------------------------------------------------
     サムネイルギャラリー（各物件）
  ---------------------------------------------------------- */
  function initGalleries() {
    // Find all thumbnail containers
    document.querySelectorAll('.gallery-thumbs').forEach(thumbContainer => {
      const galleryId = thumbContainer.id; // e.g. "sun-thumbs"
      const mainImgId = galleryId.replace('-thumbs', '-main-img');
      const mainImg = document.getElementById(mainImgId);
      if (!mainImg) return;

      thumbContainer.querySelectorAll('.thumb').forEach(thumb => {
        thumb.addEventListener('click', () => {
          const src = thumb.dataset.src;
          const alt = thumb.dataset.alt;
          if (!src) return;

          // Fade effect
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.alt = alt || '';
            mainImg.style.opacity = '1';
          }, 200);

          // Active state
          thumbContainer.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });
      });
    });
  }

  /* ----------------------------------------------------------
     ライトボックス
  ---------------------------------------------------------- */
  let lightboxImages = [];
  let lightboxIndex = 0;

  function createLightbox() {
    if (document.getElementById('kuroten-lightbox')) return;
    const lb = document.createElement('div');
    lb.id = 'kuroten-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', '画像拡大表示');
    lb.innerHTML = `
      <div class="lb-overlay"></div>
      <div class="lb-content">
        <button class="lb-close" aria-label="閉じる"><i class="fas fa-times"></i></button>
        <button class="lb-prev" aria-label="前の画像"><i class="fas fa-chevron-left"></i></button>
        <button class="lb-next" aria-label="次の画像"><i class="fas fa-chevron-right"></i></button>
        <div class="lb-img-wrap">
          <img class="lb-img" src="" alt="">
        </div>
        <div class="lb-caption"></div>
        <div class="lb-counter"></div>
      </div>
    `;
    document.body.appendChild(lb);

    lb.querySelector('.lb-overlay').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-close').addEventListener('click', closeLightbox);
    lb.querySelector('.lb-prev').addEventListener('click', () => navigateLightbox(-1));
    lb.querySelector('.lb-next').addEventListener('click', () => navigateLightbox(1));

    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });

    // Touch swipe
    let startX = 0;
    lb.addEventListener('touchstart', e => { startX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) navigateLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function openLightbox(triggers, index) {
    lightboxImages = triggers;
    lightboxIndex = index;
    showLightboxImage();
    const lb = document.getElementById('kuroten-lightbox');
    lb.classList.add('active');
    document.body.style.overflow = 'hidden';
    lb.querySelector('.lb-close').focus();
  }

  function closeLightbox() {
    const lb = document.getElementById('kuroten-lightbox');
    lb.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateLightbox(dir) {
    lightboxIndex = (lightboxIndex + dir + lightboxImages.length) % lightboxImages.length;
    showLightboxImage();
  }

  function showLightboxImage() {
    const item = lightboxImages[lightboxIndex];
    const lb = document.getElementById('kuroten-lightbox');
    const img = lb.querySelector('.lb-img');
    const caption = lb.querySelector('.lb-caption');
    const counter = lb.querySelector('.lb-counter');

    img.style.opacity = '0';
    img.src = item.href;
    img.alt = item.alt || '';
    img.onload = () => { img.style.opacity = '1'; };

    caption.textContent = item.alt || '';
    counter.textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;

    // Prev/next visibility
    lb.querySelector('.lb-prev').style.display = lightboxImages.length <= 1 ? 'none' : '';
    lb.querySelector('.lb-next').style.display = lightboxImages.length <= 1 ? 'none' : '';
  }

  function initLightbox() {
    createLightbox();

    // Group triggers by data-gallery
    const galleries = {};
    document.querySelectorAll('.lightbox-trigger').forEach(trigger => {
      const group = trigger.dataset.gallery || 'default';
      if (!galleries[group]) galleries[group] = [];
      galleries[group].push(trigger);
    });

    Object.values(galleries).forEach(triggers => {
      triggers.forEach((trigger, i) => {
        trigger.addEventListener('click', e => {
          e.preventDefault();
          const items = triggers.map(t => ({ href: t.href, alt: t.querySelector('img')?.alt || '' }));
          openLightbox(items, i);
        });
      });
    });
  }

  /* ----------------------------------------------------------
     スクロールアニメーション（fade-in-section）
  ---------------------------------------------------------- */
  function initScrollAnimation() {
    const elements = document.querySelectorAll('.fade-in-section');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px 0px 0px' });

      elements.forEach(el => observer.observe(el));
    } else {
      // Fallback: show all immediately
      elements.forEach(el => el.classList.add('is-visible'));
    }
  }

  /* ----------------------------------------------------------
     ヘッダー スクロール効果
  ---------------------------------------------------------- */
  function initHeader() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      if (scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
      lastScroll = scrollY;
    }, { passive: true });
  }

  /* ----------------------------------------------------------
     ハンバーガーメニュー
  ---------------------------------------------------------- */
  function initHamburger() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('main-nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', () => {
      const expanded = hamburger.getAttribute('aria-expanded') === 'true';
      hamburger.setAttribute('aria-expanded', String(!expanded));
      hamburger.classList.toggle('open');
      nav.classList.toggle('open');
      document.body.classList.toggle('nav-open');
    });

    // Close on nav link click
    nav.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('open');
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!hamburger.contains(e.target) && !nav.contains(e.target)) {
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.classList.remove('open');
        nav.classList.remove('open');
        document.body.classList.remove('nav-open');
      }
    });
  }

  /* ----------------------------------------------------------
     スムーズスクロール
  ---------------------------------------------------------- */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#!') return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        const headerHeight = document.getElementById('site-header')?.offsetHeight || 80;
        const top = target.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ----------------------------------------------------------
     Back to Top ボタン
  ---------------------------------------------------------- */
  function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ----------------------------------------------------------
     アクセスマップ タブ切替
  ---------------------------------------------------------- */
  function initMapTabs() {
    const tabBtns = document.querySelectorAll('.map-tab-btn');
    const mapPanels = document.querySelectorAll('.map-panel');
    if (!tabBtns.length) return;

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;

        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        mapPanels.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('map-' + target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ----------------------------------------------------------
     ドロップダウン（PC ナビ）
  ---------------------------------------------------------- */
  function initDropdowns() {
    document.querySelectorAll('.nav-item.has-dropdown').forEach(item => {
      const link = item.querySelector('.nav-link');
      const dropdown = item.querySelector('.dropdown-menu');
      if (!dropdown) return;

      link.setAttribute('aria-haspopup', 'true');
      link.setAttribute('aria-expanded', 'false');

      item.addEventListener('mouseenter', () => {
        link.setAttribute('aria-expanded', 'true');
        dropdown.style.display = 'block';
      });
      item.addEventListener('mouseleave', () => {
        link.setAttribute('aria-expanded', 'false');
        dropdown.style.display = '';
      });

      // Touch
      link.addEventListener('click', e => {
        if (window.innerWidth <= 900) return; // handled by mobile nav
        e.preventDefault();
        const open = link.getAttribute('aria-expanded') === 'true';
        link.setAttribute('aria-expanded', String(!open));
      });
    });
  }

  /* ----------------------------------------------------------
     ライトボックス CSS injection (公式スタイルがない場合)
  ---------------------------------------------------------- */
  function injectLightboxCSS() {
    if (document.getElementById('lb-style')) return;
    const style = document.createElement('style');
    style.id = 'lb-style';
    style.textContent = `
      #kuroten-lightbox {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 50000;
        align-items: center;
        justify-content: center;
      }
      #kuroten-lightbox.active { display: flex; }
      #kuroten-lightbox .lb-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.92);
        backdrop-filter: blur(4px);
      }
      #kuroten-lightbox .lb-content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 95vw;
        max-height: 95vh;
      }
      #kuroten-lightbox .lb-img-wrap {
        max-width: 90vw;
        max-height: 80vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #kuroten-lightbox .lb-img {
        max-width: 90vw;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 8px;
        transition: opacity 0.3s;
      }
      #kuroten-lightbox .lb-close {
        position: fixed;
        top: 20px; right: 20px;
        background: rgba(255,255,255,0.15);
        border: none;
        color: #fff;
        width: 44px; height: 44px;
        border-radius: 50%;
        font-size: 1.1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 2;
      }
      #kuroten-lightbox .lb-close:hover { background: rgba(255,255,255,0.3); }
      #kuroten-lightbox .lb-prev,
      #kuroten-lightbox .lb-next {
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.12);
        border: none;
        color: #fff;
        width: 48px; height: 48px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
        z-index: 2;
      }
      #kuroten-lightbox .lb-prev { left: 16px; }
      #kuroten-lightbox .lb-next { right: 16px; }
      #kuroten-lightbox .lb-prev:hover,
      #kuroten-lightbox .lb-next:hover { background: rgba(212,175,55,0.4); }
      #kuroten-lightbox .lb-caption {
        color: rgba(255,255,255,0.8);
        font-size: 0.88rem;
        margin-top: 12px;
        text-align: center;
        max-width: 600px;
      }
      #kuroten-lightbox .lb-counter {
        color: rgba(255,255,255,0.4);
        font-size: 0.78rem;
        margin-top: 6px;
      }
      @media (max-width: 600px) {
        #kuroten-lightbox .lb-prev { left: 6px; }
        #kuroten-lightbox .lb-next { right: 6px; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ----------------------------------------------------------
     メインナビ スクロールアクティブ（セクションハイライト）
  ---------------------------------------------------------- */
  function initNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });

    sections.forEach(s => observer.observe(s));
  }

  /* ----------------------------------------------------------
     初期化
  ---------------------------------------------------------- */
  function init() {
    injectLightboxCSS();
    initSlideshow();
    initGalleries();
    initLightbox();
    initScrollAnimation();
    initHeader();
    initHamburger();
    initSmoothScroll();
    initBackToTop();
    initMapTabs();
    initDropdowns();
    initNavHighlight();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
