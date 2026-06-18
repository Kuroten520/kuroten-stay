/* ============================================================
   HOKKAIDO EARTH — Main JavaScript
   ============================================================ */

'use strict';

/* ---------- DOM Ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initSlideshow();
  initGalleries();
  initFadeIn();
  initHamburger();
  initBackToTop();
  initMapTabs();
  initLightbox();
  setCopyrightYear();
  initDropdownMobile();
  initSmoothScroll();
});

/* ============================================================
   HEADER — Scroll behavior
   ============================================================ */
function initHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ============================================================
   HERO SLIDESHOW
   ============================================================ */
function initSlideshow() {
  const slides = document.querySelectorAll('.hero-section .slide');
  const dots   = document.querySelectorAll('.slide-dot');
  if (!slides.length) return;

  let current = 0;
  let timer   = null;

  function goTo(idx) {
    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    dots[current]?.setAttribute('aria-selected', 'false');

    current = (idx + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    dots[current]?.setAttribute('aria-selected', 'true');
  }

  function next() {
    goTo(current + 1);
  }

  function startTimer() {
    timer = setInterval(next, 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  // Dot clicks
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      resetTimer();
    });
  });

  startTimer();
}

/* ============================================================
   GALLERY (Thumbnail click → main image change)
   ============================================================ */
function initGalleries() {
  // SUN gallery
  setupGallery('sun-thumbs', 'sun-main-img');
  // MOON gallery
  setupGallery('moon-thumbs', 'moon-main-img');
  // SMILE gallery
  setupGallery('smile-thumbs', 'smile-main-img');
  // SKY gallery
  setupGallery('sky-thumbs', 'sky-main-img');
}

function setupGallery(thumbsId, mainImgId) {
  const thumbsContainer = document.getElementById(thumbsId);
  const mainImg         = document.getElementById(mainImgId);
  if (!thumbsContainer || !mainImg) return;

  const thumbs = thumbsContainer.querySelectorAll('.thumb');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const src = thumb.getAttribute('data-src');
      const alt = thumb.getAttribute('data-alt') || '';

      if (!src) return;

      // Animate main image
      mainImg.style.opacity = '0';
      mainImg.style.transform = 'scale(1.02)';

      setTimeout(() => {
        mainImg.src = src;
        mainImg.alt = alt;
        mainImg.style.opacity = '1';
        mainImg.style.transform = 'scale(1)';
      }, 200);

      // Update active state
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });

    // Keyboard support
    thumb.setAttribute('role', 'button');
    thumb.setAttribute('tabindex', '0');
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });

  // Add CSS transition for main image
  mainImg.style.transition = 'opacity 0.3s ease, transform 0.4s ease';
}

/* ============================================================
   FADE-IN on scroll (Intersection Observer)
   ============================================================ */
function initFadeIn() {
  const sections = document.querySelectorAll('.fade-in-section');
  if (!sections.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // Stagger delay for cards
        const delay = entry.target.classList.contains('property-card') ||
                      entry.target.classList.contains('access-card') ||
                      entry.target.classList.contains('nearby-card')
                      ? (Array.from(entry.target.parentElement.children).indexOf(entry.target) * 80)
                      : 0;

        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);

        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
  });

  sections.forEach(s => observer.observe(s));
}

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const nav       = document.getElementById('main-nav');
  if (!hamburger || !nav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    hamburger.classList.toggle('active', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close on nav link click
  nav.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (!nav.contains(e.target) && !hamburger.contains(e.target)) {
      nav.classList.remove('open');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });
}

/* ============================================================
   DROPDOWN — Mobile toggle
   ============================================================ */
function initDropdownMobile() {
  const dropdownItems = document.querySelectorAll('.has-dropdown > .nav-link');

  dropdownItems.forEach(link => {
    link.addEventListener('click', e => {
      // Only on mobile
      if (window.innerWidth <= 1024) {
        e.preventDefault();
        const parent = link.parentElement;
        parent.classList.toggle('open');
      }
    });
  });
}

/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ============================================================
   MAP TABS
   ============================================================ */
