# Project Overview: P2P Gear Rental

This project is a peer-to-peer gear rental marketplace application.

## Technology Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes, TypeScript, Prisma
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Authentication:** Supabase (inferred from `__mocks__/@supabase/supabase-js.ts` and `src/components/auth/AuthProvider.tsx`)
*   **Testing:** Jest
*   **Linting:** ESLint

## Application Structure

*   **`/src/app`**: Contains Next.js pages and API routes.
    *   `page.tsx`: Main landing page displaying gear and search filters.
    *   `add-gear/page.tsx`: Page for adding new gear.
    *   `api/gear/route.ts`: API endpoint for fetching and adding gear (GET, POST).
    *   `api/gear/[id]/route.ts`: API endpoint for fetching individual gear items (GET).
    *   `auth/login/page.tsx`: Login page.
    *   `auth/signup/page.tsx`: Signup page.
    *   `gear/[id]/page.tsx`: Page for displaying details of a specific gear item.
*   **`/src/components`**: Reusable React components.
    *   `Header.tsx`, `Footer.tsx`: Layout components.
    *   `auth/AuthProvider.tsx`: Context provider for authentication.
    *   `gear/GearCard.tsx`: Component to display individual gear item.
    *   `gear/GearGrid.tsx`: Component to display a grid of gear items.
    *   `gear/SearchFilters.tsx`: Component for search and filter functionality.
*   **`/src/lib`**: Utility functions and configurations.
    *   `prisma.ts`: Prisma client instance.
    *   `supabase.ts`: Supabase client instance.
*   **`/src/types`**: TypeScript type definitions.
*   **`/prisma`**: Prisma schema and migrations.
    *   `schema.prisma`: Defines the database schema (currently contains `Gear` model).

## Key Features

*   **Gear Listing:** Display a grid of available gear items.
*   **Search and Filtering:** Search gear by keywords, category, price range, city, and state.
*   **Gear Details:** View detailed information about individual gear items.
*   **Add Gear:** Users can add new gear items for rent.
*   **Authentication:** User login and signup (likely handled by Supabase).

## Database Schema (Prisma)

### `Gear` Model

*   `id`: String (Unique identifier, CUID)
*   `title`: String
*   `description`: String
*   `dailyRate`: Float
*   `weeklyRate`: Float (Optional)
*   `monthlyRate`: Float (Optional)
*   `images`: String[] (Array of image URLs)
*   `city`: String
*   `state`: String
*   `brand`: String (Optional)
*   `model`: String (Optional)
*   `condition`: String (Optional)
*   `createdAt`: DateTime (Default to current time)
*   `updatedAt`: DateTime (Automatically updated on changes)

## API Endpoints

*   **`GET /api/gear`**: Fetches a list of gear items. Supports query parameters for searching and filtering (`search`, `category`, `minPrice`, `maxPrice`, `city`, `state`).
*   **`POST /api/gear`**: Adds a new gear item. Requires `title`, `description`, `dailyRate`, `city`, `state`, and `images` in the request body.
*   **`GET /api/gear/[id]`**: Fetches a single gear item by its `id`.

## Strategic Roadmap: P2P Gear Rental - 1 Month Launch Plan

**Overall Goal:** Launch a stable, user-friendly P2P gear rental platform with core functionality and a polished user experience within one month.

### Week 1: Core Functionality & Stability

**Focus:** Solidify existing features, implement essential missing pieces, and establish a robust testing foundation.

*   **User Authentication & Profiles (Critical):**
    *   **Improvement:** Implement full user registration, login, and logout flows using Supabase.
    *   **Improvement:** Create basic user profiles where users can view their listed gear and rental history (even if history is just placeholders for now).
    *   **Improvement:** Secure API routes to ensure only authenticated users can add/edit gear.
*   **Gear Management (Refinement):**
    *   **Improvement:** Add "Edit Gear" and "Delete Gear" functionality for listed items.
    *   **Improvement:** Implement image upload for gear items (e.g., using Supabase Storage or a third-party service like Cloudinary). The current schema has `images: String[]`, but there's no upload mechanism.
*   **Search & Filtering (Refinement):**
    *   **Improvement:** Enhance search relevance (e.g., fuzzy matching, prioritizing exact matches).
    *   **Improvement:** Add more filter options (e.g., availability dates, gear type/category dropdowns).
*   **Error Handling & User Feedback:**
    *   **Improvement:** Implement user-friendly error messages for all API calls and form submissions.
    *   **Improvement:** Add loading states and success notifications (e.g., using a toast library).
