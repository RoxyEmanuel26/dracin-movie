/**
 * Components Module
 * Fungsi-fungsi untuk render komponen UI
 */

import { CSS_CLASSES, ERROR_MESSAGES } from './config.js';
import { handleImageError, truncate } from './utils.js';

// === DRAMA CARD COMPONENT ===
/**
 * Render drama card component
 * @param {object} drama - Drama object dari API
 * @param {object} options - Render options
 * @returns {string} - HTML string card
 */
export function renderDramaCard(drama, options = {}) {
  const {
    showRank = false,
    showBadge = false,
    badgeText = 'BARU',
    rank = null,
    isHorizontal = false
  } = options;
  
  const {
    title,
    slug,
    poster,
    rating,
    episodes,
    genres = [],
    year,
    status
  } = drama;
  
  // Generate poster URL dengan fallback
  const posterUrl = poster || '';
  
  // Format genres
  const genreList = genres.slice(0, 2).join(', ');
  
  // Card classes
  const cardClasses = isHorizontal 
    ? 'drama-card drama-card-horizontal'
    : 'drama-card';
  
  // Rank badge
  const rankBadge = showRank && rank !== null
    ? `<div class="drama-card-rank">${rank}</div>`
    : '';
  
  // New badge
  const badge = showBadge
    ? `<div class="drama-card-badge">${badgeText}</div>`
    : '';
  
  // Rating stars
  const ratingStars = rating
    ? `<span class="drama-card-rating">★ ${rating}</span>`
    : '';
  
  // Episode count
  const episodeCount = episodes
    ? `<span class="drama-card-episodes">${episodes} eps</span>`
    : '';
  
  // Status badge
  const statusBadge = status
    ? `<span class="drama-card-status">${status}</span>`
    : '';
  
  // Card HTML
  return `
    <div class="${cardClasses}" data-slug="${slug}">
      ${rankBadge}
      ${badge}
      <div class="drama-card-image-wrapper">
        <img 
          src="${posterUrl}" 
          alt="${title}"
          class="drama-card-image"
          loading="lazy"
          onerror="handleImageError(this)"
        >
        <div class="drama-card-overlay">
          <h3 class="drama-card-title">${title}</h3>
          <div class="drama-card-meta">
            <span>${genreList}</span>
            <span>${year}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// === SKELETON CARD COMPONENT ===
/**
 * Render skeleton card component
 * @param {number} count - Number of skeleton cards to render
 * @returns {string} - HTML string skeleton cards
 */
export function renderSkeletonCard(count = 1) {
  let html = '';
  
  for (let i = 0; i < count; i++) {
    html += `
      <div class="skeleton-card">
        <div class="skeleton-image"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-meta"></div>
        </div>
      </div>
    `;
  }
  
  return html;
}

// === ERROR STATE COMPONENT ===
/**
 * Render error state component
 * @param {string} message - Error message
 * @param {function} retryCallback - Callback function on retry
 * @returns {string} - HTML string error state
 */
export function renderErrorState(message, retryCallback) {
  return `
    <div class="error-state">
      <div class="error-icon">✕</div>
      <h3 class="error-title">Terjadi Kesalahan</h3>
      <p class="error-message">${message}</p>
      <button class="btn btn-primary" onclick="retryCallback()">
        <span>Coba Lagi</span>
      </button>
    </div>
  `;
}

// === EMPTY STATE COMPONENT ===
/**
 * Render empty state component
 * @param {string} title - Title
 * @param {string} subtitle - Subtitle
 * @param {string} actionHTML - Action button HTML
 * @returns {string} - HTML string empty state
 */
export function renderEmptyState(title, subtitle, actionHTML = '') {
  return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-subtitle">${subtitle}</p>
      ${actionHTML}
    </div>
  `;
}

// === NAVBAR COMPONENT ===
/**
 * Render navbar component
 * @param {string} currentPage - Current page identifier
 * @returns {string} - HTML string navbar
 */
export function renderNavbar(currentPage = 'home') {
  return `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-content">
        <!-- Logo -->
        <a href="index.html" class="logo" aria-label="roxy-drachin Home">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M20,50 Q50,10 80,50 T20,50" fill="none" stroke="currentColor" stroke-width="8"/>
            <path d="M20,50 Q50,90 80,50" fill="none" stroke="currentColor" stroke-width="8"/>
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" stroke-width="4"/>
            <path d="M50,20 L50,80" stroke="currentColor" stroke-width="4"/>
            <path d="M20,50 L80,50" stroke="currentColor" stroke-width="4"/>
          </svg>
          <span>roxy<span style="color: var(--color-accent-primary)">-drachin</span></span>
        </a>
        
        <!-- Search -->
        <form class="search-form" role="search" onsubmit="handleSearch(event)">
          <span class="search-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="search" 
            class="search-input" 
            placeholder="Cari drama..." 
            aria-label="Cari drama"
            autocomplete="off"
          >
        </form>
        
        <!-- Navigation Links -->
        <div class="nav-links">
          <a href="index.html" class="nav-link ${currentPage === 'home' ? CSS_CLASSES.ACTIVE : ''}">Home</a>
          <a href="browse.html" class="nav-link ${currentPage === 'browse' ? CSS_CLASSES.ACTIVE : ''}">Browse</a>
          <a href="popular.html" class="nav-link ${currentPage === 'popular' ? CSS_CLASSES.ACTIVE : ''}">Populer</a>
        </div>
        
        <!-- Mobile Menu Button -->
        <button class="mobile-menu-btn" aria-label="Menu" onclick="toggleMobileMenu()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
      </div>
    </nav>
  `;
}

// === SLIDER COMPONENT ===
/**
 * Render hero slider component
 * @param {array} slides - Array of slide data
 * @param {object} options - Slider options
 * @returns {string} - HTML string slider
 */
