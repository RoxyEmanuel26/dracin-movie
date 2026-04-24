/**
 * Search Page Logic
 * Logic untuk halaman search.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, Toast, initNavbar } from '../components.js';
import { getQueryParam, debounce } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES, CARDS_PER_PAGE } from '../config.js';

// State object
const state = {
  query: '',
  isLoading: false,
  hasMore: true,
  data: []
};

// DOM Elements
const searchInput = document.querySelector('#search-input');
const searchSubtitle = document.querySelector('#search-subtitle');
const searchCount = document.querySelector('#search-count');
const searchResults = document.querySelector('#search-results');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  searchResults.innerHTML = renderSkeletonCard(CARDS_PER_PAGE);
}

/**
 * Render search results
 * @param {array} dramas - Array of drama data
 */
function renderSearchResults(dramas) {
  if (!dramas || dramas.length === 0) {
    searchResults.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <h3 class="empty-state__title">Drama "${state.query}" tidak ditemukan</h3>
        <p class="empty-state__subtitle">Coba kata kunci lain atau jelajahi drama populer</p>
        <a href="browse.html" class="btn btn--primary">Jelajahi Browse</a>
      </div>
    `;
    searchCount.textContent = 'Tidak ada hasil';
    return;
  }

  searchResults.innerHTML = dramas.map(drama => renderDramaCard(drama)).join('');
  searchCount.textContent = `Ditemukan ${dramas.length} drama`;
}

/**
 * Load search results
 * @param {string} query - Search query
 */
async function loadSearchResults(query) {
  if (!query || query.trim().length < 2) {
    Toast.warning('Masukkan minimal 2 karakter');
    return;
  }

  state.query = query.trim();
  state.isLoading = true;
  showSkeleton();

  try {
    const data = await DrachinAPI.search(state.query);

    // Extract dramas from response
    const dramas = data.data || data.dramas || [];

    // Update state
    state.data = dramas;

    // Update UI
    searchSubtitle.textContent = `Hasil pencarian untuk "${state.query}"`;
    renderSearchResults(dramas);

    // Update page title
    document.title = `Hasil Pencarian: ${state.query} | roxy-drachin`;
  } catch (error) {
    console.error('Error loading search results:', error);
    Toast.error(ERROR_MESSAGES.SERVER_ERROR);
  } finally {
    state.isLoading = false;
  }
}

/**
 * Handle search
 * @param {Event} event - Form submit event
 */
function handleSearch(event) {
  event.preventDefault();

  const query = searchInput.value.trim();

  if (query.length < 2) {
    Toast.warning('Masukkan minimal 2 karakter');
    return;
  }

  // Clear results
  searchResults.innerHTML = '';

  // Show skeleton
  showSkeleton();

  // Load results
  loadSearchResults(query);

  // Update URL param
  const url = new URL(window.location.href);
  url.searchParams.set('q', query);
  window.history.pushState({}, '', url);
}

/**
 * Debounced search handler
 */
const debouncedSearchHandler = debounce((event) => {
  const query = event.target.value.trim();

  if (query.length >= 2) {
    // Update URL param
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);
    window.history.pushState({}, '', url);

    // Load results
    loadSearchResults(query);
  }
}, 500);

/**
 * Initialize page
 */
async function init() {
  // Get query from URL
  const query = getQueryParam('q') || '';

  // Set query in input
  searchInput.value = query;

  // Initialize navbar
  initNavbar();

  // If query exists, load results
  if (query) {
    showSkeleton();
    await loadSearchResults(query);
  } else {
    // Show empty state
    searchResults.innerHTML = `
      <div class="empty-state">
        <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <h3 class="empty-state__title">Cari drama</h3>
        <p class="empty-state__subtitle">Masukkan kata kunci di atas untuk menemukan drama</p>
      </div>
    `;
    searchSubtitle.textContent = '';
    searchCount.textContent = '';
  }

  // Event listeners
  const searchForm = document.querySelector('#search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearch);
  }

  searchInput.addEventListener('input', debouncedSearchHandler);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
