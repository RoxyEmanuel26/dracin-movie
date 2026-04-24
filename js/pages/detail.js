/**
 * Detail Page Logic
 * Logic untuk halaman detail.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, showToast } from '../components.js';
import { getQueryParam, handleImageError, truncate } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES, SELECTORS } from '../config.js';

// State lokal halaman
const state = {
  slug: '',
  isLoading: false,
  data: null,
  currentEpisode: 1
};

// DOM Elements
const heroTitle = document.querySelector('#hero-title');
const heroMeta = document.querySelector('#hero-meta');
const heroSynopsis = document.querySelector('#hero-synopsis');
const heroActions = document.querySelector('#hero-actions');
const heroPosterImg = document.querySelector('#hero-poster-img');
const episodeList = document.querySelector('#episode-list');
const recommendationGrid = document.querySelector('#recommendation-grid');
const navbarContainer = document.querySelector('.navbar-container');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  heroTitle.innerHTML = '<div class="skeleton-title" style="height: 48px; width: 60%;"></div>';
  heroMeta.innerHTML = '<div class="skeleton-meta" style="height: 24px; width: 40%; margin-bottom: 8px;"></div><div class="skeleton-meta" style="height: 24px; width: 30%;"></div>';
  heroSynopsis.innerHTML = '<div class="skeleton-content"><div class="skeleton-title" style="height: 16px; width: 100%;"></div><div class="skeleton-title" style="height: 16px; width: 90%;"></div><div class="skeleton-title" style="height: 16px; width: 80%;"></div></div>';
  heroActions.innerHTML = '<div class="skeleton-content" style="display: flex; gap: 12px;"><div class="skeleton-title" style="height: 48px; width: 120px; border-radius: 8px;"></div><div class="skeleton-title" style="height: 48px; width: 120px; border-radius: 8px;"></div></div>';
  heroPosterImg.style.display = 'none';
  episodeList.innerHTML = renderSkeletonCard(5);
  recommendationGrid.innerHTML = renderSkeletonCard(5);
}

/**
 * Render hero section
 * @param {object} drama - Drama data
 */
function renderHeroSection(drama) {
  const {
    title,
    poster,
    year,
    episodes,
    genres = [],
    rating,
    status,
    synopsis
  } = drama;
  
  // Set poster
  heroPosterImg.src = poster || '';
  heroPosterImg.alt = title;
  heroPosterImg.onerror = () => handleImageError(heroPosterImg);
  
  // Set title
  heroTitle.textContent = title;
  
  // Set meta
  heroMeta.innerHTML = `
    <div class="hero-meta-item">
      <span class="meta-label">Tahun:</span>
      <span class="meta-value">${year || '-'}</span>
    </div>
    <div class="hero-meta-item">
      <span class="meta-label">Episode:</span>
      <span class="meta-value">${episodes || '-'}</span>
    </div>
    <div class="hero-meta-item">
      <span class="meta-label">Status:</span>
      <span class="meta-value">${status || '-'}</span>
    </div>
    <div class="hero-meta-item">
      <span class="meta-label">Rating:</span>
      <span class="meta-value">${rating ? `★ ${rating}` : '-'}</span>
    </div>
    <div class="hero-meta-item">
      <span class="meta-label">Genre:</span>
      <span class="meta-value">${genres.slice(0, 3).join(', ') || '-'}</span>
    </div>
  `;
  
  // Set synopsis
  heroSynopsis.textContent = synopsis || 'Sinopsis tidak tersedia.';
  
  // Set actions
  heroActions.innerHTML = `
    <a href="watch.html?slug=${state.slug}&index=1" class="btn btn-primary">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z"/>
      </svg>
      Tonton Ep 1
    </a>
    <button class="btn btn-secondary" onclick="toggleFavorite()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      Tambah Favorit
    </button>
  `;
}

/**
 * Render episode list
 * @param {array} episodes - Array of episode data
 */