*   **Testing:**
    *   **Improvement:** Expand Jest tests to cover all critical API routes and core UI components. Aim for high test coverage for core flows.

### Week 2: Rental Workflow & Basic Communication

**Focus:** Implement the core rental process and enable basic communication between users.

*   **Rental Request/Booking System (Critical):**
    *   **Improvement:** Implement a "Request to Rent" or "Book Now" button on gear detail pages.
    *   **Improvement:** Create a simple booking flow:
        *   User selects dates (using a date picker component).
        *   Request is sent to the gear owner.
        *   **Improvement:** Implement a basic "My Rentals" page for renters to see their requests/bookings.
        *   **Improvement:** Implement a basic "My Listings" page for owners to see incoming rental requests.
*   **Basic Messaging (Critical for P2P):**
    *   **Improvement:** Implement a simple in-app messaging system (e.g., using Supabase Realtime or a basic database table) for renters and owners to communicate about rental requests. This is crucial for coordination.
*   **Notifications (Basic):**
    *   **Improvement:** Implement basic in-app notifications for new rental requests or messages.

### Week 3: User Experience (UX), UI Polish & Analytics

**Focus:** Enhance the visual design, usability, and prepare for tracking user behavior.

*   **UI/UX Overhaul:**
    *   **Improvement:** Refine Tailwind CSS styling for a modern, clean, and consistent look across all pages. Focus on responsiveness.
    *   **Improvement:** Improve navigation (e.g., clear header links, user dropdown for profile/settings).
    *   **Improvement:** Design empty states for lists (e.g., "No gear found," "No rental requests").
    *   **Improvement:** Implement pagination or infinite scrolling for gear listings if the number of items grows.
*   **Landing Page Enhancement:**
    *   **Improvement:** Create a more engaging landing page with clear value propositions, call-to-actions, and perhaps some featured gear.
*   **Analytics Integration:**
    *   **Improvement:** Integrate a simple analytics tool (e.g., Google Analytics, Vercel Analytics if deployed on Vercel) to track page views, user sign-ups, and key interactions.

### Week 4: Deployment, Performance & Pre-Launch Checklist

**Focus:** Prepare for production, optimize performance, and complete all pre-launch tasks.

*   **Deployment:**
    *   **Improvement:** Deploy the application to a production-ready hosting environment (e.g., Vercel for Next.js, with a separate PostgreSQL database like Supabase or Neon).
    *   **Improvement:** Set up environment variables securely.
*   **Performance Optimization:**
    *   **Improvement:** Optimize image loading (e.g., Next.js Image component, image compression).
    *   **Improvement:** Implement server-side rendering (SSR) or static site generation (SSG) where appropriate for better performance and SEO.
    *   **Improvement:** Minify CSS/JS.
*   **Security Audit (Basic):**
    *   **Improvement:** Review for common web vulnerabilities (e.g., XSS, CSRF). Ensure proper input validation.
*   **Legal & Compliance (Critical for Launch):**
    *   **Improvement:** Draft and add basic Terms of Service and Privacy Policy pages.
    *   **Improvement:** Consider local regulations for P2P rentals.
*   **Monitoring & Logging:**
    *   **Improvement:** Set up basic application monitoring and error logging in production.
*   **Final Testing:**
    *   **Improvement:** Conduct end-to-end testing of all critical user flows.
    *   **Improvement:** Test on various devices and browsers.
*   **Marketing Assets (Basic):
    *   **Improvement:** Prepare a simple "Coming Soon" or "Launch" announcement.

---

### How to Make it *Much* Better (Beyond the 1-Month Launch)

*   **Payment Integration:** This is a huge missing piece for a true rental platform. Integrate a payment gateway (Stripe, PayPal) for secure transactions. This is a complex feature and should be a high priority *after* launch.
*   **Rating & Reviews System:** Allow users to rate and review gear and other users. Builds trust and helps future renters/owners.
*   **Advanced Search & Filters:** More granular filters, map view for location-based search.
*   **User Dashboards:** Comprehensive dashboards for renters (upcoming rentals, past rentals) and owners (listings, earnings, rental requests).
*   **Dispute Resolution System:** A mechanism to handle disagreements between renters and owners.
*   **Insurance/Guarantees:** Explore options for protecting gear and users.
*   **SEO Optimization:** More advanced SEO strategies for discoverability.
*   **Push Notifications/Email Notifications:** For critical updates (new messages, rental status changes).
*   **Admin Panel:** For managing users, listings, and disputes.
*   **Mobile App:** Consider a native mobile application for a better user experience.