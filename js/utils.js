/**
 * Utility functions
 * Helper functions untuk operasi umum
 */

import { CSS_CLASSES, ERROR_MESSAGES } from './config.js';

// Debounce function - menunda eksekusi fungsi sampai delay tertentu
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// Truncate text - potong teks jika terlalu panjang
export function truncate(text, maxLength = 100, suffix = '...') {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + suffix;
}

// Get query parameter from URL
export function getQueryParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Set page title dengan brand suffix
export function setPageTitle(title) {
  document.title = `${title} | roxy-drachin`;
}

// Format episode label
export function formatEpisodeLabel(index) {
  return `Episode ${index}`;
}

// Handle image error - fallback ke placeholder
export function handleImageError(imgEl) {
  if (imgEl.dataset.fallbackAttempted === 'true') return;
  
  imgEl.dataset.fallbackAttempted = 'true';
  imgEl.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"%3E%3Crect fill="%231A1A1A" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%235A5A5A" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
  imgEl.alt = 'Poster tidak tersedia';
}

// Format date - ubah format tanggal ke format Indonesia
export function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  
  try {
    return date.toLocaleDateString('id-ID', options);
  } catch (e) {
    return dateString;
  }
}

// Format number dengan pemisah ribuan
export function formatNumber(num) {
  return new Intl.NumberFormat('id-ID').format(num);
}

// Generate slug dari teks
export function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Check if element is in viewport
export function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// Scroll to element dengan offset
export function scrollToElement(element, offset = 0) {
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// Copy text to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Get unique items from array
export function uniqueBy(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// Shuffle array (Fisher-Yates)
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Get random item from array
export function getRandomItem(array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(Math.random() * array.length)];
}

// Check if object is empty
export function isEmptyObject(obj) {
  return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
}

// Deep clone object
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Throttle function - batasi frekuensi eksekusi
export function throttle(fn, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Get browser language
export function getBrowserLanguage() {
  return navigator.language || navigator.userLanguage || 'en-US';
}

// Check if device is mobile
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Get viewport width category
export function getViewportCategory() {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1280) return 'tablet';
  return 'desktop';
}

// Debounce promise - untuk async operations
export function debouncePromise(fn, delay) {
  let timeoutId;
  let lastResolve;
  
  return function (...args) {
    return new Promise((resolve) => {
      clearTimeout(timeoutId);
      lastResolve = resolve;
      
      timeoutId = setTimeout(() => {
        fn.apply(this, args).then(resolve);
      }, delay);
    });
  };
}

// Wait for element to exist
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        observer.disconnect();
        resolve(el);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

// Load font asynchronously
export function loadFont(fontFamily, fontUrl) {
  return new Promise((resolve, reject) => {
    const font = new FontFace(fontFamily, `url(${fontUrl}) format('woff2')`);
    
    font.load().then(() => {
      document.fonts.add(font);
      resolve();
    }).catch(reject);
  });
}

// Format duration (seconds to HH:MM:SS)
export function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Generate unique ID
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Parse JSON safely
export function safeParseJSON(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return defaultValue;
  }
}

// Check if value is valid URL
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

// Get file extension from URL
export function getFileExtension(url) {
  const parts = url.split('?')[0].split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

// Download file from URL
export async function downloadFile(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
    
    return true;
  } catch (err) {
    console.error('Download failed:', err);
    return false;
  }
}

// Check if user is idle (no interaction for X seconds)
export function isUserIdle(timeout = 30000) {
  let lastActivity = Date.now();
  
  const updateActivity = () => {
    lastActivity = Date.now();
  };
  
  ['click', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, updateActivity, { passive: true });
  });
  
  return (Date.now() - lastActivity) > timeout;
}

// Get scroll position
export function getScrollPosition() {
  return {
    x: window.pageXOffset || document.documentElement.scrollLeft,
    y: window.pageYOffset || document.documentElement.scrollTop
  };
}

// Check if element has class
export function hasClass(element, className) {
  if (!element || !className) return false;
  return element.classList.contains(className);
}

// Add class to element
export function addClass(element, className) {
  if (element && className) {
    element.classList.add(className);
  }
}

// Remove class from element
export function removeClass(element, className) {
  if (element && className) {
    element.classList.remove(className);
  }
}

// Toggle class on element
export function toggleClass(element, className, force) {
  if (element && className) {
    element.classList.toggle(className, force);
  }
}