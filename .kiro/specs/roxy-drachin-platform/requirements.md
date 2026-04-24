# Requirements Document: roxy-drachin C-Drama Streaming Platform

## Introduction

roxy-drachin is a static website for streaming Chinese dramas built with HTML5, CSS3, and Vanilla JavaScript (ES6+). The platform integrates with the Sanka Vollerei API to provide content including drama listings, episode streaming, search functionality, and user engagement features. The implementation follows a modular architecture with clear separation of concerns across components, API integration, utilities, and page-specific logic.

## Glossary

- **roxy-drachin**: The C-Drama streaming platform application
- **Sanka Vollerei API**: The external API providing drama content, episodes, and metadata
- **Drama**: A Chinese drama series with title, poster, rating, episodes, and genres
- **Episode**: An individual episode within a drama series
- **API Cache**: In-memory storage for API responses with TTL-based expiration
- **Hero Slider**: The main carousel displaying featured dramas on the home page
- **Skeleton Loading**: Placeholder UI elements shown while content is loading
- **Toast Notification**: A temporary message overlay for user feedback

## Functional Requirements

### Requirement 1: API Integration

**User Story:** As a user, I want to browse and stream Chinese dramas, so that I can watch content from a centralized platform.

#### Acceptance Criteria

1. WHEN a request is made to fetch home page data, THE DrachinAPI SHALL retrieve slider, latest, popular, and recommendations data from the Sanka Vollerei API
2. WHEN a request is made to fetch drama details, THE DrachinAPI SHALL retrieve drama information and episode list by slug
3. WHEN a request is made to search dramas, THE DrachinAPI SHALL return matching results with pagination support
4. WHEN a request is made to fetch popular dramas, THE DrachinAPI SHALL retrieve trending content with ranking information
5. IF an API request fails due to network error, THEN THE DrachinAPI SHALL throw an error with a descriptive message
6. IF an API request times out, THEN THE DrachinAPI SHALL throw a timeout error
7. IF an API returns an invalid response, THEN THE DrachinAPI SHALL throw an error indicating the response structure is invalid

### Requirement 2: Caching

**User Story:** As a user, I want fast page loads, so that I don't have to wait for data to load on repeat visits.

#### Acceptance Criteria

1. WHEN an API request is made and data exists in cache with valid TTL, THEN THE DrachinAPI SHALL return cached data without making a network request
2. WHEN an API request is made and data does not exist in cache or TTL has expired, THEN THE DrachinAPI SHALL make a network request and cache the response
3. WHEN the cache TTL is set to 5 minutes, THEN THE DrachinAPI SHALL respect this TTL for all cached responses
4. WHEN cache is cleared, THEN THE DrachinAPI SHALL remove all cached entries
5. WHEN cache statistics are requested, THEN THE DrachinAPI SHALL return current cache size and hit/miss counts

### Requirement 3: Rate Limiting

**User Story:** As a developer, I want to prevent API abuse, so that the service remains stable and available.

#### Acceptance Criteria

1. WHILE the application is making API requests, THEN THE DrachinAPI SHALL enforce a limit of 50 requests per 60-second window
2. IF the rate limit is exceeded, THEN THE DrachinAPI SHALL throw an error with the message "Terlalu banyak permintaan. Silakan tunggu sebentar."
3. WHEN the rate limit window resets, THEN THE DrachinAPI SHALL allow new requests to proceed

### Requirement 4: UI Components

**User Story:** As a user, I want to see consistent and responsive UI elements, so that I can navigate the platform easily.

#### Acceptance Criteria

1. WHEN a drama card is rendered, THEN THE Components Module SHALL display the drama title, poster, rating, genres, year, and status
2. WHEN a drama card is rendered with rank option enabled, THEN THE Components Module SHALL display a rank badge
3. WHEN a drama card is rendered with badge option enabled, THEN THE Components Module SHALL display a custom badge
4. WHEN a skeleton card is rendered, THEN THE Components Module SHALL display a placeholder with appropriate loading animation
5. WHEN an error state is rendered, THEN THE Components Module SHALL display an error message with a retry button
6. WHEN an empty state is rendered, THEN THE Components Module SHALL display a title, subtitle, and optional action button
7. WHEN the navigation bar is rendered, THEN THE Components Module SHALL highlight the active page
8. WHEN a hero slider is rendered, THEN THE Components Module SHALL display slides with autoplay and navigation controls
9. WHEN a toast notification is shown, THEN THE Components Module SHALL display a temporary message with appropriate styling

