/**
 * API Module - Drachin API Integration
 * Semua fungsi fetch API dengan cache, error handling, dan rate limiting
 */

import { CONFIG } from './config.js';
import { globalRateLimiter } from './security.js';

/**
 * CacheManager - Manajemen cache dengan TTL berbeda per endpoint
 * (BUKAN export, hanya dipakai internal)
 */
const CacheManager = {
  store: new Map(),

  /**
   * Get data dari cache
   * @param {string} key - Cache key (endpoint URL)
   * @returns {any|null} - Data jika ada dan belum expired, null jika tidak
   */
  get(key) {
    const cached = this.store.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiry) {
      this.store.delete(key);
      return null;
    }

    return cached.data;
  },

  /**
   * Set data ke cache
   * @param {string} key - Cache key (endpoint URL)
   * @param {any} data - Data yang akan di-cache
   * @param {string} endpoint - Endpoint API untuk menentukan TTL
   */
  set(key, data, endpoint) {
    let ttl = CONFIG.CACHE_TTL_DEFAULT;

    if (endpoint.includes('home')) {
      ttl = CONFIG.CACHE_TTL_HOME;
    } else if (endpoint.includes('latest')) {
      ttl = CONFIG.CACHE_TTL_LATEST;
    } else if (endpoint.includes('popular')) {
      ttl = CONFIG.CACHE_TTL_POPULAR;
    } else if (endpoint.includes('detail')) {
      ttl = CONFIG.CACHE_TTL_DETAIL;
    } else if (endpoint.includes('episode')) {
      ttl = CONFIG.CACHE_TTL_EPISODE;
    } else if (endpoint.includes('search')) {
      ttl = CONFIG.CACHE_TTL_SEARCH;
    }

    if (ttl === 0) return;

    this.store.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  },

  /**
   * Clear semua cache
   */
  clear() {
    this.store.clear();
  }
};

/**
 * Auto cleanup cache expired setiap 60 detik
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, cached] of CacheManager.store.entries()) {
    if (now > cached.expiry) {
      CacheManager.store.delete(key);
    }
  }
}, 60000);

/**
 * Validasi format endpoint dengan regex
 * @param {string} endpoint - Endpoint yang akan divalidasi
 * @returns {boolean} - true jika valid
 */
function validateEndpoint(endpoint) {
  const endpointRegex = /^\/[\w\-\/\?\=\&\.%+]+$/;
  return endpointRegex.test(endpoint);
}

/**
 * Fetch API - Private function untuk melakukan request ke API
 * @param {string} endpoint - API endpoint (tanpa base URL)
 * @returns {Promise<any>} - Response data
 */
async function fetchAPI(endpoint) {
  // Cek rate limit dulu
  if (!globalRateLimiter.canMakeRequest()) {
    throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
  }

  // Validasi format endpoint
  if (!validateEndpoint(endpoint)) {
    throw new Error('Invalid endpoint format');
  }

  const url = CONFIG.API_BASE_URL + endpoint;

  // Cek cache terlebih dahulu
  const cachedData = CacheManager.get(url);
  if (cachedData !== null) {
    return cachedData;
  }

  // Fetch dengan AbortController untuk timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    // Check response status
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(CONFIG.ERROR_MESSAGES.NOT_FOUND);
      }
      if (response.status === 500) {
        throw new Error(CONFIG.ERROR_MESSAGES.SERVER_ERROR);
      }
      if (response.status === 429) {
        throw new Error(CONFIG.ERROR_MESSAGES.RATE_LIMIT);
      }
      throw new Error(`${CONFIG.ERROR_MESSAGES.INVALID_RESPONSE} (Status: ${response.status})`);
    }

    // Parse JSON response
    const data = await response.json();

    // Validate response structure
    if (data === null || typeof data !== 'object') {
      throw new Error(CONFIG.ERROR_MESSAGES.INVALID_RESPONSE);
    }

    // Simpan hasil ke cache
    CacheManager.set(url, data, endpoint);

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(CONFIG.ERROR_MESSAGES.NETWORK);
    }

    throw error;
  }
}

/**
 * DrachinAPI - Module API untuk semua endpoint Drachin
 */
export const DrachinAPI = {
  /**
   * Get home page data (slider + latest)
   * @returns {Promise<object>} - Home data
   */
  async getHome() {
    return fetchAPI('/anime/drachin/home');
  },

  /**
   * Get latest dramas dengan pagination
   * @param {number} page - Page number (1-based)
   * @returns {Promise<object>} - Latest dramas data
   */
  async getLatest(page = 1) {
    return fetchAPI('/anime/drachin/latest?page=' + page);
  },

  /**
   * Get popular dramas dengan pagination
   * @param {number} page - Page number (1-based)
   * @returns {Promise<object>} - Popular dramas data
   */
  async getPopular(page = 1) {
    return fetchAPI('/anime/drachin/popular?page=' + page);
  },

  /**
   * Search dramas
   * @param {string} query - Search query
   * @returns {Promise<object>} - Search results
   */
  async search(query) {
    if (!query || query.trim().length < 2) {
      throw new Error('Query minimal 2 karakter');
    }
    return fetchAPI('/anime/drachin/search/' + sanitizeQuery(query));
  },

  /**
   * Get drama detail dengan recommendations
   * @param {string} slug - Drama slug
   * @returns {Promise<object>} - Drama detail data
   */
  async getDetail(slug) {
    if (!slug) {
      throw new Error('Slug drama wajib diisi');
    }
    return fetchAPI('/anime/drachin/detail/' + sanitizeSlug(slug));
  },

  /**
   * Get episode stream URL
   * @param {string} slug - Drama slug
   * @param {number} index - Episode index (1-based)
   * @returns {Promise<object>} - Episode stream data
   */
  async getEpisode(slug, index) {
    if (!slug) {
      throw new Error('Slug drama wajib diisi');
    }
    if (!index || index < 1) {
      throw new Error('Index episode wajib >= 1');
    }
    return fetchAPI('/anime/drachin/episode/' + sanitizeSlug(slug) + '?index=' + parseInt(index));
  },

  /**
   * Clear cache (untuk refresh data)
   */
  clearCache() {
    CacheManager.clear();
  },

  /**
   * Get cache stats
   * @returns {object} - Cache statistics
   */
  getCacheStats() {
    return {
      size: CacheManager.store.size,
      keys: Array.from(CacheManager.store.keys())
    };
  },

  /**
   * Get rate limiter stats
   * @returns {object} - Rate limiter statistics
   */
  getRateLimitStats() {
    return {
      remaining: globalRateLimiter.getRemainingRequests(),
      maxRequests: globalRateLimiter.maxRequests,
      windowMs: globalRateLimiter.windowMs
    };
  }
};