function initMapTabs() {
  const tabs    = document.querySelectorAll('.map-tab');
  const panels  = document.querySelectorAll('.map-panel');
  if (!tabs.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const property = tab.getAttribute('data-property');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`map-${property}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });
}

/* ============================================================
   LIGHTBOX
   ============================================================ */
function initLightbox() {
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightbox-img');
  const closeBtn     = document.getElementById('lightbox-close');
  const prevBtn      = document.getElementById('lightbox-prev');
  const nextBtn      = document.getElementById('lightbox-next');
  if (!lightbox) return;

  let currentImages  = [];
  let currentIndex   = 0;

  function openLightbox(images, index) {
    currentImages = images;
    currentIndex  = index;
    updateLightboxImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    if (!currentImages.length) return;
    const img = currentImages[currentIndex];
    lightboxImg.style.opacity = '0';
    setTimeout(() => {
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxImg.style.opacity = '1';
    }, 150);
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % currentImages.length;
    updateLightboxImage();
  }

  function goPrev() {
    currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
    updateLightboxImage();
  }

  lightboxImg.style.transition = 'opacity 0.2s ease';

  closeBtn?.addEventListener('click', closeLightbox);
  nextBtn?.addEventListener('click', goNext);
  prevBtn?.addEventListener('click', goPrev);

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goNext();
    if (e.key === 'ArrowLeft') goPrev();
  });

  // Attach to gallery main images
  document.querySelectorAll('.gallery-main').forEach(galleryEl => {
    const mainImg   = galleryEl.querySelector('.gallery-main-img');
    const thumbsId  = galleryEl.closest('.property-gallery')
                        ?.querySelector('.gallery-thumbs')?.id;
    if (!mainImg) return;

    mainImg.style.cursor = 'zoom-in';

    mainImg.addEventListener('click', () => {
      const thumbs  = thumbsId ? document.getElementById(thumbsId) : null;
      const imgs    = [];

      if (thumbs) {
        thumbs.querySelectorAll('.thumb').forEach(t => {
          const src = t.getAttribute('data-src');
          const alt = t.getAttribute('data-alt') || '';
          if (src) imgs.push({ src, alt });
        });
      }

      if (!imgs.length) {
        imgs.push({ src: mainImg.src, alt: mainImg.alt });
      }

      // Find current index
      const currentSrc = mainImg.src;
      let idx = imgs.findIndex(i => i.src === currentSrc) || 0;
      if (idx < 0) idx = 0;

      openLightbox(imgs, idx);
    });
  });

  // ── .luminous ギャラリーリンク（設備・寝室など）──────────────────
  document.querySelectorAll('a.luminous').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const galleryName = link.getAttribute('data-luminous-gallery');

      // 同じギャラリーグループ内のリンクをすべて収集
      const allLinks = galleryName
        ? Array.from(document.querySelectorAll(`a.luminous[data-luminous-gallery="${galleryName}"]`))
        : [link];

      const imgs = allLinks.map(a => ({
        src: a.getAttribute('href'),
        alt: a.querySelector('img')?.alt || ''
      }));

      const idx = allLinks.indexOf(link);
      openLightbox(imgs, idx >= 0 ? idx : 0);
    });
  });
}

/* ============================================================
   SMOOTH SCROLL for anchor links
   ============================================================ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const headerOffset = 80;
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ============================================================
   COPYRIGHT YEAR
   ============================================================ */
function setCopyrightYear() {
  const el = document.getElementById('current-year');
  if (el) el.textContent = new Date().getFullYear();
}

/* ============================================================
   Touch swipe support for slideshow
   ============================================================ */
(function initTouchSlide() {
  const hero = document.querySelector('.hero-section');
  if (!hero) return;

  let startX = 0;
  let isDragging = false;

  hero.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  hero.addEventListener('touchend', e => {
    if (!isDragging) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      // Trigger slide change
      const dots = document.querySelectorAll('.slide-dot');
      const activeDot = document.querySelector('.slide-dot.active');
      const allDots = Array.from(dots);
      const idx = allDots.indexOf(activeDot);

      if (diff > 0) {
        dots[(idx + 1) % dots.length]?.click();
      } else {
        dots[(idx - 1 + dots.length) % dots.length]?.click();
      }
    }
    isDragging = false;
  }, { passive: true });
})();