function renderEpisodeList(episodes) {
  if (!episodes || episodes.length === 0) {
    episodeList.innerHTML = '<p class="text-muted">Belum ada episode tersedia</p>';
    return;
  }
  
  const totalEpisodes = episodes.length;
  
  // Generate episode items
  const episodesHtml = episodes.map((episode, index) => {
    const episodeIndex = index + 1;
    const isActive = episodeIndex === state.currentEpisode;
    
    return `
      <a href="watch.html?slug=${state.slug}&index=${episodeIndex}" 
         class="episode-item ${isActive ? CSS_CLASSES.ACTIVE : ''}"
         data-episode="${episodeIndex}">
        <span class="episode-number">${formatEpisodeLabel(episodeIndex)}</span>
        ${episodeIndex === totalEpisodes ? '<span class="episode-status">Terakhir</span>' : ''}
      </a>
    `;
  }).join('');
  
  episodeList.innerHTML = `
    <div class="episode-list-content">
      ${episodesHtml}
    </div>
  `;
}

/**
 * Render recommendations
 * @param {array} dramas - Array of drama data
 */
function renderRecommendations(dramas) {
  if (!dramas || dramas.length === 0) {
    recommendationGrid.innerHTML = renderEmptyState('Tidak ada rekomendasi', 'Coba lagi nanti');
    return;
  }
  
  recommendationGrid.innerHTML = dramas.map(drama => renderDramaCard(drama)).join('');
}

/**
 * Render empty state
 * @param {string} title - Title
 * @param {string} subtitle - Subtitle
 * @returns {string} - HTML string
 */
function renderEmptyState(title, subtitle) {
  return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <h3 class="empty-title">${title}</h3>
      <p class="empty-subtitle">${subtitle}</p>
    </div>
  `;
}

/**
 * Format episode label
 * @param {number} index - Episode index
 * @returns {string} - Formatted episode label
 */
function formatEpisodeLabel(index) {
  return `Episode ${index}`;
}

/**
 * Toggle favorite
 */
function toggleFavorite() {
  showToast('Drama ditambahkan ke favorit', 'success');
}

/**
 * Load drama detail
 */
async function loadDetail() {
  state.slug = getQueryParam('slug');
  
  if (!state.slug) {
    showToast('Slug drama tidak ditemukan', 'error');
    window.location.href = 'browse.html';
    return;
  }
  
  state.isLoading = true;
  
  try {
    const data = await DrachinAPI.getDetail(state.slug);
    
    // Store data
    state.data = data;
    
    // Render components
    renderHeroSection(data);
    renderEpisodeList(data.episodes || []);
    renderRecommendations(data.recommendations || []);
    
    // Update page title
    document.title = `${data.title} | Detail | roxy-drachin`;
  } catch (error) {
    console.error('Error loading drama detail:', error);
    showToast(ERROR_MESSAGES.SERVER_ERROR, 'error');
    
    // Show error state
    heroTitle.innerHTML = '<h1 class="error-title">Drama Tidak Ditemukan</h1>';
    heroMeta.innerHTML = '';
    heroSynopsis.innerHTML = '';
    heroActions.innerHTML = '';
    heroPosterImg.style.display = 'none';
    episodeList.innerHTML = '';
    recommendationGrid.innerHTML = '';
  } finally {
    state.isLoading = false;
  }
}

/**
 * Initialize navbar
 */
function initNavbar() {
  const currentPage = document.body.dataset.page || 'detail';
  navbarContainer.innerHTML = `
    <nav class="navbar" role="navigation" aria-label="Main navigation">
      <div class="navbar-content">
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
        
        <div class="nav-links">
          <a href="index.html" class="nav-link">Home</a>
          <a href="browse.html" class="nav-link">Browse</a>
          <a href="popular.html" class="nav-link">Populer</a>
        </div>
        
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

/**
 * Handle search
 * @param {Event} event - Form submit event
 */
function handleSearch(event) {
  event.preventDefault();
  
  const searchInput = document.querySelector('.search-input');
  const query = searchInput.value.trim();
  
  if (query.length < 2) {
    showToast('Masukkan minimal 2 karakter', 'warning');
    return;
  }
  
  window.location.href = `search.html?q=${encodeURIComponent(query)}`;
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
  const navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    navLinks.classList.toggle(CSS_CLASSES.VISIBLE);
  }
}

/**
 * Initialize page
 */
async function init() {
  // Show skeleton
  showSkeleton();
  
  // Initialize navbar
  initNavbar();
  
  // Load data
  await loadDetail();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);