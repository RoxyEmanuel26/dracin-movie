/**
 * Home Page Logic
 * Logic untuk halaman index.html
 */

import { DrachinAPI } from '../api.js';
import { renderDramaCard, renderSkeletonCard, Toast, initNavbar, initFooter } from '../components.js';
import { debounce, handleImageError } from '../utils.js';
import { CSS_CLASSES, ERROR_MESSAGES, SELECTORS, CARDS_PER_PAGE, BACK_TO_TOP_THRESHOLD_PX } from '../config.js';
import { sanitize, validateUrl } from '../security.js';

// State object
const state = {
  sliderData: [],
  latestData: [],
  popularData: [],
  recData: []
};

// DOM Elements
const heroSliderContainer = document.querySelector('#hero-slider');
const latestGrid = document.querySelector('#latest-grid');
const popularGrid = document.querySelector('#popular-grid');
const recommendationGrid = document.querySelector('#recommendation-grid');
const backToTopBtn = document.querySelector('#back-to-top');

/**
 * Render hero slider dengan autoplay, dots, dan swipe support
 * @param {array} slides - Array of slide data
 */
export function initHeroSlider(slides) {
  const container = heroSliderContainer || document.querySelector('#hero-slider');
  if (!container) return;

  if (!slides || slides.length === 0) {
    container.innerHTML = '';
    return;
  }

  let currentSlide = 0;
  let autoPlayInterval = null;
  const autoPlayDuration = 5000;

  // Build slider HTML
  let slidesHTML = '';
  let dotsHTML = '';

  slides.forEach((slide, index) => {
    const title = sanitize(slide.title || slide.judul || 'Judul Tidak Tersedia');
    const slug = encodeURIComponent(slide.slug || '');
    const posterRaw = slide.poster || slide.thumbnail || slide.image || '';
    const poster = validateUrl(posterRaw) || '/assets/poster-placeholder.svg';
    const genre = sanitize(slide.genre || slide.kategori || '');
    const synopsis = sanitize((slide.synopsis || slide.sinopsis || '').slice(0, 200));

    slidesHTML += `
      <div class="hero-slide ${index === 0 ? 'is-active' : ''}" data-index="${index}">
        <div class="hero-slide__poster" style="background-image: url('${poster}')"></div>
        <div class="hero-slide__overlay"></div>
        <div class="hero-slide__content">
          <h1 class="hero-slide__title">${title}</h1>
          <p class="hero-slide__synopsis">${synopsis}</p>
          ${genre ? `<span class="hero-slide__badge badge badge--new">${genre}</span>` : ''}
          <div class="hero-slide__actions">
            <a href="watch.html?slug=${slug}" class="btn btn--primary">Tonton Sekarang</a>
            <a href="detail.html?slug=${slug}" class="btn btn--outline">Detail</a>
          </div>
        </div>
      </div>
    `;

    dotsHTML += `<button class="slider-dot ${index === 0 ? 'is-active' : ''}" data-slide="${index}" aria-label="Slide ${index + 1}"></button>`;
  });

  container.innerHTML = `
    <div class="hero-slider">
      <div class="hero-slider__slides">
        ${slidesHTML}
      </div>
      <div class="hero-slider__controls">
        <button class="slider-btn slider-btn-prev" aria-label="Slide sebelumnya">←</button>
        <button class="slider-btn slider-btn-next" aria-label="Slide selanjutnya">→</button>
      </div>
      <div class="hero-slider__dots">
        ${dotsHTML}
      </div>
    </div>
  `;

  // Update active slide
  function updateSlide(index) {
    const slides = container.querySelectorAll('.hero-slide');
    const dots = container.querySelectorAll('.slider-dot');

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });

    currentSlide = index;
  }

  // Next slide
  function nextSlide() {
    const slides = container.querySelectorAll('.hero-slide');
    const newIndex = (currentSlide + 1) % slides.length;
    updateSlide(newIndex);
  }

  // Previous slide
  function prevSlide() {
    const slides = container.querySelectorAll('.hero-slide');
    const newIndex = (currentSlide - 1 + slides.length) % slides.length;
    updateSlide(newIndex);
  }

  // Auto play
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(nextSlide, autoPlayDuration);
  }

  // Stop auto play
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  // Event listeners
  const prevBtn = container.querySelector('.slider-btn-prev');
  const nextBtn = container.querySelector('.slider-btn-next');
  const dots = container.querySelectorAll('.slider-dot');

  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const index = parseInt(dot.dataset.slide, 10);
      updateSlide(index);
    });
  });

  // Pause on hover
  const slider = container.querySelector('.hero-slider');
  if (slider) {
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);
  }

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;

  if (slider) {
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    slider.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    });
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    if (touchEndX < touchStartX - swipeThreshold) {
      nextSlide();
    }
    if (touchEndX > touchStartX + swipeThreshold) {
      prevSlide();
    }
  }

  // Start auto play
  startAutoPlay();
}

