/**
 * Watch Page Logic
 * Logic untuk halaman watch.html
 */

import { DrachinAPI } from '../api.js';
import { renderEpisodeList, showToast } from '../components.js';
import { getQueryParam, handleImageError } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES } from '../config.js';

// State lokal halaman
const state = {
  slug: '',
  episodeIndex: 1,
  isLoading: false,
  data: null,
  episodes: []
};

// DOM Elements
const videoElement = document.querySelector('#video-element');
const videoPlayer = document.querySelector('#video-player');
const videoLoading = document.querySelector('#video-loading');
const videoError = document.querySelector('#video-error');
const videoTitle = document.querySelector('#video-title');
const videoMeta = document.querySelector('#video-meta');
const prevEpisodeBtn = document.querySelector('#prev-episode-btn');
const nextEpisodeBtn = document.querySelector('#next-episode-btn');
const episodeListSidebar = document.querySelector('#episode-list');
const navbarContainer = document.querySelector('.navbar-container');

/**
 * Show loading state
 */
function showLoading() {
  videoLoading.classList.remove(CSS_CLASSES.HIDDEN);
  videoError.classList.add(CSS_CLASSES.HIDDEN);
  videoElement.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
  videoLoading.classList.add(CSS_CLASSES.HIDDEN);
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
  videoLoading.classList.add(CSS_CLASSES.HIDDEN);
  videoError.classList.remove(CSS_CLASSES.HIDDEN);
  videoElement.style.display = 'none';
  
  const errorMessage = document.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

/**
 * Hide error state
 */
function hideError() {
  videoError.classList.add(CSS_CLASSES.HIDDEN);
}

/**
 * Show video player
 */
function showVideo() {
  videoElement.style.display = 'block';
  hideLoading();
  hideError();
}

/**
 * Load episode data
 */
async function loadEpisode() {
  state.slug = getQueryParam('slug');
  state.episodeIndex = parseInt(getQueryParam('index')) || 1;
  
  if (!state.slug) {
    showToast('Slug drama tidak ditemukan', 'error');
    window.location.href = 'browse.html';
    return;
  }
  
  state.isLoading = true;
  showLoading();
  
  try {
    // Get episode data
    const episodeData = await DrachinAPI.getEpisode(state.slug, state.episodeIndex);
    
    // Get drama detail for episode list
    const dramaData = await DrachinAPI.getDetail(state.slug);
    
    // Store data
    state.data = episodeData;
    state.episodes = dramaData.episodes || [];
    
    // Set video source
    const videoUrl = episodeData.video_url || episodeData.url || episodeData.stream_url;
    
    if (videoUrl) {
      videoElement.src = videoUrl;
      videoElement.load();
      
      // Show video when ready
      videoElement.oncanplay = () => {
        showVideo();
        videoElement.play().catch(() => {});
      };
      
      // Handle video errors
      videoElement.onerror = () => {
        showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE);
      };
      
      // Handle waiting (buffering)
      videoElement.onwaiting = () => {
        showLoading();
      };
      
      videoElement.onplaying = () => {
        hideLoading();
      };
    } else {
      showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE);
    }
    
    // Update video info
    videoTitle.textContent = `${dramaData.title} - ${formatEpisodeLabel(state.episodeIndex)}`;
    videoMeta.innerHTML = `
      <span class="meta-item">${dramaData.year || '-'}</span>
      <span class="meta-item">${state.episodes.length} Episode</span>
      <span class="meta-item">${dramaData.genres.slice(0, 3).join(', ') || '-'}</span>
    `;
    
    // Update episode list
    renderEpisodeListSidebar();
    
    // Update page title
    document.title = `${dramaData.title} - Ep ${state.episodeIndex} | roxy-drachin`;
    
    // Update browser history
    const url = new URL(window.location.href);
    url.searchParams.set('slug', state.slug);
    url.searchParams.set('index', state.episodeIndex);
    window.history.pushState({}, '', url);
  } catch (error) {
    console.error('Error loading episode:', error);
    showToast(ERROR_MESSAGES.SERVER_ERROR, 'error');
    showError(ERROR_MESSAGES.SERVER_ERROR);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Render episode list sidebar
 */
function renderEpisodeListSidebar() {
  if (!state.episodes || state.episodes.length === 0) {
    episodeListSidebar.innerHTML = '<p class="text-muted">Belum ada episode tersedia</p>';
    return;
  }
  
  const totalEpisodes = state.episodes.length;
  
  // Generate episode items
  const episodesHtml = state.episodes.map((episode, index) => {
    const episodeIndex = index + 1;
    const isActive = episodeIndex === state.episodeIndex;
    
    return `
      <a href="watch.html?slug=${state.slug}&index=${episodeIndex}" 
         class="episode-item ${isActive ? CSS_CLASSES.ACTIVE : ''}"
         data-episode="${episodeIndex}">
        <span class="episode-number">${formatEpisodeLabel(episodeIndex)}</span>
        ${episodeIndex === totalEpisodes ? '<span class="episode-status">Terakhir</span>' : ''}
      </a>
    `;
  }).join('');
  
  episodeListSidebar.innerHTML = `
    <div class="episode-list-content">
      ${episodesHtml}
    </div>
  `;
}

/**
 * Change episode
 * @param {number} direction - Direction of change (-1 for prev, 1 for next)
 */
function changeEpisode(direction) {
  const newIndex = state.episodeIndex + direction;
  
  if (newIndex < 1 || newIndex > state.episodes.length) return;
  
  // Update URL without reloading
  const url = new URL(window.location.href);
  url.searchParams.set('index', newIndex);
  window.history.pushState({}, '', url);
  
  // Load new episode
  state.episodeIndex = newIndex;
  loadEpisode();
}

/**
 * Retry video
 */
function retryVideo() {
  loadEpisode();
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
 * Initialize navbar
 */
function initNavbar() {
  const currentPage = document.body.dataset.page || 'watch';
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
  // Initialize navbar
  initNavbar();
  
  // Load episode
  await loadEpisode();
  
  // Update episode buttons
  updateEpisodeButtons();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);