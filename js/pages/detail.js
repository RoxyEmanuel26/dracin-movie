/**
 * Detail Page Logic
 * Logic untuk halaman detail.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, Toast, initNavbar, initFooter } from '../components.js';
import { getQueryParam, setPageTitle, handleImageError, truncate } from '../utils.js';
import { sanitize, validateUrl } from '../security.js';
import { CSS_CLASSES, ERROR_MESSAGES, TITLE_MAX_LENGTH, SYNOPSIS_PREVIEW_LENGTH, SLUG_MAX_LENGTH } from '../config.js';

// State object
const state = {
  slug: '',
  isLoading: false,
  data: null,
  currentEpisode: 1,
  episodeRangeStart: 1,
  episodeRangeEnd: 25
};

// DOM Elements
const heroDetailTitle = document.querySelector('#hero-detail-title');
const heroDetailMeta = document.querySelector('#hero-detail-meta');
const heroDetailSynopsis = document.querySelector('#hero-detail-synopsis');
const heroDetailActions = document.querySelector('#hero-detail-actions');
const heroDetailPoster = document.querySelector('#hero-detail-poster');
const episodeGrid = document.querySelector('#episode-grid');
const episodeRangeSelector = document.querySelector('#episode-range-selector');
const recommendationGrid = document.querySelector('#recommendation-grid');
const breadcrumbTitle = document.querySelector('#breadcrumb-title');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  heroDetailTitle.innerHTML = '<div class="skeleton skeleton--shimmer" style="height: 48px; width: 70%;"></div>';
  heroDetailMeta.innerHTML = '<div class="skeleton skeleton--shimmer" style="height: 24px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton skeleton--shimmer" style="height: 24px; width: 30%;"></div>';
  heroDetailSynopsis.innerHTML = '<div class="skeleton skeleton--shimmer" style="height: 16px; width: 100%; margin-bottom: 8px;"></div><div class="skeleton skeleton--shimmer" style="height: 16px; width: 90%; margin-bottom: 8px;"></div><div class="skeleton skeleton--shimmer" style="height: 16px; width: 80%;"></div>';
  heroDetailActions.innerHTML = '<div class="skeleton skeleton--shimmer" style="height: 48px; width: 150px; border-radius: 8px;"></div>';
  heroDetailPoster.style.display = 'none';
  episodeGrid.innerHTML = renderSkeletonCard(5);
  recommendationGrid.innerHTML = renderSkeletonCard(5);
}

/**
 * Render hero detail section
 * @param {object} drama - Drama data
 */
function renderHeroDetailSection(drama) {
  const {
    title,
    poster,
    year,
    episodes = [],
    genres = [],
    rating,
    status,
    synopsis
  } = drama;

  // Set poster
  heroDetailPoster.style.display = 'block';
  heroDetailPoster.src = validateUrl(poster) || '/assets/poster-placeholder.svg';
  heroDetailPoster.alt = title;
  heroDetailPoster.onerror = () => handleImageError(heroDetailPoster);

  // Set title
  heroDetailTitle.textContent = title;

  // Set meta
  const totalEpisodes = episodes.length;
  const safeYear = sanitize(String(year || ''));
  const safeStatus = sanitize(status || '');
  const safeRating = sanitize(String(rating || ''));
  const safeGenres = genres.map(g => sanitize(g));
  
  heroDetailMeta.innerHTML = `
    <div class="hero-detail__meta-item">
      <span class="meta-label">Tahun:</span>
      <span class="meta-value">${safeYear || '-'}</span>
    </div>
    <div class="hero-detail__meta-item">
      <span class="meta-label">Episode:</span>
      <span class="meta-value">${totalEpisodes}</span>
    </div>
    <div class="hero-detail__meta-item">
      <span class="meta-label">Status:</span>
      <span class="meta-value">${safeStatus || '-'}</span>
    </div>
    <div class="hero-detail__meta-item">
      <span class="meta-label">Rating:</span>
      <span class="meta-value">${safeRating ? `★ ${safeRating}` : '-'}</span>
    </div>
    <div class="hero-detail__meta-item">
      <span class="meta-label">Genre:</span>
      <span class="meta-value">${safeGenres.slice(0, 3).join(', ') || '-'}</span>
    </div>
  `;

  // Set synopsis dengan collapsible
  const safeSynopsis = sanitize(synopsis || '');
  const truncatedSynopsis = safeSynopsis ? truncate(safeSynopsis, SYNOPSIS_PREVIEW_LENGTH) : 'Sinopsis tidak tersedia.';
  heroDetailSynopsis.innerHTML = `
    <p class="hero-detail__synopsis-text">${truncatedSynopsis}</p>
    ${safeSynopsis && safeSynopsis.length > SYNOPSIS_PREVIEW_LENGTH ? `
      <button class="btn btn--ghost hero-detail__synopsis-toggle" aria-expanded="false">
        Baca Lebih
      </button>
    ` : ''}
  `;

  // Set actions
  const historyKey = `watch_history_${state.slug}`;
  const lastEpisode = parseInt(localStorage.getItem(historyKey)) || 1;
  const ctaLabel = lastEpisode > 1 ? `▶ Lanjut Ep ${lastEpisode}` : '▶ Tonton Ep 1';

  heroDetailActions.innerHTML = `
    <a href="watch.html?slug=${encodeURIComponent(state.slug)}&index=${lastEpisode}" class="btn btn--primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      ${ctaLabel}
    </a>
  `;

  // Setup synopsis toggle
  const synopsisToggle = heroDetailSynopsis.querySelector('.hero-detail__synopsis-toggle');
  if (synopsisToggle) {
    synopsisToggle.addEventListener('click', () => {
      const isExpanded = synopsisToggle.getAttribute('aria-expanded') === 'true';
      const synopsisText = heroDetailSynopsis.querySelector('.hero-detail__synopsis-text');

      if (!isExpanded) {
        synopsisText.textContent = safeSynopsis || 'Sinopsis tidak tersedia.';
        synopsisToggle.textContent = 'Tutup';
      } else {
        synopsisText.textContent = truncate(safeSynopsis, SYNOPSIS_PREVIEW_LENGTH);
        synopsisToggle.textContent = 'Baca Lebih';
      }
      synopsisToggle.setAttribute('aria-expanded', !isExpanded);
    });
  }
}

