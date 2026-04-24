/**
 * Search Page Logic
 * Logic untuk halaman search.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, showToast } from '../components.js';
import { getQueryParam, debounce } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES, SELECTORS } from '../config.js';

// State lokal halaman
const state = {
  query: '',
  currentPage: 1,
  isLoading: false,
  hasMore: true,
  data: []
};

// DOM Elements
const searchInput = document.querySelector('#search-input');
const searchSubtitle = document.querySelector('#search-subtitle');
const searchCount = document.querySelector('#search-count');
const dramaGrid = document.querySelector('#drama-grid');
const loadMoreBtn = document.querySelector('#load-more-btn');
const navbarContainer = document.querySelector('.navbar-container');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  dramaGrid.innerHTML = renderSkeletonCard(8);
}

/**
 * Render drama grid
 * @param {array} dramas - Array of drama data
 * @param {boolean} append - Append to existing content
 */
function renderDramaGrid(dramas, append = false) {
  if (!dramas || dramas.length === 0) {
    if (!append) {
      dramaGrid.innerHTML = renderEmptyState(`Drama "${state.query}" tidak ditemukan`, 'Coba kata kunci lain');
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
      <a href="browse.html" class="btn btn-secondary">Kembali ke Browse</a>
    </div>
  `;
}

/**
 * Load search results
 * @param {string} query - Search query
 * @param {number} page - Page number
 */
async function loadSearchResults(query, page = 1) {
  if (!query || query.trim().length < 2) {
    showToast('Masukkan minimal 2 karakter', 'warning');
    return;
  }
  
  state.query = query.trim();
  state.isLoading = true;
  loadMoreBtn.classList.add(CSS_CLASSES.LOADING);
  
  try {
    const data = await DrachinAPI.search(state.query);
    
    // Extract dramas from response
    const dramas = data.data || data.dramas || [];
    
    // Update state
    state.currentPage = page;
    state.data = [...state.data, ...dramas];
    
    // Update UI
    searchSubtitle.textContent = `Hasil pencarian untuk "${state.query}"`;
    searchCount.textContent = `Ditemukan ${dramas.length} drama`;
    
    // Render
    renderDramaGrid(dramas, page > 1);
    
    // Update hasMore
    state.hasMore = dramas.length > 0;
    
    // Update page title
    document.title = `Hasil Pencarian: ${state.query} | roxy-drachin`;
  } catch (error) {
    console.error('Error loading search results:', error);
    showToast(ERROR_MESSAGES.SERVER_ERROR, 'error');
  } finally {
    state.isLoading = false;
    loadMoreBtn.classList.remove(CSS_CLASSES.LOADING);
    
    // Hide load more button if no more data
    if (!state.hasMore) {
      loadMoreBtn.style.display = 'none';
    }
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
    showToast('Masukkan minimal 2 karakter', 'warning');
    return;
  }
  
  // Reset state
  state.currentPage = 1;
  state.data = [];
  state.hasMore = true;
  
  // Clear grid
  dramaGrid.innerHTML = '';
  
  // Show skeleton
  showSkeleton();
  
  // Load results
  loadSearchResults(query, 1);
}

/**
 * Load more button click handler
 */
async function handleLoadMore() {
  if (state.isLoading || !state.hasMore) return;
  
  await loadSearchResults(state.query, state.currentPage + 1);
}

/**
 * Initialize navbar
 */
function initNavbar() {
  const currentPage = document.body.dataset.page || 'search';
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
  // Get query from URL
  const query = getQueryParam('q') || '';
  
  // Set query in input
  searchInput.value = query;
  
  // Initialize navbar
  initNavbar();
  
  // If query exists, load results
  if (query) {
    showSkeleton();
    await loadSearchResults(query, 1);
  } else {
    // Show empty state
    dramaGrid.innerHTML = renderEmptyState('Cari drama', 'Masukkan kata kunci di atas');
  }
  
  // Event listeners
  loadMoreBtn.addEventListener('click', handleLoadMore);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);