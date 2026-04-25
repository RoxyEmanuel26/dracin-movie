/**
 * Components Module - UI Rendering Functions
 * Semua fungsi rendering untuk komponen UI
 */

import { sanitize, validateUrl } from './security.js';
import { truncate, debounce } from './utils.js';
import { SITE_NAME, SITE_TAGLINE, CSS_CLASSES, TOAST_DURATION_MS, ERROR_MESSAGES, SEARCH_DEBOUNCE_MS } from './config.js';

/**
 * Render drama card dengan BEM class
 * @param {object} drama - Data drama dari API
 * @param {object} options - Rendering options
 * @returns {string} - HTML string card
 */
export function renderDramaCard(drama, options = {}) {
  const {
    showRank = false,
    rank = null,
    showBadge = false,
    badgeText = '',
    badgeType = 'new'
  } = options;

  // Extract dan sanitize data drama
  const title = sanitize(drama.title || drama.judul || 'Judul Tidak Tersedia');
  const slug = sanitizeSlug(drama.slug || '');
  const posterRaw = drama.poster || drama.thumbnail || drama.image || '';
  const poster = validateUrl(posterRaw) || '/assets/poster-placeholder.svg';
  const totalEpisodes = drama.total_episode || drama.episodes || 0;
  const genre = sanitize(drama.genre || drama.kategori || 'Drama');

  // Sanitize badge text jika ada
  const badge = showBadge && badgeText ? sanitize(badgeText) : '';
  const rankDisplay = showRank && rank !== null ? `<span class="drama-card__rank">${rank}</span>` : '';

  // Format genre label
  const genreLabel = genre ? `<span class="drama-card__genre">${genre}</span>` : '';

  // Format episode label
  const episodeLabel = totalEpisodes > 0 ? `<span class="drama-card__ep">${totalEpisodes} eps</span>` : '';

  // Badge HTML
  const badgeHTML = badge ? `<span class="badge badge--${badgeType}">${badge}</span>` : '';

  // Build link URL
  const detailUrl = slug ? `detail.html?slug=${encodeURIComponent(slug)}` : '#';

  return `
    <a href="${detailUrl}" class="drama-card-link" aria-label="${title}">
      <article class="drama-card">
        ${rankDisplay}
        <div class="drama-card__poster-wrap">
          <img 
            class="drama-card__poster" 
            src="${poster}" 
            alt="${title}"
            loading="lazy"
            onerror="this.src='/assets/poster-placeholder.svg'"
          />
          ${badgeHTML}
        </div>
        <div class="drama-card__info">
          <h3 class="drama-card__title">${title}</h3>
          ${genreLabel}
          ${episodeLabel}
        </div>
      </article>
    </a>
  `;
}

/**
 * Sanitize slug helper (local for components)
 * @param {string} slug - Slug to sanitize
 * @returns {string} - Sanitized slug
 */
function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }
  return slug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200);
}

/**
 * Render skeleton card untuk loading state
 * @param {number} count - Jumlah skeleton card
 * @returns {string} - HTML string skeleton cards
 */
export function renderSkeletonCard(count = 1) {
  let html = '';
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton skeleton--shimmer">
        <div class="skeleton__poster"></div>
        <div class="skeleton__info">
          <div class="skeleton__title"></div>
          <div class="skeleton__genre"></div>
        </div>
      </div>
    `;
  }
  return html;
}

/**
 * Render error state dengan tombol retry
 * @param {string} message - Error message
 * @param {string} containerId - ID container untuk inject
 * @param {function} retryFn - Function untuk retry
 */
export function renderErrorState(message, containerId, retryFn) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="error-state">
      <div class="error-state__icon">✕</div>
      <h3 class="error-state__title">Terjadi kesalahan</h3>
      <p class="error-state__message">${sanitize(message)}</p>
      <button class="btn btn--primary" id="error-retry-btn">Coba Lagi</button>
    </div>
  `;

  // Attach retry function via event listener (safer than inline onclick)
  const retryBtn = document.getElementById('error-retry-btn');
  if (retryBtn && typeof retryFn === 'function') {
    retryBtn.addEventListener('click', retryFn);
  }
}

/**
 * Render empty state dengan SVG icon
 * @param {HTMLElement} container - Container element
 * @param {string} title - Judul empty state
 * @param {string} subtitle - Subtitle empty state
 * @param {string} actionHTML - HTML untuk tombol action
 */