/**
 * Render latest dramas section
 * @param {array} dramas - Array of drama data
 */
function renderLatestSection(dramas) {
  if (!dramas || dramas.length === 0) {
    latestGrid.innerHTML = '';
    return;
  }

  latestGrid.innerHTML = dramas.map(drama => renderDramaCard(drama, {
    showBadge: true,
    badgeText: 'BARU',
    badgeType: 'new'
  })).join('');
}

/**
 * Render popular dramas section
 * @param {array} dramas - Array of drama data
 */
function renderPopularSection(dramas) {
  if (!dramas || dramas.length === 0) {
    popularGrid.innerHTML = '';
    return;
  }

  popularGrid.innerHTML = dramas.map((drama, index) => renderDramaCard(drama, {
    showRank: true,
    rank: index + 1
  })).join('');
}

/**
 * Render recommendation section
 * @param {array} dramas - Array of drama data
 */
function renderRecommendationSection(dramas) {
  if (!dramas || dramas.length === 0) {
    recommendationGrid.innerHTML = '';
    return;
  }

  recommendationGrid.innerHTML = dramas.map(drama => renderDramaCard(drama)).join('');
}

/**
 * Show skeleton loading untuk semua section
 */
function showSkeleton() {
  heroSliderContainer.innerHTML = '<div class="skeleton skeleton--shimmer" style="height: 60vh;"></div>';
  latestGrid.innerHTML = renderSkeletonCard(CARDS_PER_PAGE);
  popularGrid.innerHTML = renderSkeletonCard(CARDS_PER_PAGE);
  recommendationGrid.innerHTML = renderSkeletonCard(CARDS_PER_PAGE);
}

/**
 * Initialize page
 */
async function init() {
  // Show skeleton
  showSkeleton();

  // Initialize navbar & footer
  initNavbar();
  initFooter();

  // Fetch data in parallel
  try {
    const [homeData, latestData, popularData] = await Promise.all([
      DrachinAPI.getHome().catch(() => null),
      DrachinAPI.getLatest().catch(() => null),
      DrachinAPI.getPopular().catch(() => null)
    ]);

    // Store data in state
    if (homeData && homeData.slider) {
      state.sliderData = homeData.slider;
    }
    if (latestData && latestData.data) {
      state.latestData = latestData.data;
    }
    if (popularData && popularData.data) {
      state.popularData = popularData.data;
    }
    if (homeData && homeData.recommendations) {
      state.recData = homeData.recommendations;
    }

    // Render sections
    initHeroSlider(state.sliderData);

    if (state.latestData.length > 0) {
      renderLatestSection(state.latestData);
    } else {
      latestGrid.innerHTML = '';
    }

    if (state.popularData.length > 0) {
      renderPopularSection(state.popularData);
    } else {
      popularGrid.innerHTML = '';
    }

    if (state.recData.length > 0) {
      renderRecommendationSection(state.recData);
    } else {
      recommendationGrid.innerHTML = '';
    }

    // Update page title
    document.title = 'Home | roxy-drachin';
  } catch (error) {
    console.error('Error loading home data:', error);
    Toast.error(ERROR_MESSAGES.SERVER_ERROR);
  }

  // Back to top button logic
  const handleScroll = () => {
    if (window.scrollY > BACK_TO_TOP_THRESHOLD_PX) {
      backToTopBtn.classList.add('is-visible');
    } else {
      backToTopBtn.classList.remove('is-visible');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // Initial check

  // Back to top button click
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);