### Requirement 5: Hero Slider

**User Story:** As a user, I want to see featured dramas in a carousel, so that I can easily discover new content.

#### Acceptance Criteria

1. WHEN the hero slider is initialized, THEN THE Components Module SHALL start auto-play with configurable interval (default 5000ms)
2. WHEN the user clicks the previous button, THEN THE Components Module SHALL navigate to the previous slide
3. WHEN the user clicks the next button, THEN THE Components Module SHALL navigate to the next slide
4. WHEN the user clicks a dot indicator, THEN THE Components Module SHALL navigate to the corresponding slide
5. WHEN the user hovers over the slider, THEN THE Components Module SHALL pause auto-play
6. WHEN the user stops hovering over the slider, THEN THE Components Module SHALL resume auto-play
7. WHEN a swipe gesture is detected on mobile, THEN THE Components Module SHALL navigate to the previous or next slide based on swipe direction
8. WHILE the slider is active, THEN THE Components Module SHALL maintain synchronization between active slides and active dots

### Requirement 6: Search Functionality

**User Story:** As a user, I want to search for dramas, so that I can find specific content quickly.

#### Acceptance Criteria

1. WHEN a user types in the search input, THEN THE Components Module SHALL trigger a debounced search with 500ms delay
2. WHEN search results are returned, THEN THE Components Module SHALL display the matching dramas with pagination
3. WHEN no search results are found, THEN THE Components Module SHALL display an empty state with suggestions
4. WHEN the search query is less than 2 characters, THEN THE Components Module SHALL not trigger a search request
5. IF a search request fails, THEN THE Components Module SHALL display an error state

### Requirement 7: Page Navigation

**User Story:** As a user, I want to navigate between different pages, so that I can access all platform features.

#### Acceptance Criteria

1. WHEN a user navigates to the home page, THEN THE Home Page Module SHALL load and display slider, latest, popular, and recommendations sections
2. WHEN a user navigates to the browse page, THEN THE Browse Page Module SHALL load and display latest or popular dramas based on filter
3. WHEN a user navigates to the detail page, THEN THE Detail Page Module SHALL load and display drama information and episode list
4. WHEN a user navigates to the watch page, THEN THE Watch Page Module SHALL load and play the selected episode
5. WHEN a user navigates to the search page, THEN THE Search Page Module SHALL load and display search results
6. WHEN a user navigates to the popular page, THEN THE Popular Page Module SHALL load and display trending dramas with ranking

### Requirement 8: Episode Management

**User Story:** As a user, I want to watch episodes and navigate between them, so that I can continue watching a drama series.

#### Acceptance Criteria

1. WHEN an episode list is displayed, THEN THE Components Module SHALL show all episodes with their titles and indices
2. WHEN an episode is selected, THEN THE Watch Page Module SHALL load and play the selected episode
3. WHEN the current episode completes, THEN THE Watch Page Module SHALL enable navigation to the next episode
4. WHEN navigating to the previous episode, THEN THE Watch Page Module SHALL load and play the previous episode
5. WHEN navigating to the next episode, THEN THE Watch Page Module SHALL load and play the next episode

### Requirement 9: Error Handling

**User Story:** As a user, I want to see helpful error messages, so that I know what went wrong and how to fix it.

#### Acceptance Criteria

1. IF a network error occurs, THEN THE Components Module SHALL display a toast notification with the message "Koneksi internet bermasalah. Silakan coba lagi."
2. IF a rate limit is exceeded, THEN THE Components Module SHALL display a toast notification with the message "Terlalu banyak permintaan. Silakan tunggu sebentar."
3. IF an API response is invalid, THEN THE Components Module SHALL display a toast notification with the message "Respons server tidak valid."
4. IF an image fails to load, THEN THE Components Module SHALL replace the image with a fallback SVG placeholder
5. IF a video stream is unavailable, THEN THE Components Module SHALL display an error state with the message "Video tidak dapat diputar. Coba episode lain."

### Requirement 10: Image Handling

**User Story:** As a user, I want to see drama posters and images, so that I can browse content visually.

#### Acceptance Criteria

1. WHEN an image is rendered, THEN THE Components Module SHALL include an onerror handler for fallback
2. IF an image fails to load, THEN THE Components Module SHALL replace the image source with a fallback SVG placeholder
3. WHEN images are rendered in lists, THEN THE Components Module SHALL use lazy loading for performance