/**
 * Render episode list dengan range selector
 * @param {array} episodes - Array of episode data
 */
function renderEpisodeList(episodes) {
  if (!episodes || episodes.length === 0) {
    episodeGrid.innerHTML = '<p class="text-muted">Belum ada episode tersedia</p>';
    return;
  }

  const totalEpisodes = episodes.length;

  // Calculate range
  const rangeStart = state.episodeRangeStart;
  const rangeEnd = Math.min(state.episodeRangeEnd, totalEpisodes);

  // Generate episode pills
  const episodeItems = [];
  for (let i = rangeStart; i <= rangeEnd; i++) {
    const isActive = i === state.currentEpisode;
    episodeItems.push(`
      <button 
        class="detail-episode-pill ${isActive ? 'is-active' : ''}"
        data-episode="${i}"
        aria-label="Episode ${i}"
      >
        ${i}
      </button>
    `);
  }

  episodeGrid.innerHTML = `
    <div class="episode-grid__content">
      ${episodeItems.join('')}
    </div>
  `;

  // Setup range selector jika total episode > 50
  if (totalEpisodes > 50) {
    const ranges = [];
    for (let start = 1; start <= totalEpisodes; start += 25) {
      const end = Math.min(start + 24, totalEpisodes);
      const isActive = state.episodeRangeStart === start;
      ranges.push(`
        <button 
          class="range-pill ${isActive ? 'is-active' : ''}"
          data-range-start="${start}"
          data-range-end="${end}"
        >
          ${start} - ${end}
        </button>
      `);
    }

    episodeRangeSelector.innerHTML = `
      <div class="episode-range-selector__content">
        <span class="range-label">Pilih Range:</span>
        ${ranges.join('')}
      </div>
    `;
  } else {
    episodeRangeSelector.innerHTML = '';
  }

}

/**
 * Render recommendations
 * @param {array} dramas - Array of drama data
 */
function renderRecommendations(dramas) {
  if (!dramas || dramas.length === 0) {
    recommendationGrid.innerHTML = '';
    return;
  }

  recommendationGrid.innerHTML = dramas.map(drama => renderDramaCard(drama)).join('');
}

/**
 * Update breadcrumb dengan judul drama
 * @param {string} title - Drama title
 */
function updateBreadcrumb(title) {
  breadcrumbTitle.textContent = title;
}

/**
 * Initialize page
 */
async function init() {
  // Get slug from URL
  state.slug = getQueryParam('slug');

  // Validate slug
  if (!state.slug || state.slug.length > SLUG_MAX_LENGTH) {
    Toast.error('Slug drama tidak ditemukan atau tidak valid');
    window.location.href = 'index.html';
    return;
  }

  // Show skeleton
  showSkeleton();

  // Initialize navbar & footer
  initNavbar();
  initFooter();

  // Fetch data
  try {
    const response = await DrachinAPI.getDetail(state.slug);
    const data = response.data || response;

    // Store data
    state.data = data;

    // Update breadcrumb
    updateBreadcrumb(data.title);

    // Event Delegation for episode grid and range selector
    episodeGrid.addEventListener('click', (e) => {
      const pill = e.target.closest('.detail-episode-pill');
      if (!pill) return;
      const idx = parseInt(pill.dataset.episode, 10);
      state.currentEpisode = idx;
      const targetUrl = `watch.html?slug=${encodeURIComponent(state.slug)}&index=${idx}`;
      history.pushState(
        { title: state.data.title, totalEpisodes: (state.data.episodes || []).length },
        '',
        targetUrl
      );
      window.location.href = targetUrl;
    });

    episodeRangeSelector.addEventListener('click', (e) => {
      const pill = e.target.closest('.range-pill');
      if (!pill) return;
      state.episodeRangeStart = parseInt(pill.dataset.rangeStart, 10);
      state.episodeRangeEnd = parseInt(pill.dataset.rangeEnd, 10);
      renderEpisodeList(state.data.episodes);
    });

    // Render components
    renderHeroDetailSection(data);
    renderEpisodeList(data.episodes || []);
    renderRecommendations(data.recommendations || []);

    // Update page title
    document.title = `${data.title} | Detail | roxy-drachin`;
  } catch (error) {
    console.error('Error loading drama detail:', error);

    // Show error state
    heroDetailTitle.innerHTML = '<h1 class="error-title">Drama Tidak Ditemukan</h1>';
    heroDetailMeta.innerHTML = '';
    heroDetailSynopsis.innerHTML = '';
    heroDetailActions.innerHTML = '';
    heroDetailPoster.style.display = 'none';
    episodeGrid.innerHTML = '';
    recommendationGrid.innerHTML = '';

    Toast.error(ERROR_MESSAGES.NOT_FOUND);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
