/**
 * Global configuration constants
 * Semua konfigurasi API dan aplikasi disini
 */

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://api.sankavollerei.com',
  TIMEOUT: 10000, // 10 detik timeout
  RATE_LIMIT: 50, // 50 requests per minute
  CACHE_TTL: 5 * 60 * 1000, // 5 menit cache TTL
};

// Application constants
export const APP_CONFIG = {
  NAME: 'roxy-drachin',
  VERSION: '1.0.0',
  MAX_SLIDE_ITEMS: 5,
  ITEMS_PER_PAGE: {
    HOME: 8,
    BROWSE: 12,
    POPULAR: 12,
  },
  SLIDER: {
    AUTOPLAY_INTERVAL: 5000, // 5 detik
    TRANSITION_DURATION: 600, // 600ms
  },
  SEARCH: {
    DEBOUNCE_DELAY: 500, // 500ms debounce
    MIN_QUERY_LENGTH: 2,
  },
  PAGINATION: {
    DEFAULT_PAGE: 1,
    ITEMS_PER_LOAD: 12,
  },
};

// DOM selectors
export const SELECTORS = {
  NAVBAR: '.navbar',
  SEARCH_INPUT: '.search-input',
  SEARCH_FORM: '.search-form',
  HERO_SLIDER: '.hero-slider',
  DRAMA_GRID: '.drama-grid',
  EPISODE_LIST: '.episode-list',
  VIDEO_PLAYER: '.video-player',
  TOAST_CONTAINER: '.toast-container',
};

// CSS class names
export const CSS_CLASSES = {
  ACTIVE: 'is-active',
  LOADING: 'is-loading',
  ERROR: 'is-error',
  VISIBLE: 'is-visible',
  HIDDEN: 'is-hidden',
  SCROLLED: 'is-scrolled',
  EXPANDED: 'is-expanded',
  HIGHLIGHTED: 'is-highlighted',
};

// Local storage keys (untuk user preferences, bukan data drama)
export const STORAGE_KEYS = {
  THEME: 'roxy-theme',
  LAST_VIEWED: 'roxy-last-viewed',
  FAVORITES: 'roxy-favorites',
  WATCH_HISTORY: 'roxy-watch-history',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Koneksi internet bermasalah. Silakan coba lagi.',
  TIMEOUT: 'Request timeout. Server terlalu lambat merespons.',
  NOT_FOUND: 'Data tidak ditemukan.',
  SERVER_ERROR: 'Terjadi kesalahan pada server. Silakan coba lagi nanti.',
  RATE_LIMIT: 'Terlalu banyak permintaan. Silakan tunggu sebentar.',
  INVALID_RESPONSE: 'Respons server tidak valid.',
  VIDEO_UNPLAYABLE: 'Video tidak dapat diputar. Coba episode lain.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  ADDED_TO_FAVORITES: 'Drama ditambahkan ke favorit',
  REMOVED_FROM_FAVORITES: 'Drama dihapus dari favorit',
  COPIED_TO_CLIPBOARD: 'Link disalin ke clipboard',
};