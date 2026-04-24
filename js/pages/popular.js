/**
 * Popular Page Logic
 * Logic untuk halaman popular.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, renderEmptyState, Toast, initNavbar, initFooter } from '../components.js';
import { CSS_CLASSES, ERROR_MESSAGES, CARDS_PER_PAGE, BACK_TO_TOP_THRESHOLD_PX } from '../config.js';

// State lokal halaman
const state = {
  currentPage: 1,
  isLoading: false,
  hasMore: true,
  data: []
};

// DOM Elements
const dramaGrid = document.querySelector('#drama-grid');
const loadMoreBtn = document.querySelector('#load-more-btn');
const backToTopBtn = document.querySelector('#back-to-top');

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
      renderEmptyState(dramaGrid, 'Tidak ada drama populer', 'Coba lagi nanti', '');
    }
    state.hasMore = false;
    return;
  }
  
  const html = dramas.map((drama, index) => renderDramaCard(drama, {
    showRank: true,
    rank: (state.currentPage - 1) * 12 + index + 1
  })).join('');
  
  if (append) {
    dramaGrid.insertAdjacentHTML('beforeend', html);
  } else {
    dramaGrid.innerHTML = html;
  }
}

/**
 * Load popular dramas
 * @param {number} page - Page number
 */
async function loadPopular(page = 1) {
  state.isLoading = true;
  if (loadMoreBtn) loadMoreBtn.classList.add(CSS_CLASSES.LOADING);
  
  try {
    const data = await DrachinAPI.getPopular(page);
    
    // Extract dramas from response
    const dramas = data.data || data.dramas || [];
    
    // Update state
    state.currentPage = page;
    state.data = [...state.data, ...dramas];
    
    // Render
    renderDramaGrid(dramas, page > 1);
    
    // Update hasMore
    state.hasMore = dramas.length > 0;
    
    // Update page title
    document.title = 'Populer | roxy-drachin';
  } catch (error) {
    console.error('Error loading popular dramas:', error);
    Toast.error(ERROR_MESSAGES.SERVER_ERROR);
  } finally {
    state.isLoading = false;
    if (loadMoreBtn) loadMoreBtn.classList.remove(CSS_CLASSES.LOADING);
    
    // Hide load more button if no more data
    if (!state.hasMore && loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
  }
}

/**
 * Load more button click handler
 */
async function handleLoadMore() {
  if (state.isLoading || !state.hasMore) return;
  
  await loadPopular(state.currentPage + 1);
}

/**
 * Initialize page
 */
async function init() {
  // Show skeleton
  showSkeleton();
  
  // Initialize navbar (from components.js)
  initNavbar();

  // Initialize footer (from components.js)
  initFooter();
  
  // Load initial data
  await loadPopular(1);
  
  // Event listeners
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', handleLoadMore);
  }

  // Back to top button logic
  if (backToTopBtn) {
    const handleScroll = () => {
      if (window.scrollY > BACK_TO_TOP_THRESHOLD_PX) {
        backToTopBtn.classList.add('is-visible');
      } else {
        backToTopBtn.classList.remove('is-visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);