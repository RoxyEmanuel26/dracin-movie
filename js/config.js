/**
 * Global configuration constants
 * Semua konfigurasi API dan aplikasi disini
 */

// API Configuration
export const API_BASE_URL = 'https://api.sankavollerei.com';
export const API_TIMEOUT_MS = 10000;
export const API_RATE_LIMIT = 45;
export const API_RATE_WINDOW_MS = 60000;

// Cache TTL (dalam milidetik)
export const CACHE_TTL_DEFAULT = 300000;      // 5 menit
export const CACHE_TTL_HOME = 600000;         // 10 menit
export const CACHE_TTL_LATEST = 300000;       // 5 menit
export const CACHE_TTL_POPULAR = 600000;      // 10 menit
export const CACHE_TTL_DETAIL = 1800000;      // 30 menit
export const CACHE_TTL_EPISODE = 120000;      // 2 menit
export const CACHE_TTL_SEARCH = 0;            // tidak di-cache

// UI Configuration
export const SLIDER_AUTOPLAY_MS = 5000;
export const SEARCH_DEBOUNCE_MS = 500;
export const TOAST_DURATION_MS = 3000;
export const SKELETON_MIN_COUNT = 10;
export const CARDS_PER_PAGE = 20;
export const FADE_IN_DURATION_MS = 300;
export const BACK_TO_TOP_THRESHOLD_PX = 400;

// Meta Configuration
export const SITE_NAME = 'roxy-drachin';
export const SITE_TAGLINE = 'Drama China Terbaik Subtitle Indonesia';
export const SITE_URL = 'https://roxy-drachin.vercel.app';
export const OG_IMAGE = '/assets/og-image.jpg';

// Length Limits
export const TITLE_MAX_LENGTH = 60;
export const SYNOPSIS_PREVIEW_LENGTH = 200;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const SLUG_MAX_LENGTH = 200;

// Application constants (retained for compatibility)
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
    AUTOPLAY_INTERVAL: SLIDER_AUTOPLAY_MS,
    TRANSITION_DURATION: 600,
  },
  SEARCH: {
    DEBOUNCE_DELAY: SEARCH_DEBOUNCE_MS,
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
