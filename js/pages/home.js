/**
 * Home Page Logic
 * Logic untuk halaman index.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, renderSlider, showToast } from '../components.js';
import { debounce, handleImageError } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES, SELECTORS } from '../config.js';

// State lokal halaman
const state = {
  currentPage: 1,
  isLoading: false,
  hasMore: true,
  data: {
    slider: [],
    latest: [],
    popular: [],
    recommendations: []
  }
};

// DOM Elements
const heroSliderContainer = document.querySelector('#hero-slider');
const latestGrid = document.querySelector('#latest-grid');
const popularGrid = document.querySelector('#popular-grid');
const recommendationGrid = document.querySelector('#recommendation-grid');
const navbarContainer = document.querySelector('.navbar-container');

/**
 * Show skeleton loading
 */
function showSkeleton() {
  heroSliderContainer.innerHTML = '<div class="skeleton-card" style="height: 80vh; width: 100%;"></div>';
  latestGrid.innerHTML = renderSkeletonCard(8);
  popularGrid.innerHTML = renderSkeletonCard(8);
  recommendationGrid.innerHTML = renderSkeletonCard(5);
}

/**
 * Render hero slider
 * @param {array} slides - Array of slide data
 */
function renderHeroSlider(slides) {
  if (!slides || slides.length === 0) {
    heroSliderContainer.innerHTML = '';
    return;
  }
  
  heroSliderContainer.innerHTML = renderSlider(slides, {
    autoPlay: true,
    interval: 5000,
    showControls: true,
    showDots: true
  });
  
  // Initialize slider functionality
  initSlider();
}

/**
 * Initialize slider functionality
 */
function initSlider() {
  const slider = document.querySelector('.hero-slider');
  if (!slider) return;
  
  const slides = slider.querySelectorAll('.hero-slide');
  const dots = slider.querySelectorAll('.slider-dot');
  const prevBtn = slider.querySelector('.slider-btn-prev');
  const nextBtn = slider.querySelector('.slider-btn-next');
  
  let currentIndex = 0;
  let autoPlayInterval = null;
  const autoPlay = slider.dataset.autoplay === 'true';
  const interval = parseInt(slider.dataset.interval) || 5000;
  
  // Update active slide
  function updateSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle(CSS_CLASSES.ACTIVE, i === index);
    });
    
    dots.forEach((dot, i) => {
      dot.classList.toggle(CSS_CLASSES.ACTIVE, i === index);
    });
    
    currentIndex = index;
  }
  
  // Next slide
  function nextSlide() {
    const newIndex = (currentIndex + 1) % slides.length;
    updateSlide(newIndex);
  }
  
  // Previous slide
  function prevSlide() {
    const newIndex = (currentIndex - 1 + slides.length) % slides.length;
    updateSlide(newIndex);
  }
  
  // Auto play
  function startAutoPlay() {
    if (autoPlay) {
      stopAutoPlay();
      autoPlayInterval = setInterval(nextSlide, interval);
    }
  }
  
  // Stop auto play
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }
  
  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
  }
  
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => updateSlide(index));
  });
  
  // Pause on hover
  slider.addEventListener('mouseenter', stopAutoPlay);
  slider.addEventListener('mouseleave', startAutoPlay);
  
  // Start auto play
  startAutoPlay();
  
  // Mobile swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      nextSlide();
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      prevSlide();
    }
  }
}

/**
 * Render latest dramas
 * @param {array} dramas - Array of drama data
 */
function renderLatestDramas(dramas) {
  if (!dramas || dramas.length === 0) {
    latestGrid.innerHTML = renderEmptyState('Tidak ada drama terbaru', 'Coba lagi nanti');
    return;
  }
  
  latestGrid.innerHTML = dramas.map(drama => renderDramaCard(drama, {
    showBadge: true,
    badgeText: 'BARU'
  })).join('');
}

/**
 * Render popular dramas
 * @param {array} dramas - Array of drama data
 */
function renderPopularDramas(dramas) {
  if (!dramas || dramas.length === 0) {
    popularGrid.innerHTML = renderEmptyState('Tidak ada drama populer', 'Coba lagi nanti');
    return;
  }
  
  popularGrid.innerHTML = dramas.map((drama, index) => renderDramaCard(drama, {
    showRank: true,
    rank: index + 1
  })).join('');
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
 * Load home data
 */
async function loadHomeData() {
  try {
    const homeData = await DrachinAPI.getHome();
    
    // Extract data from response
    const slider = homeData.slider || [];
    const latest = homeData.latest || [];
    const popular = homeData.popular || [];
    const recommendations = homeData.recommendations || [];
    
    // Store in state
    state.data.slider = slider;
    state.data.latest = latest;
    state.data.popular = popular;
    state.data.recommendations = recommendations;
    
    // Render components
    renderHeroSlider(slider);
    renderLatestDramas(latest);
    renderPopularDramas(popular);
    renderRecommendations(recommendations);
    
    // Update page title
    document.title = 'Home | roxy-drachin';
  } catch (error) {
    console.error('Error loading home data:', error);
    showToast(ERROR_MESSAGES.SERVER_ERROR, 'error');
    
    // Show error state
    heroSliderContainer.innerHTML = renderErrorState(ERROR_MESSAGES.SERVER_ERROR, loadHomeData);
    latestGrid.innerHTML = renderErrorState(ERROR_MESSAGES.SERVER_ERROR, loadHomeData);
    popularGrid.innerHTML = renderErrorState(ERROR_MESSAGES.SERVER_ERROR, loadHomeData);
    recommendationGrid.innerHTML = renderErrorState(ERROR_MESSAGES.SERVER_ERROR, loadHomeData);
  }
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
 * Debounced search handler
 */
const debouncedSearchHandler = debounce((event) => {
  const query = event.target.value.trim();
  
  if (query.length >= 2) {
    // Prefetch search results
    DrachinAPI.search(query).catch(() => {});
  }
}, 500);

/**
 * Initialize navbar
 */
function initNavbar() {
  const currentPage = document.body.dataset.page || 'home';
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
          <a href="index.html" class="nav-link is-active">Home</a>
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
  
  // Add event listener to search input
  const searchInput = document.querySelector('.search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debouncedSearchHandler);
  }
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
  await loadHomeData();
  
  // Add scroll listener for navbar
  let lastScrollY = window.scrollY;
  const navbar = document.querySelector('.navbar');
  
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      navbar.classList.add(CSS_CLASSES.SCROLLED);
    } else {
      navbar.classList.remove(CSS_CLASSES.SCROLLED);
    }
    
    lastScrollY = currentScrollY;
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);