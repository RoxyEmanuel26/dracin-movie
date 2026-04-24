/**
 * Property-Based Test: Search Debounce
 * Validates Requirements 6.1, 6.4
 * 
 * Property: For any sequence of search input events, the Components Module
 * delays search requests by 500ms and only executes the last request in the sequence.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { debounce } from '../js/utils.js';

describe('Property 5: Search Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should delay function execution by specified delay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 2000 }),
        fc.integer({ min: 1, max: 10 }),
        (delay, numCalls) => {
          const mockFn = vi.fn();
          const debouncedFn = debounce(mockFn, delay);
          
          // Make multiple rapid calls
          for (let i = 0; i < numCalls; i++) {
            debouncedFn(`call-${i}`);
          }
          
          // Function should not be called yet (still within delay)
          expect(mockFn).toHaveBeenCalledTimes(0);
          
          // Advance time by delay
          vi.advanceTimersByTime(delay);
          
          // Now function should be called exactly once
          expect(mockFn).toHaveBeenCalledTimes(1);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should only execute last request in a burst', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 20 }),
        fc.integer({ min: 100, max: 1000 }),
        (queries, delay) => {
          const mockFn = vi.fn();
          const debouncedFn = debounce(mockFn, delay);
          
          // Simulate rapid input events
          queries.forEach(query => {
            debouncedFn(query);
          });
          
          // No calls yet
          expect(mockFn).toHaveBeenCalledTimes(0);
          
          // Advance time past delay
          vi.advanceTimersByTime(delay);
          
          // Should have called exactly once with the last query
          expect(mockFn).toHaveBeenCalledTimes(1);
          expect(mockFn).toHaveBeenCalledWith(queries[queries.length - 1]);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should reset timer on subsequent calls within delay', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        fc.integer({ min: 200, max: 1000 }),
        fc.integer({ min: 10, max: 50 }),
        (numCalls, baseDelay, increment) => {
          const mockFn = vi.fn();
          const debouncedFn = debounce(mockFn, baseDelay);
          
          // Make calls with small increments between them
          for (let i = 0; i < numCalls; i++) {
            debouncedFn(`call-${i}`);
            vi.advanceTimersByTime(increment);
          }
          
          // Function should not be called during the sequence
          expect(mockFn).toHaveBeenCalledTimes(0);
          
          // Advance time by the full delay
          vi.advanceTimersByTime(baseDelay);
          
          // Should have called exactly once
          expect(mockFn).toHaveBeenCalledTimes(1);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  it('should handle search with 500ms delay (as per requirements)', () => {
    const mockFn = vi.fn();
    const searchDelay = 500;
    const debouncedSearch = debounce(mockFn, searchDelay);
    
    // Simulate user typing characters rapidly
    const characters = ['a', 'ab', 'abc', 'abcd', 'abcde'];
    
    characters.forEach(char => {
      debouncedSearch(char);
    });
    
    // No calls yet
    expect(mockFn).toHaveBeenCalledTimes(0);
    
    // Advance time by 500ms
    vi.advanceTimersByTime(searchDelay);
    
    // Should have called once with last character
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('abcde');
    
    return true;
  });

  it('should handle rapid search queries correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 5, max: 20 }),
        (numQueries) => {
          const mockFn = vi.fn();
          const debouncedFn = debounce(mockFn, 500);
          
          // Simulate rapid search queries
          for (let i = 0; i < numQueries; i++) {
            debouncedFn(`query-${i}`);
            // Small delay between queries (less than debounce delay)
            vi.advanceTimersByTime(100);
          }
          
          // Should not have executed any searches yet
          expect(mockFn).toHaveBeenCalledTimes(0);
          
          // Advance time by full debounce delay
          vi.advanceTimersByTime(500);
          
          // Should have executed exactly once with the last query
          expect(mockFn).toHaveBeenCalledTimes(1);
          expect(mockFn).toHaveBeenCalledWith(`query-${numQueries - 1}`);
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
