/**
 * Browse Page Logic
 * Logic untuk halaman browse.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, showToast } from '../components.js';
import { CSS_CLASSES, ERROR_MESSAGES, SELECTORS } from '../config.js';

// State lokal halaman
const state = {
  currentPage: 1,
  isLoading: false,
  hasMore: true,
  type: 'latest', // 'latest' or 'popular'
  data: []
};

// DOM Elements
const dramaGrid = document.querySelector('#drama-grid');
const loadMoreBtn = document.querySelector('#load-more-btn');
const filterTabs = document.querySelectorAll('.filter-tab');
const navbarContainer = document.querySelector('.navbar-container');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  dramaGrid.innerHTML = renderSkeletonCard(12);
}

/**
 * Render drama grid
 * @param {array} dramas - Array of drama data
 * @param {boolean} append - Append to existing content
 */
function renderDramaGrid(dramas, append = false) {
  if (!dramas || dramas.length === 0) {
    if (!append) {
      dramaGrid.innerHTML = renderEmptyState('Tidak ada drama', 'Coba filter lain atau cek lagi nanti');
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
 * Load dramas
 * @param {number} page - Page number
 * @param {string} type - Type of dramas ('latest' or 'popular')
 */
async function loadDramas(page = 1, type = 'latest') {
  state.isLoading = true;
  loadMoreBtn.classList.add(CSS_CLASSES.LOADING);
  
  try {
    let data;
    
    if (type === 'latest') {
      data = await DrachinAPI.getLatest(page);
    } else {
      data = await DrachinAPI.getPopular(page);
    }
    
    // Extract dramas from response
    const dramas = data.data || data.dramas || [];
    
    // Update state
    state.currentPage = page;
    state.type = type;
    state.data = [...state.data, ...dramas];
    
    // Render
    renderDramaGrid(dramas, page > 1);
    
    // Update hasMore
    state.hasMore = dramas.length > 0;
    
    // Update page title
    document.title = `${type === 'latest' ? 'Terbaru' : 'Populer'} | roxy-drachin`;
  } catch (error) {
    console.error(`Error loading ${type} dramas:`, error);
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
 * Handle filter tab change
 * @param {string} type - Type of dramas ('latest' or 'popular')
 */
function handleFilterChange(type) {
  // Update active tab
  filterTabs.forEach(tab => {
    tab.classList.toggle(CSS_CLASSES.ACTIVE, tab.dataset.type === type);
  });
  
  // Reset state
  state.currentPage = 1;
  state.data = [];
  state.hasMore = true;
  
  // Clear grid
  dramaGrid.innerHTML = '';
  
  // Show skeleton
  showSkeleton();
  
  // Load new data
  loadDramas(1, type);
}

/**
 * Load more button click handler
 */
async function handleLoadMore() {
  if (state.isLoading || !state.hasMore) return;
  
  await loadDramas(state.currentPage + 1, state.type);
}

/**
 * Initialize navbar
 */
function initNavbar() {
  const currentPage = document.body.dataset.page || 'browse';
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
          <a href="browse.html" class="nav-link is-active">Browse</a>
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
  
  // Load initial data
  await loadDramas(1, 'latest');
  
  // Event listeners
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      handleFilterChange(tab.dataset.type);
    });
  });
  
  loadMoreBtn.addEventListener('click', handleLoadMore);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);