export function renderSlider(slides, options = {}) {
  const {
    autoPlay = true,
    interval = 5000,
    showControls = true,
    showDots = true
  } = options;
  
  if (!slides || slides.length === 0) {
    return '';
  }
  
  // Generate slides
  const slidesHtml = slides.map((slide, index) => `
    <div class="hero-slide ${index === 0 ? CSS_CLASSES.ACTIVE : ''}" data-index="${index}">
      <img 
        src="${slide.poster}" 
        alt="${slide.title}"
        class="hero-slide-image"
        loading="${index === 0 ? 'eager' : 'lazy'}"
        onerror="handleImageError(this)"
      >
      <div class="hero-slide-overlay"></div>
      <div class="hero-slide-content">
        <h2 class="hero-slide-title">${slide.title}</h2>
        <p class="hero-slide-synopsis">${truncate(slide.synopsis, 200)}</p>
        <div class="hero-slide-meta">
          ${slide.year ? `<span>${slide.year}</span>` : ''}
          ${slide.rating ? `<span>★ ${slide.rating}</span>` : ''}
          ${slide.genres ? slide.genres.slice(0, 3).map(g => `<span class="hero-slide-genre">${g}</span>`).join('') : ''}
        </div>
        <div class="hero-slide-actions">
          <a href="watch.html?slug=${slide.slug}&index=1" class="hero-slide-btn hero-slide-btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Tonton Sekarang
          </a>
          <a href="detail.html?slug=${slide.slug}" class="hero-slide-btn hero-slide-btn-secondary">
            Detail
          </a>
        </div>
      </div>
    </div>
  `).join('');
  
  // Generate dots
  const dotsHtml = showDots ? `
    <div class="slider-dots">
      ${slides.map((_, index) => `
        <button class="slider-dot ${index === 0 ? CSS_CLASSES.ACTIVE : ''}" 
                data-slide="${index}" 
                aria-label="Slide ${index + 1}">
        </button>
      `).join('')}
    </div>
  ` : '';
  
  // Generate controls
  const controlsHtml = showControls ? `
    <div class="slider-controls">
      <button class="slider-btn slider-btn-prev" aria-label="Slide sebelumnya">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <button class="slider-btn slider-btn-next" aria-label="Slide berikutnya">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>
    </div>
  ` : '';
  
  return `
    <div class="hero-slider" 
         data-autoplay="${autoPlay}" 
         data-interval="${interval}">
      ${slidesHtml}
      ${controlsHtml}
      ${dotsHtml}
    </div>
  `;
}

// === EPISODE LIST COMPONENT ===
/**
 * Render episode list component
 * @param {array} episodes - Array of episode data
 * @param {number} currentEpisode - Current episode index
 * @returns {string} - HTML string episode list
 */
export function renderEpisodeList(episodes, currentEpisode = 1) {
  if (!episodes || episodes.length === 0) {
    return '<p class="text-muted">Belum ada episode tersedia</p>';
  }
  
  const totalEpisodes = episodes.length;
  
  // Generate episode items
  const episodesHtml = episodes.map((episode, index) => {
    const episodeIndex = index + 1;
    const isActive = episodeIndex === currentEpisode;
    const isLast = episodeIndex === totalEpisodes;
    
    return `
      <a href="watch.html?slug=${episode.slug}&index=${episodeIndex}" 
         class="episode-item ${isActive ? CSS_CLASSES.ACTIVE : ''}"
         data-episode="${episodeIndex}">
        <span class="episode-number">${formatEpisodeLabel(episodeIndex)}</span>
        ${isLast ? '<span class="episode-status">Terakhir</span>' : ''}
      </a>
    `;
  }).join('');
  
  return `
    <div class="episode-list">
      <h3 class="episode-list-title">Daftar Episode</h3>
      <div class="episode-list-content">
        ${episodesHtml}
      </div>
    </div>
  `;
}

// === BADGE COMPONENT ===
/**
 * Render badge component
 * @param {string} text - Badge text
 * @param {string} type - Badge type (primary, secondary, success, warning, error)
 * @returns {string} - HTML string badge
 */
export function renderBadge(text, type = 'primary') {
  return `<span class="badge badge-${type}">${text}</span>`;
}

// === TOAST NOTIFICATION ===
/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, error, warning, info)
 */
export function showToast(message, type = 'info') {
  const container = document.querySelector('.toast-container');
  
  if (!container) return;
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  
  // Toast content
  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  }[type] || 'ℹ';
  
  toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Tutup notifikasi" onclick="this.parentElement.remove()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
  
  // Add to container
  container.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeOut var(--transition-fast)';
    setTimeout(() => {
      toast.remove();
    }, 150);
  }, 3000);
}

// === FORMATTING UTILITIES ===
/**
 * Format episode label
 * @param {number} index - Episode index
 * @returns {string} - Formatted episode label
 */
export function formatEpisodeLabel(index) {
  return `Episode ${index}`;
}

// === INITIALIZATION ===
/**
 * Initialize all components
 */
export function initComponents() {
  // Initialize navbar
  const navbarContainer = document.querySelector('.navbar-container');
  if (navbarContainer) {
    const currentPage = document.body.dataset.page || 'home';
    navbarContainer.innerHTML = renderNavbar(currentPage);
  }
  
  // Initialize toast container
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    const body = document.querySelector('body');
    body.insertAdjacentHTML('beforeend', '<div class="toast-container"></div>');
  }
}

// Export all functions
export {
  renderDramaCard,
  renderSkeletonCard,
  renderErrorState,
  renderEmptyState,
  renderNavbar,
  renderSlider,
  renderEpisodeList,
  renderBadge,
  showToast,
  formatEpisodeLabel
};