/**
 * Watch Page Logic
 * Logic untuk halaman watch.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, Toast, initNavbar, initFooter } from '../components.js';
import { getQueryParam, setPageTitle, handleImageError } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES } from '../config.js';

// State object
const state = {
  slug: '',
  episodeIndex: 1,
  isLoading: false,
  data: null,
  totalEpisodes: 0,
  dramaTitle: ''
};

// DOM Elements
const mainVideo = document.querySelector('#main-video');
const playerLoading = document.querySelector('#player-loading');
const playerError = document.querySelector('#player-error');
const playerTitle = document.querySelector('#player-title');
const playerEpisode = document.querySelector('#player-episode');
const prevEpisodeBtn = document.querySelector('#prev-episode-btn');
const nextEpisodeBtn = document.querySelector('#next-episode-btn');
const episodeList = document.querySelector('#episode-list');

/**
 * Show loading state
 */
function showLoading() {
  playerLoading.classList.remove('is-hidden');
  playerError.classList.add('is-hidden');
  mainVideo.style.display = 'none';
}

/**
 * Hide loading state
 */
function hideLoading() {
  playerLoading.classList.add('is-hidden');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
  playerLoading.classList.add('is-hidden');
  playerError.classList.remove('is-hidden');
  mainVideo.style.display = 'none';
  
  const errorMessage = playerError.querySelector('.error-message');
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}

/**
 * Hide error state
 */
function hideError() {
  playerError.classList.add('is-hidden');
}

/**
 * Show video player
 */
function showVideo() {
  mainVideo.style.display = 'block';
  hideLoading();
  hideError();
}

/**
 * Update episode navigation buttons
 */
function updateEpisodeButtons() {
  if (state.episodeIndex === 1) {
    prevEpisodeBtn.disabled = true;
  } else {
    prevEpisodeBtn.disabled = false;
  }

  if (state.episodeIndex === state.totalEpisodes) {
    nextEpisodeBtn.disabled = true;
  } else {
    nextEpisodeBtn.disabled = false;
  }
}

/**
 * Render episode sidebar
 * @param {number} totalEpisodes - Total number of episodes
 * @param {number} currentIndex - Current episode index
 */
function renderEpisodeSidebar(totalEpisodes, currentIndex) {
  const episodes = [];
  for (let i = 1; i <= totalEpisodes; i++) {
    const isActive = i === currentIndex;
    episodes.push(`
      <button 
        class="episode-pill ${isActive ? 'is-active' : ''}"
        data-episode="${i}"
        aria-label="Episode ${i}"
      >
        ${i}
      </button>
    `);
  }

  episodeList.innerHTML = `
    <div class="episode-list__content">
      ${episodes.join('')}
    </div>
  `;

  // Add event listeners to episode pills
  const episodePills = episodeList.querySelectorAll('.episode-pill');
  episodePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const episodeIndex = parseInt(pill.dataset.episode, 10);
      loadEpisode(episodeIndex);
    });
  });
}

/**
 * Load episode
 * @param {number} newIndex - Episode index to load
 */
async function loadEpisode(newIndex) {
  // Validate slug
  if (!state.slug) {
    Toast.error('Slug drama tidak ditemukan');
    window.location.href = 'index.html';
    return;
  }

  // Update index if provided
  if (newIndex) {
    state.episodeIndex = newIndex;
  }

  // Update URL params
  const url = new URL(window.location.href);
  url.searchParams.set('slug', state.slug);
  url.searchParams.set('index', state.episodeIndex);
  window.history.pushState({}, '', url);

  state.isLoading = true;
  showLoading();

  try {
    // Fetch episode data
    const episodeData = await DrachinAPI.getEpisode(state.slug, state.episodeIndex);

    // Set video source
    const videoUrl = episodeData.video_url || episodeData.url || episodeData.stream_url;

    if (videoUrl) {
      mainVideo.src = videoUrl;
      mainVideo.load();

      // Show video when ready
      mainVideo.oncanplay = () => {
        showVideo();
        mainVideo.play().catch(() => {});
      };

      // Handle video errors
      mainVideo.onerror = () => {
        showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE);
      };

      // Handle waiting (buffering)
      mainVideo.onwaiting = () => {
        showLoading();
      };

      mainVideo.onplaying = () => {
        hideLoading();
      };
    } else {
      showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE);
    }

    // Update header
    playerTitle.textContent = state.dramaTitle;
    playerEpisode.textContent = `Episode ${state.episodeIndex}`;

    // Update episode sidebar
    renderEpisodeSidebar(state.totalEpisodes, state.episodeIndex);
    updateEpisodeButtons();

    // Update page title
    setPageTitle(`Ep ${state.episodeIndex} - ${state.dramaTitle}`);
  } catch (error) {
    console.error('Error loading episode:', error);
    showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Change episode
 * @param {number} direction - Direction of change (-1 for prev, 1 for next)
 */
function changeEpisode(direction) {
  const newIndex = state.episodeIndex + direction;

  if (newIndex < 1 || newIndex > state.totalEpisodes) return;

  loadEpisode(newIndex);
}

/**
 * Retry video
 */
function retryVideo() {
  loadEpisode();
}

/**
 * Initialize page
 */
async function init() {
  // Get params from URL
  state.slug = getQueryParam('slug');
  state.episodeIndex = parseInt(getQueryParam('index')) || 1;

  // Validate slug
  if (!state.slug) {
    Toast.error('Slug drama tidak ditemukan');
    window.location.href = 'index.html';
    return;
  }

  // Initialize navbar & footer
  initNavbar();
  initFooter();

  // Fetch drama detail to get total episodes and title
  try {
    const dramaData = await DrachinAPI.getDetail(state.slug);
    state.totalEpisodes = (dramaData.episodes || []).length;
    state.dramaTitle = dramaData.title || 'Drama';

    // Update page title
    setPageTitle(`Ep ${state.episodeIndex} - ${state.dramaTitle}`);

    // Load first episode
    await loadEpisode(state.episodeIndex);
  } catch (error) {
    console.error('Error loading drama detail:', error);
    Toast.error(ERROR_MESSAGES.NOT_FOUND);
    window.location.href = 'index.html';
  }
}

// Expose functions to global scope for HTML onclick attributes
window.changeEpisode = changeEpisode;
window.retryVideo = retryVideo;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
