/**
 * API Module - Drachin API Integration
 * Semua fungsi fetch API dengan cache, error handling, dan rate limiting
 */

import {
  API_BASE_URL,
  API_TIMEOUT_MS,
  CACHE_TTL_DEFAULT,
  CACHE_TTL_HOME,
  CACHE_TTL_LATEST,
  CACHE_TTL_POPULAR,
  CACHE_TTL_DETAIL,
  CACHE_TTL_EPISODE,
  CACHE_TTL_SEARCH,
  ERROR_MESSAGES
} from './config.js';
import { globalRateLimiter, sanitizeQuery, sanitizeSlug } from './security.js';

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
    let ttl = CACHE_TTL_DEFAULT;

    if (endpoint.includes('home')) {
      ttl = CACHE_TTL_HOME;
    } else if (endpoint.includes('latest')) {
      ttl = CACHE_TTL_LATEST;
    } else if (endpoint.includes('popular')) {
      ttl = CACHE_TTL_POPULAR;
    } else if (endpoint.includes('detail')) {
      ttl = CACHE_TTL_DETAIL;
    } else if (endpoint.includes('episode')) {
      ttl = CACHE_TTL_EPISODE;
    } else if (endpoint.includes('search')) {
      ttl = CACHE_TTL_SEARCH;
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
    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
  }

  // Validasi format endpoint
  if (!validateEndpoint(endpoint)) {
    throw new Error('Invalid endpoint format');
  }

  const url = API_BASE_URL + endpoint;

  // Cek cache terlebih dahulu
  const cachedData = CacheManager.get(url);
  if (cachedData !== null) {
    return cachedData;
  }

  // Fetch dengan AbortController untuk timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

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
        throw new Error(ERROR_MESSAGES.NOT_FOUND);
      }
      if (response.status === 500) {
        throw new Error(ERROR_MESSAGES.SERVER_ERROR);
      }
      if (response.status === 429) {
        throw new Error(ERROR_MESSAGES.RATE_LIMIT);
      }
      throw new Error(`${ERROR_MESSAGES.INVALID_RESPONSE} (Status: ${response.status})`);
    }

    // Parse JSON response
    const data = await response.json();

    // Validate response structure
    if (data === null || typeof data !== 'object') {
      throw new Error(ERROR_MESSAGES.INVALID_RESPONSE);
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
      throw new Error(ERROR_MESSAGES.NETWORK);
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

  async search(query) {
    if (!query || query.trim().length < 2) {
      throw new Error('Query minimal 2 karakter');
    }

    try {
      // 1. Coba request pencarian dari API asli
      const result = await fetchAPI('/anime/drachin/search/' + sanitizeQuery(query));
      
      // Jika API mengembalikan data, langsung gunakan
      if (result && result.data && result.data.length > 0) {
        return result;
      }

      // 2. Fallback: Karena API pencarian drachin sering mengembalikan array kosong,
      // kita lakukan pencarian lokal dari data terbaru dan populer
      console.warn('API search mengembalikan hasil kosong, menggunakan local fallback search...');
      
      // Fetch beberapa halaman terbaru & populer untuk dijadikan indeks lokal
      const [latest1, latest2, popular1] = await Promise.all([
        this.getLatest(1).catch(() => ({ data: [] })),
        this.getLatest(2).catch(() => ({ data: [] })),
        this.getPopular(1).catch(() => ({ data: [] }))
      ]);

      const allDramas = [];
      const addedSlugs = new Set();

      const mergeDramas = (res) => {
        if (res && res.data && Array.isArray(res.data)) {
          res.data.forEach(drama => {
            if (!addedSlugs.has(drama.slug)) {
              allDramas.push(drama);
              addedSlugs.add(drama.slug);
            }
          });
        }
      };

      mergeDramas(latest1);
      mergeDramas(latest2);
      mergeDramas(popular1);

      // Filter berdasarkan kata kunci
      const lowerQuery = query.toLowerCase();
      const filteredDramas = allDramas.filter(drama => {
        const titleMatch = drama.title && drama.title.toLowerCase().includes(lowerQuery);
        const slugMatch = drama.slug && drama.slug.toLowerCase().includes(lowerQuery);
        return titleMatch || slugMatch;
      });

      return {
        status: 'success',
        source: 'Fallback Local Search',
        data: filteredDramas,
        pagination: { current_page: 1, has_next: false }
      };

    } catch (error) {
      console.error('Search error:', error);
      throw error;
    }
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
    const response = await fetchAPI('/anime/drachin/detail/' + sanitizeSlug(slug));
    
    // Clean " EP X" suffix from the title
    if (response && response.data && response.data.title) {
      response.data.title = response.data.title.replace(/\s+EP\s*\d+\s*$/i, '').trim();
    }
    
    return response;
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

/**
 * DramaboxAPI - Module API untuk fallback endpoint Dramabox
 */
export const DramaboxAPI = {
  /**
   * Cari drama di Dramabox
   * @param {string} query - Keyword pencarian (judul drama)
   */
  async search(query) {
    if (!query) throw new Error('Query wajib diisi');
    return fetchAPI('/anime/dramabox/search?q=' + encodeURIComponent(query));
  },

  /**
   * Get latest dramas di Dramabox
   * @param {number} page
   */
  async getLatest(page = 1) {
    return fetchAPI('/anime/dramabox/latest?page=' + page);
  },

  /**
   * Get trending dramas di Dramabox
   */
  async getTrending() {
    return fetchAPI('/anime/dramabox/trending');
  },

  /**
   * Get detail drama dari Dramabox
   * @param {string|number} bookId
   */
  async getDetail(bookId) {
    if (!bookId) throw new Error('bookId wajib diisi');
    return fetchAPI('/anime/dramabox/detail?bookId=' + encodeURIComponent(bookId));
  },

  /**
   * Get stream URL episode dari Dramabox
   * @param {string|number} bookId
   * @param {number} episode 
   */
  async getStream(bookId, episode) {
    if (!bookId || !episode) throw new Error('bookId dan episode wajib diisi');
    return fetchAPI(`/anime/dramabox/stream?bookId=${encodeURIComponent(bookId)}&episode=${parseInt(episode)}`);
  },

  /**
   * Refresh Dramabox auth token
   */
  async authRefresh() {
    return fetchAPI('/anime/dramabox/auth/refresh');
  }
};
