/**
 * Watch Page Logic
 * Logic untuk halaman watch.html
 */

import { DrachinAPI, DramaboxAPI } from '../api.js';
import { renderDramaCard, Toast, initNavbar, initFooter } from '../components.js';
import { getQueryParam, setPageTitle, handleImageError } from '../utils.js';
import { sanitize, validateUrl } from '../security.js';
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

// Video event handler references
let onCanPlay, onError, onWaiting, onPlaying;

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
        class="watch-episode-pill ${isActive ? 'is-active' : ''}"
        data-episode="${i}"
        aria-label="Episode ${i}"
      >
        ${i}
      </button>
    `);
  }

  episodeList.innerHTML = episodes.join('');

  // Add event listeners to episode pills
  const episodePills = episodeList.querySelectorAll('.watch-episode-pill');
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
  if (state.isLoading) return;

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

  // Update header and sidebar UI immediately so they are visible even on API error
  playerTitle.textContent = state.dramaTitle || 'Judul Tidak Tersedia';
  playerEpisode.textContent = `Episode ${state.episodeIndex}`;
  renderEpisodeSidebar(state.totalEpisodes, state.episodeIndex);
  updateEpisodeButtons();
  
  // Update page title
  setPageTitle(`Ep ${state.episodeIndex} - ${state.dramaTitle || 'Drama'}`);

  try {
    // Fetch episode data
    const episodeResponse = await DrachinAPI.getEpisode(state.slug, state.episodeIndex);
    const episodeData = episodeResponse.data || episodeResponse;

    // Set video source
    const rawUrl = episodeData.video_url || episodeData.url || episodeData.stream_url;
    const videoUrl = validateUrl(rawUrl);

    if (videoUrl) {
      mainVideo.pause();
      mainVideo.removeAttribute('src');
      mainVideo.load();
      mainVideo.src = videoUrl;
      mainVideo.load();

      // Explicitly manage event listeners
      if (onCanPlay) {
        mainVideo.removeEventListener('canplay', onCanPlay);
        mainVideo.removeEventListener('error', onError);
        mainVideo.removeEventListener('waiting', onWaiting);
        mainVideo.removeEventListener('playing', onPlaying);
      }

      onCanPlay = () => { showVideo(); mainVideo.play().catch(() => {}); };
      onError = () => { showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE); };
      onWaiting = () => { showLoading(); };
      onPlaying = () => { hideLoading(); };

      mainVideo.addEventListener('canplay', onCanPlay, { once: true });
      mainVideo.addEventListener('error', onError);
      mainVideo.addEventListener('waiting', onWaiting);
      mainVideo.addEventListener('playing', onPlaying);
    } else {
      throw new Error(episodeData.message || episodeResponse.message || 'Video URL not found');
    }

    // Save watch history on success
    try {
      localStorage.setItem(`watch_history_${state.slug}`, state.episodeIndex);
    } catch (e) {}

  } catch (error) {
    console.warn('DrachinAPI failed, attempting Dramabox fallback...', error);
    
    try {
      // Tampilkan status pencarian alternatif
      const loadingSpinner = document.querySelector('.video-message__icon');
      if (loadingSpinner) loadingSpinner.innerHTML = '<div class="spinner"></div>';
      const loadingText = document.querySelector('.video-message__title');
      if (loadingText) loadingText.textContent = 'Mencari sumber alternatif...';

      // 1. Refresh Token Dramabox terlebih dahulu sesuai dokumentasi
      try {
        await DramaboxAPI.authRefresh();
      } catch (authErr) {
        console.warn('Gagal refresh token Dramabox, melanjutkan pencarian...', authErr);
      }

      // 2. Cari drama di Dramabox
      const searchRes = await DramaboxAPI.search(state.dramaTitle);
      const searchData = searchRes.data || searchRes;
      
      if (!searchData || searchData.length === 0) {
        throw new Error('Drama tidak ditemukan di server alternatif');
      }

      // Ambil bookId dari hasil pencarian pertama
      const bookId = searchData[0].bookId || searchData[0].id || searchData[0].slug;

      // 2. Ambil stream episode
      const streamRes = await DramaboxAPI.getStream(bookId, state.episodeIndex);
      const streamData = streamRes.data || streamRes;
      
      const rawUrl = streamData.video_url || streamData.url || streamData.stream_url;
      const videoUrl = validateUrl(rawUrl);

      if (videoUrl) {
        mainVideo.pause();
        mainVideo.removeAttribute('src');
        mainVideo.load();
        mainVideo.src = videoUrl;
        mainVideo.load();

        if (onCanPlay) {
          mainVideo.removeEventListener('canplay', onCanPlay);
          mainVideo.removeEventListener('error', onError);
          mainVideo.removeEventListener('waiting', onWaiting);
          mainVideo.removeEventListener('playing', onPlaying);
        }

        onCanPlay = () => { showVideo(); mainVideo.play().catch(() => {}); };
        onError = () => { showError(ERROR_MESSAGES.VIDEO_UNPLAYABLE); };
        onWaiting = () => { showLoading(); };
        onPlaying = () => { hideLoading(); };

        mainVideo.addEventListener('canplay', onCanPlay, { once: true });
        mainVideo.addEventListener('error', onError);
        mainVideo.addEventListener('waiting', onWaiting);
        mainVideo.addEventListener('playing', onPlaying);

        // Save watch history on fallback success
        try {
          localStorage.setItem(`watch_history_${state.slug}`, state.episodeIndex);
        } catch (e) {}
      } else {
        throw new Error('Video URL tidak ditemukan di server alternatif');
      }

    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError);
      showError('Video tidak tersedia di Drachin maupun Dramabox API');
    }
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

  // Update exit button
  const exitBtn = document.getElementById('exit-btn');
  if (exitBtn) {
    exitBtn.href = `detail.html?slug=${encodeURIComponent(state.slug)}`;
  }

  // Initialize navbar & footer
  initNavbar();
  initFooter();

  // Fetch drama detail to get total episodes and title
  try {
    const stateData = history.state;
    if (stateData && stateData.title && stateData.totalEpisodes) {
      state.dramaTitle = stateData.title;
      state.totalEpisodes = stateData.totalEpisodes;
      setPageTitle(`Ep ${state.episodeIndex} - ${state.dramaTitle}`);
      await loadEpisode(state.episodeIndex);
    } else {
      const detailResponse = await DrachinAPI.getDetail(state.slug);
      const dramaData = detailResponse.data || detailResponse;
      state.totalEpisodes = (dramaData.episodes || []).length;
      state.dramaTitle = dramaData.title || 'Drama';

      // Update page title
      setPageTitle(`Ep ${state.episodeIndex} - ${state.dramaTitle}`);

      // Load first episode
      await loadEpisode(state.episodeIndex);
    }
  } catch (error) {
    console.error('Error loading drama detail:', error);
    Toast.error(ERROR_MESSAGES.NOT_FOUND);
    window.location.href = 'index.html';
  }

  // Setup UI event listeners (removing inline onclick)
  prevEpisodeBtn.addEventListener('click', () => changeEpisode(-1));
  nextEpisodeBtn.addEventListener('click', () => changeEpisode(1));

  const retryBtn = document.querySelector('#player-error .btn--primary');
  if (retryBtn) retryBtn.addEventListener('click', retryVideo);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
