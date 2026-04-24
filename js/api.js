/**
 * API Module - Drachin API Integration
 * Semua fungsi fetch API dengan cache, error handling, dan throttle
 */

import { API_CONFIG, ERROR_MESSAGES } from './config.js';
import { debounce } from './utils.js';

// In-memory cache
const cache = new Map();

// Rate limiting - track request timestamps
let requestTimestamps = [];
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Check if rate limit is exceeded
 */
function checkRateLimit() {
  const now = Date.now();
  requestTimestamps = requestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (requestTimestamps.length >= API_CONFIG.RATE_LIMIT) {
    throw new Error(ERROR_MESSAGES.RATE_LIMIT);
  }
}

/**
 * Add timestamp to rate limit tracking
 */
function recordRequest() {
  requestTimestamps.push(Date.now());
}

/**
 * Fetch with cache, error handling, and timeout
 * @param {string} endpoint - API endpoint (tanpa base URL)
 * @returns {Promise<any>} - Response data
 */
async function fetchAPI(endpoint) {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const cacheKey = url;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    const { data, timestamp } = cachedData;
    const now = Date.now();
    
    // Return cached data if not expired
    if (now - timestamp < API_CONFIG.CACHE_TTL) {
      return data;
    }
    
    // Remove expired cache
    cache.delete(cacheKey);
  }
  
  // Check rate limit
  checkRateLimit();
  recordRequest();
  
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'roxy-drachin/1.0.0'
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
    
    // Cache the response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Clear cache on error
    cache.delete(cacheKey);
    
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.TIMEOUT);
    }
    
    throw error;
  }
}

/**
 * API Module - Semua endpoint Drachin
 */
export const DrachinAPI = {
  /**
   * Get home page data (slider + latest)
   * @returns {Promise<object>} - Home data
   */
  getHome: async function() {
    return fetchAPI('/anime/drachin/home');
  },
  
  /**
   * Get latest dramas with pagination
   * @param {number} page - Page number (1-based)
   * @returns {Promise<object>} - Latest dramas data
   */
  getLatest: async function(page = 1) {
    return fetchAPI(`/anime/drachin/latest?page=${page}`);
  },
  
  /**
   * Get popular dramas with pagination
   * @param {number} page - Page number (1-based)
   * @returns {Promise<object>} - Popular dramas data
   */
  getPopular: async function(page = 1) {
    return fetchAPI(`/anime/drachin/popular?page=${page}`);
  },
  
  /**
   * Search dramas
   * @param {string} query - Search query
   * @returns {Promise<object>} - Search results
   */
  search: async function(query) {
    if (!query || query.trim().length < 2) {
      throw new Error('Query minimal 2 karakter');
    }
    return fetchAPI(`/anime/drachin/search/${encodeURIComponent(query.trim())}`);
  },
  
  /**
   * Get drama detail with recommendations
   * @param {string} slug - Drama slug
   * @returns {Promise<object>} - Drama detail data
   */
  getDetail: async function(slug) {
    if (!slug) {
      throw new Error('Slug drama wajib diisi');
    }
    return fetchAPI(`/anime/drachin/detail/${encodeURIComponent(slug)}`);
  },
  
  /**
   * Get episode stream URL
   * @param {string} slug - Drama slug
   * @param {number} index - Episode index (1-based)
   * @returns {Promise<object>} - Episode stream data
   */
  getEpisode: async function(slug, index) {
    if (!slug) {
      throw new Error('Slug drama wajib diisi');
    }
    if (!index || index < 1) {
      throw new Error('Index episode wajib >= 1');
    }
    return fetchAPI(`/anime/drachin/episode/${encodeURIComponent(slug)}?index=${index}`);
  },
  
  /**
   * Clear cache (untuk refresh data)
   */
  clearCache: function() {
    cache.clear();
    requestTimestamps = [];
  },
  
  /**
   * Get cache stats
   * @returns {object} - Cache statistics
   */
  getCacheStats: function() {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }
};

/**
 * Debounced search function - untuk search input
 * @param {function} callback - Callback function dengan results
 * @returns {function} - Debounced search function
 */
export function createDebouncedSearch(callback) {
  return debounce(async (query) => {
    try {
      const results = await DrachinAPI.search(query);
      callback(results);
    } catch (error) {
      console.error('Search error:', error);
      callback({ data: [], error: error.message });
    }
  }, 500);
}

/**
 * Prefetch data untuk performa lebih baik
 * @param {string} endpoint - Endpoint to prefetch
 */
export async function prefetchData(endpoint) {
  try {
    await fetchAPI(endpoint);
  } catch (error) {
    // Silently fail - prefetch is optional
    console.debug(`Prefetch failed for ${endpoint}:`, error);
  }
}

/**
 * Prefetch home page data
 */
export async function prefetchHome() {
  prefetchData('/anime/drachin/home');
}

/**
 * Prefetch latest page data
 */
export async function prefetchLatest(page = 1) {
  prefetchData(`/anime/drachin/latest?page=${page}`);
}

/**
 * Prefetch popular page data
 */
export async function prefetchPopular(page = 1) {
  prefetchData(`/anime/drachin/popular?page=${page}`);
}