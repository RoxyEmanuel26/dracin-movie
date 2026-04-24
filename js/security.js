/**
 * Security utilities for roxy-drachin
 * Provides input sanitization, URL validation, and rate limiting
 */

/**
 * Sanitize string by escaping dangerous characters
 * @param {string} str - Input string to sanitize
 * @returns {string} - Sanitized string or empty string if not a string
 */
export function sanitize(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/`/g, '&#x60;')
    .replace(/=/g, '&#x3D;');
}

/**
 * Validate URL to ensure it uses safe protocols
 * @param {string} url - URL to validate
 * @returns {string} - Validated URL or empty string if invalid
 */
export function validateUrl(url) {
  if (typeof url !== 'string' || url.trim() === '') {
    return '';
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return '';
    }

    return url;
  } catch (e) {
    return '';
  }
}

/**
 * Sanitize slug for use in URLs
 * @param {string} slug - Slug to sanitize
 * @returns {string} - Sanitized slug or empty string if invalid
 */
export function sanitizeSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return '';
  }

  const sanitized = slug.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 200);
  return sanitized;
}

/**
 * Sanitize query string for search
 * @param {string} query - Query string to sanitize
 * @returns {string} - Sanitized and encoded query or empty string if invalid
 */
export function sanitizeQuery(query) {
  if (!query || typeof query !== 'string') {
    return '';
  }

  const trimmed = query.trim();
  const limited = trimmed.slice(0, 100);
  return encodeURIComponent(limited);
}

/**
 * Rate limiter class for API request throttling
 */
export class RateLimiter {
  /**
   * @param {number} maxRequests - Maximum requests allowed in window
   * @param {number} windowMs - Time window in milliseconds
   */
  constructor(maxRequests = 45, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  /**
   * Check if a request can be made and record it if allowed
   * @returns {boolean} - True if request is allowed, false if rate limited
   */
  canMakeRequest() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    this.requests = this.requests.filter(timestamp => timestamp > windowStart);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  /**
   * Get the number of remaining requests in the current window
   * @returns {number} - Number of remaining request slots
   */
  getRemainingRequests() {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const filteredRequests = this.requests.filter(timestamp => timestamp > windowStart);
    return Math.max(0, this.maxRequests - filteredRequests.length);
  }
}

/**
 * Global rate limiter instance for general API usage
 */
export const globalRateLimiter = new RateLimiter(45, 60000);