export function renderEmptyState(container, title, subtitle, actionHTML) {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state">
      <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
      </svg>
      <h3 class="empty-state__title">${sanitize(title)}</h3>
      <p class="empty-state__subtitle">${sanitize(subtitle)}</p>
      ${actionHTML || ''}
    </div>
  `;
}

/**
 * Toast object untuk notifikasi
 */
export const Toast = {
  container: null,

  /**
   * Initialize toast container
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');
    this.container.style.position = 'fixed';
    this.container.style.top = 'var(--space-4)';
    this.container.style.right = 'var(--space-4)';
    this.container.style.zIndex = '9999';
    this.container.style.pointerEvents = 'none';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.gap = 'var(--space-2)';
    document.body.appendChild(this.container);
  },

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Type: success, error, warning, info
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'info', duration = TOAST_DURATION_MS) {
    if (!this.container) this.init();

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.style.minWidth = '300px';
    toast.style.maxWidth = '400px';
    toast.style.padding = 'var(--space-4)';
    toast.style.borderRadius = 'var(--radius-md)';
    toast.style.background = 'var(--color-bg-overlay)';
    toast.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.4)';
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    toast.style.transition = 'transform var(--transition-smooth), opacity var(--transition-smooth)';
    toast.style.pointerEvents = 'auto';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = 'var(--space-3)';

    // Icon based on type
    let icon = 'ℹ';
    if (type === 'success') icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';

    toast.innerHTML = `<span class="toast__message">${sanitize(message)}</span>`;

    this.container.appendChild(toast);

    // Trigger reflow untuk animasi
    void toast.offsetWidth;

    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';

    // Auto remove setelah duration
    setTimeout(() => {
      toast.style.transform = 'translateX(120%)';
      toast.style.opacity = '0';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, duration);
  },

  /**
   * Show success toast
   * @param {string} message - Success message
   * @param {number} duration - Duration in ms
   */
  success(message, duration = TOAST_DURATION_MS) {
    this.show(message, 'success', duration);
  },

  /**
   * Show error toast
   * @param {string} message - Error message
   * @param {number} duration - Duration in ms
   */
  error(message, duration = TOAST_DURATION_MS) {
    this.show(message, 'error', duration);
  },

  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @param {number} duration - Duration in ms
   */
  warning(message, duration = TOAST_DURATION_MS) {
    this.show(message, 'warning', duration);
  },

  /**
   * Show info toast
   * @param {string} message - Info message
   * @param {number} duration - Duration in ms
   */
  info(message, duration = TOAST_DURATION_MS) {
    this.show(message, 'info', duration);
  }
};

/**
 * Initialize navbar dengan sticky effect dan search
 */
export function initNavbar() {
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  if (!navbarPlaceholder) return;

  // Inject navbar HTML
  navbarPlaceholder.innerHTML = `
    <nav class="navbar" id="main-navbar">
      <div class="navbar__container">
        <a href="index.html" class="navbar__logo">
          <svg class="navbar__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <span class="navbar__logo-text">
            roxy<span class="navbar__logo-accent">drachin</span>
          </span>
        </a>

        <form class="navbar__search" id="navbar-search-form">
          <input 
            type="text" 
            class="navbar__search-input search-input" 
            placeholder="Cari drama..."
            aria-label="Cari drama"
          />
          <button type="submit" class="navbar__search-btn" aria-label="Cari">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21L16.65 16.65"/>
            </svg>
          </button>
        </form>

        <ul class="navbar__links">
          <li><a href="index.html" class="navbar__link">Home</a></li>
          <li><a href="browse.html" class="navbar__link">Browse</a></li>
          <li><a href="popular.html" class="navbar__link">Popular</a></li>
          <li><a href="search.html" class="navbar__link">Search</a></li>
        </ul>
      </div>
    </nav>
  `;

  // Debounced search function for navbar input
  const debouncedSearch = debounce((query) => {
    if (query && query.trim().length >= 2) {
      window.location.href = `search.html?q=${encodeURIComponent(query.trim())}`;
    }
  }, SEARCH_DEBOUNCE_MS);

  // Setup search
  const searchForm = document.getElementById('navbar-search-form');
  const searchInput = searchForm ? searchForm.querySelector('.search-input') : null;

  if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query.length >= 2) {
        window.location.href = `search.html?q=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  // Setup sticky navbar dengan backdrop-filter
  const navbar = document.getElementById('main-navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('navbar--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
  }

  // Setup active link berdasarkan pathname
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const links = document.querySelectorAll('.navbar__link');
  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('navbar__link--active');
    } else {
      link.classList.remove('navbar__link--active');
    }
  });
}

/**
 * Initialize footer
 * Renders a consistent footer across all pages
 */
export function initFooter() {
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (!footerPlaceholder) return;

  footerPlaceholder.innerHTML = `
    <footer class="footer">
      <div class="footer__container">
        <div class="footer__brand">
          <a href="index.html" class="footer__logo">
            <svg class="footer__logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span class="footer__logo-text">roxy<span class="footer__logo-accent">drachin</span></span>
          </a>
          <p class="footer__brand-tagline">Platform streaming web app drama China paling eksklusif dan premium.</p>
        </div>
        
        <div class="footer__nav-group">
          <div class="footer__nav-section">
            <h4 class="footer__title">Eksplorasi</h4>
            <ul class="footer__links">
              <li><a href="index.html">Beranda Utama</a></li>
              <li><a href="browse.html">Telusuri Semua</a></li>
              <li><a href="popular.html">Sedang Populer</a></li>
            </ul>
          </div>
          
          <div class="footer__nav-section">
            <h4 class="footer__title">Bantuan</h4>
            <ul class="footer__links">
              <li><a href="search.html">Pencarian</a></li>
              <li><a href="#">FAQ & Panduan</a></li>
              <li><a href="#">Syarat Ketentuan</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="footer__bottom">
        <div class="footer__copyright">
          <p>&copy; ${new Date().getFullYear()} <strong>ROXYDRACHIN</strong>. Dibuat dengan <span>&hearts;</span> untuk pecinta drachin.</p>
        </div>
      </div>
    </footer>
  `;
}