## Non-Functional Requirements

### Requirement 11: Performance

**User Story:** As a user, I want fast page loads and smooth interactions, so that I have a good experience using the platform.

#### Acceptance Criteria

1. WHEN the home page loads on a 3G connection, THEN the initial page load time SHALL be less than 2 seconds
2. WHEN the home page loads, THEN the time to interactive SHALL be less than 3 seconds
3. WHEN an API request is made, THEN the response time SHALL be less than 1 second (excluding network latency)
4. WHEN the hero slider image loads, THEN the image loading time SHALL be less than 500ms
5. WHEN a user types in the search input, THEN the search request SHALL be delayed by 500ms (debounce)

### Requirement 12: Accessibility

**User Story:** As a user with disabilities, I want the platform to be accessible, so that I can use all features.

#### Acceptance Criteria

1. WHEN the platform is navigated using a keyboard, THEN all interactive elements SHALL be reachable and usable
2. WHEN screen readers are used, THEN all images SHALL have appropriate alt text
3. WHEN color contrast is checked, THEN all text SHALL meet WCAG AA contrast requirements
4. WHEN focus management is tested, THEN focus SHALL be properly managed during page transitions

### Requirement 13: Security

**User Story:** As a user, I want my data to be secure, so that I can trust the platform with my information.

#### Acceptance Criteria

1. WHEN user input is rendered, THEN THE Components Module SHALL escape HTML to prevent XSS attacks
2. WHEN API responses are processed, THEN THE Components Module SHALL sanitize data before rendering
3. WHEN user preferences are stored, THEN THE Components Module SHALL only store non-sensitive data in localStorage
4. WHEN API requests are made, THEN THE DrachinAPI SHALL use HTTPS for all requests

### Requirement 14: Browser Compatibility

**User Story:** As a user, I want the platform to work in my browser, so that I can access content on my preferred device.

#### Acceptance Criteria

1. WHEN the platform is loaded in Chrome, THEN all features SHALL work correctly
2. WHEN the platform is loaded in Firefox, THEN all features SHALL work correctly
3. WHEN the platform is loaded in Safari, THEN all features SHALL work correctly
4. WHEN the platform is loaded in Edge, THEN all features SHALL work correctly
5. WHEN the platform is loaded on iOS Safari, THEN all features SHALL work correctly
6. WHEN the platform is loaded on Chrome Mobile, THEN all features SHALL work correctly

## Correctness Properties

### Property 1: Cache Consistency

*For any* API endpoint and any time within the cache TTL period, if data is present in the cache, the fetchAPI function SHALL return the cached data without making a network request.

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 2: Rate Limit Enforcement

*For any* sequence of API requests, the DrachinAPI SHALL ensure that no more than 50 requests are made within any 60-second window.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Image Fallback

*For any* image element that fails to load, the Components Module SHALL replace the image source with a fallback SVG placeholder.

**Validates: Requirements 10.1, 10.2**

### Property 4: Slider State Synchronization

*For any* slide index in the hero slider, the active slide element and active dot indicator SHALL always be synchronized.

**Validates: Requirements 5.8**

### Property 5: Search Debounce

*For any* sequence of search input events, the Components Module SHALL delay search requests by 500ms and only execute the last request in the sequence.

**Validates: Requirements 6.1, 6.4**

### Property 6: Error Handling Consistency

*For any* error scenario (network failure, rate limit, invalid response, image load failure, video unplayable), the Components Module SHALL display an appropriate error message to the user.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

### Property 7: Input Sanitization

*For any* user input or API response that is rendered to the DOM, the Components Module SHALL escape HTML characters to prevent XSS attacks.

**Validates: Requirements 13.1, 13.2**

### Property 8: Page Navigation Consistency

*For any* page navigation event, the corresponding page module SHALL load and initialize correctly, displaying the expected content.

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

### Property 9: Episode Navigation

*For any* episode in a drama's episode list, the Watch Page Module SHALL be able to load and play that episode, and navigation to adjacent episodes SHALL work correctly.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 10: Performance Thresholds

*For any* page load on a 3G connection, the initial page load time SHALL be less than 2 seconds and the time to interactive SHALL be less than 3 seconds.

**Validates: Requirements 11.1, 11.2**
