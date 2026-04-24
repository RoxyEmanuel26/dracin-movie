/**
 * Browse Page Logic
 * Logic untuk halaman browse.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, Toast, initNavbar } from '../components.js';
import { CSS_CLASSES, ERROR_MESSAGES, CARDS_PER_PAGE } from '../config.js';

// State object
const state = {
  mode: 'latest',
  page: 1,
  isLoading: false,
  hasMore: true,
  data: []
};

// DOM Elements
const dramaGrid = document.querySelector('#drama-grid');
const btnLoadMore = document.querySelector('#btn-load-more');
const tabLatest = document.querySelector('#tab-latest');
const tabPopular = document.querySelector('#tab-popular');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  dramaGrid.innerHTML = renderSkeletonCard(CARDS_PER_PAGE);
}

/**
 * Render drama grid
 * @param {array} dramas - Array of drama data
 * @param {boolean} append - Append to existing content
 */
function renderDramaGrid(dramas, append = false) {
  if (!dramas || dramas.length === 0) {
    if (!append) {
      dramaGrid.innerHTML = '';
    }
    state.hasMore = false;
    return;
  }

  const html = dramas.map(drama => renderDramaCard(drama)).join('');

  if (append) {
    dramaGrid.insertAdjacentHTML('beforeend', html);
  } else {
    dramaGrid.innerHTML = html;
  }
}

/**
 * Load dramas
 * @param {number} page - Page number
 * @param {string} mode - Mode ('latest' or 'popular')
 */
async function loadDramas(page = 1, mode = 'latest') {
  state.isLoading = true;
  btnLoadMore.classList.add('is-loading');

  try {
    let data;

    if (mode === 'latest') {
      data = await DrachinAPI.getLatest(page);
    } else {
      data = await DrachinAPI.getPopular(page);
    }

    // Extract dramas from response
    const dramas = data.data || data.dramas || [];

    // Update state
    state.page = page;
    state.mode = mode;
    state.data = [...state.data, ...dramas];

    // Render
    renderDramaGrid(dramas, page > 1);

    // Update hasMore
    state.hasMore = dramas.length > 0;

    // Update page title
    document.title = `${mode === 'latest' ? 'Terbaru' : 'Populer'} | roxy-drachin`;
  } catch (error) {
    console.error(`Error loading ${mode} dramas:`, error);
    Toast.error(ERROR_MESSAGES.SERVER_ERROR);
  } finally {
    state.isLoading = false;
    btnLoadMore.classList.remove('is-loading');

    // Hide load more button if no more data
    if (!state.hasMore) {
      btnLoadMore.style.display = 'none';
    }
  }
}

/**
 * Handle filter tab change
 * @param {string} mode - Mode ('latest' or 'popular')
 */
function handleFilterChange(mode) {
  // Update active tab
  tabLatest.classList.toggle('is-active', mode === 'latest');
  tabPopular.classList.toggle('is-active', mode === 'popular');

  // Reset state
  state.page = 1;
  state.data = [];
  state.hasMore = true;

  // Clear grid
  dramaGrid.innerHTML = '';

  // Show skeleton
  showSkeleton();

  // Load new data
  loadDramas(1, mode);
}

/**
 * Load more button click handler
 */
async function handleLoadMore() {
  if (state.isLoading || !state.hasMore) return;

  await loadDramas(state.page + 1, state.mode);
}

/**
 * Initialize page
 */
async function init() {
  // Show skeleton
  showSkeleton();

  // Initialize navbar
  initNavbar();

  // Load initial data
  await loadDramas(1, 'latest');

  // Event listeners
  tabLatest.addEventListener('click', () => handleFilterChange('latest'));
  tabPopular.addEventListener('click', () => handleFilterChange('popular'));

  btnLoadMore.addEventListener('click', handleLoadMore);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
