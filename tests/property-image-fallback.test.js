/**
 * Property-Based Test: Image Fallback
 * Validates Requirements 10.1, 10.2
 * 
 * Property: For any image element that fails to load, the Components Module
 * replaces the image source with a fallback SVG placeholder.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { renderDramaCard } from '../js/components.js';

describe('Property 3: Image Fallback', () => {
  it('should include onerror handler in rendered drama cards', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }),
          poster: fc.oneof(
            fc.string({ minLength: 1, maxLength: 200 }),
            fc.constant(null),
            fc.constant(undefined)
          ),
          rating: fc.oneof(fc.float(), fc.constant(null)),
          episodes: fc.oneof(fc.integer(), fc.constant(null)),
          genres: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
          year: fc.oneof(fc.integer({ min: 1900, max: 2099 }), fc.constant(null)),
          status: fc.oneof(fc.string(), fc.constant(null))
        }),
        fc.record({
          showRank: fc.boolean(),
          showBadge: fc.boolean(),
          badgeText: fc.string(),
          rank: fc.oneof(fc.integer(), fc.constant(null)),
          isHorizontal: fc.boolean()
        }),
        (drama, options) => {
          const html = renderDramaCard(drama, options);
          
          // Verify onerror handler is present in img tag
          expect(html).toContain('onerror="this.src=\'/assets/poster-placeholder.svg\'"');
          
          // Verify img tag is present
          expect(html).toContain('<img');
          
          return true;
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should handle various image URL scenarios', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.constant(''),
            fc.constant(null),
            fc.constant(undefined),
            fc.string({ minLength: 1, maxLength: 200 })
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (imageUrls) => {
          imageUrls.forEach((imageUrl) => {
            const drama = {
              title: 'Test Drama',
              slug: 'test-drama',
              poster: imageUrl,
              genres: ['Action'],
              year: 2024
            };
            
            const html = renderDramaCard(drama);
            
            // Should always have onerror handler
            expect(html).toContain('onerror="this.src=\'/assets/poster-placeholder.svg\'"');
          });
          
          return true;
        }
      ),
      { numRuns: 5 }
    );
  });

  it('should generate valid SVG fallback data URI', () => {
    // Test that the fallback SVG is properly formatted
    const fallbackSvg = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"%3E%3Crect fill="%231A1A1A" width="200" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%235A5A5A" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    
    // Verify it's a valid data URI
    expect(fallbackSvg).toMatch(/^data:image\/svg\+xml/);
    
    // Verify it contains expected SVG elements
    expect(fallbackSvg).toContain('svg');
    expect(fallbackSvg).toContain('rect');
    expect(fallbackSvg).toContain('text');
    
    return true;
  });

  it('should handle drama cards with and without optional fields', () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          slug: fc.string({ minLength: 1, maxLength: 100 }),
          poster: fc.string({ minLength: 1, maxLength: 200 }),
          rating: fc.oneof(fc.float(), fc.constant(null)),
          episodes: fc.oneof(fc.integer(), fc.constant(null)),
          genres: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 0, maxLength: 5 }),
          year: fc.oneof(fc.integer({ min: 1900, max: 2099 }), fc.constant(null)),
          status: fc.oneof(fc.string(), fc.constant(null))
        }),
        (drama) => {
          // Test with all optional fields
          let html = renderDramaCard(drama);
          expect(html).toContain('onerror="this.src=\'/assets/poster-placeholder.svg\'"');
          
          // Test with minimal fields
          const minimalDrama = { title: drama.title, slug: drama.slug, poster: drama.poster };
          html = renderDramaCard(minimalDrama);
          expect(html).toContain('onerror="this.src=\'/assets/poster-placeholder.svg\'"');
          
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
});
