# Project Overview: P2P Gear Rental

This project is a peer-to-peer gear rental marketplace application.

## Technology Stack

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS
*   **Backend:** Next.js API Routes, TypeScript, Prisma
*   **Database:** PostgreSQL (via Prisma ORM)
*   **Authentication:** Supabase
*   **Payments:** Stripe
*   **Testing:** Jest
*   **Linting:** ESLint

## Application Structure

*   **`/src/app`**: Contains Next.js pages and API routes.
    *   `page.tsx`: Main landing page displaying gear and search filters.
    *   `add-gear/page.tsx`: Page for adding new gear.
    *   `edit-gear/[id]/page.tsx`: Page for editing existing gear.
    *   `gear/[id]/page.tsx`: Page for displaying details of a specific gear item.
    *   `my-rentals/page.tsx`: Page for users to view their rental history.
    *   `profile/page.tsx`: User profile page.
    *   `rentals/page.tsx`: Page for managing rental requests.
    *   `dashboard/page.tsx`: User dashboard.
    *   `auth/login/page.tsx`: Login page.
    *   `auth/signup/page.tsx`: Signup page.
    *   `privacy-policy/page.tsx`: Privacy policy page.
    *   `terms-of-service/page.tsx`: Terms of service page.
    *   `api/gear/route.ts`: API endpoint for fetching and adding gear (GET, POST).
    *   `api/gear/[id]/route.ts`: API endpoint for fetching, updating, and deleting individual gear items (GET, PUT, DELETE).
    *   `api/rentals/route.ts`: API endpoint for managing rentals (GET, POST).
    *   `api/reviews/route.ts`: API endpoint for managing reviews (GET, POST).
    *   `api/create-payment-intent/route.ts`: API endpoint for creating Stripe payment intents.
    *   `api/stripe-webhook/route.ts`: API endpoint for handling Stripe webhooks.
    *   `api/dashboard/route.ts`: API endpoint for fetching dashboard data.
*   **`/src/components`**: Reusable React components.
    *   `Header.tsx`, `Footer.tsx`: Layout components.
    *   `auth/AuthProvider.tsx`: Context provider for authentication.
    *   `gear/GearCard.tsx`: Component to display individual gear item.
    *   `gear/GearGrid.tsx`: Component to display a grid of gear items.
    *   `gear/SearchFilters.tsx`: Component for search and filter functionality.
    *   `payments/PaymentForm.tsx`: Component for handling Stripe payments.
    *   `dashboard/Dashboard.tsx`: Component for the user dashboard.
    *   `ui/`: Directory for general UI components (buttons, inputs, etc.).
*   **`/src/lib`**: Utility functions and configurations.
    *   `prisma.ts`: Prisma client instance.
    *   `supabase.ts`: Supabase client instance.
    *   `stripe.ts`: Stripe client instance.
*   **`/src/types`**: TypeScript type definitions.
*   **`/prisma`**: Prisma schema and migrations.
    *   `schema.prisma`: Defines the database schema.

## Key Features

*   **Gear Listing:** Display a grid of available gear items.
*   **Search and Filtering:** Search gear by keywords, category, price range, city, and state.
*   **Gear Details:** View detailed information about individual gear items.
*   **Add, Edit, and Delete Gear:** Users can manage their gear listings.
*   **User Authentication & Profiles:** User signup, login, and basic profiles.
*   **Rental Workflow:** Users can request to rent gear, and owners can approve or deny requests.
*   **User Reviews and Ratings:** Users can leave reviews and ratings for gear and other users.
*   **Stripe Payment Integration:** Securely process payments for rentals.

## Database Schema (Prisma)

### `User` Model

*   `id`: String (Unique identifier)
*   `email`: String (Unique)
*   `full_name`: String (Optional)
*   `gears`: `Gear[]`
*   `rentedItems`: `Rental[]`
*   `ownedRentals`: `Rental[]`
*   `reviewsGiven`: `Review[]`
*   `reviewsReceived`: `Review[]`
*   `averageRating`: Float (Optional)
*   `totalReviews`: Int (Default: 0)

### `Gear` Model

*   `id`: String (Unique identifier, CUID)
*   `title`: String
*   `description`: String
*   `dailyRate`: Float
*   `weeklyRate`: Float (Optional)
*   `monthlyRate`: Float (Optional)
*   `images`: String[]
*   `city`: String
*   `state`: String
*   `category`: String (Optional)
*   `brand`: String (Optional)
*   `model`: String (Optional)
*   `condition`: String (Optional)
*   `userId`: String (Optional)
*   `user`: `User?`
*   `rentals`: `Rental[]`

### `Rental` Model

*   `id`: String (Unique identifier, CUID)
*   `gear`: `Gear`
*   `renter`: `User`
*   `owner`: `User`
*   `startDate`: DateTime
*   `endDate`: DateTime
*   `status`: String (e.g., "pending", "approved", "rejected", "completed")
*   `message`: String (Optional)
*   `paymentIntentId`: String (Optional)
*   `clientSecret`: String (Optional)
*   `paymentStatus`: String (Optional)
*   `review`: `Review?`

### `Review` Model

*   `id`: String (Unique identifier, CUID)
*   `rating`: Int (1-5)
*   `comment`: String (Optional)
*   `rental`: `Rental`
*   `reviewer`: `User`
*   `reviewee`: `User`

## API Endpoints

*   **`GET /api/gear`**: Fetches a list of gear items with optional filters.
*   **`POST /api/gear`**: Adds a new gear item.
*   `GET, PUT, DELETE /api/gear/[id]`: Fetches, updates, or deletes a single gear item.
*   **`GET, POST /api/rentals`**: Manages rentals.
*   **`GET, POST /api/reviews`**: Manages reviews.
*   **`POST /api/create-payment-intent`**: Creates a Stripe payment intent.
*   **`POST /api/stripe-webhook`**: Handles Stripe webhooks.
*   **`GET /api/dashboard`**: Fetches dashboard data.

## Strategic Roadmap: P2P Gear Rental

**Overall Goal:** Launch a stable, user-friendly P2P gear rental platform with core functionality and a polished user experience.

### Core Functionality (Largely Complete)

*   **User Authentication & Profiles:** (Done) Full user registration, login, logout, and basic profiles.
*   **Gear Management:** (Done) Add, Edit, and Delete functionality for gear listings.
*   **Image Uploads:** (Done) Implemented image uploads for gear items.
*   **Rental Request/Booking System:** (Done) A complete booking flow is in place.
*   **Basic Messaging:** (Done) In-app messaging for renters and owners.
*   **Rating & Reviews System:** (Done) Users can rate and review gear and other users.
*   **Payment Integration:** (Done) Stripe is integrated for payments.

### Next Steps & Future Improvements

*   **Search & Filtering (Refinement):**
    *   **Improvement:** Enhance search relevance (e.g., fuzzy matching, prioritizing exact matches).
    *   **Improvement:** Add more filter options (e.g., availability dates, gear type/category dropdowns).
*   **Error Handling & User Feedback:**
    *   **Improvement:** Implement more user-friendly error messages for all API calls and form submissions.
    *   **Improvement:** Add loading states and success notifications (e.g., using a toast library).
*   **Testing:**
    *   **Improvement:** Expand Jest and Playwright tests to cover all critical API routes and UI components. Aim for high test coverage for core flows.
*   **UI/UX Polish:**
    *   **Improvement:** Refine Tailwind CSS styling for a modern, clean, and consistent look across all pages. Focus on responsiveness.
    *   **Improvement:** Improve navigation (e.g., clear header links, user dropdown for profile/settings).
    *   **Improvement:** Design empty states for lists (e.g., "No gear found," "No rental requests").
    *   **Improvement:** Implement pagination or infinite scrolling for gear listings.
*   **Deployment & Performance:**
    *   **Improvement:** Deploy the application to a production-ready hosting environment.
    *   **Improvement:** Optimize image loading and implement server-side rendering (SSR) or static site generation (SSG) where appropriate.
*   **Advanced Features (Future):**
    *   **Advanced Search & Filters:** Map view for location-based search.
    *   **User Dashboards:** More comprehensive dashboards for renters and owners.
    *   **Dispute Resolution System:** A mechanism to handle disagreements.
    *   **Insurance/Guarantees:** Explore options for protecting gear and users.
    *   **Push Notifications/Email Notifications:** For critical updates.
    *   **Admin Panel:** For managing users, listings, and disputes.

---

## Local Setup and Deployment Roadmap

This roadmap is structured in four phases:
1.  **Local Development Setup:** Installing dependencies and configuring the environment.
2.  **Verification:** Running the app and executing tests to ensure the setup is correct.
3.  **Understanding & Contribution:** Guidance on where to start with development based on the project's existing roadmap.
4.  **Deployment:** Preparing the application for a production environment.

### **Phase 1: Local Development Setup**

This phase will get the application running on your local machine.

1.  **Prerequisites:**
    *   Ensure you have **Node.js** (v18 or later) and **Docker** installed on your system.

2.  **Install Dependencies:**
    *   Open your terminal in the project root and run `npm install` to install all the necessary packages from `package.json`.

3.  **Environment Configuration:**
    *   The application requires API keys and service URLs for its database, authentication (Supabase), and payments (Stripe).
    *   Create a new file in the root directory named `.env.local`.
    *   Copy the following template into your `.env.local` file and populate it with your actual credentials. You will need to create accounts with Supabase and Stripe to get these keys.

    ```bash
    # Prisma/PostgreSQL
    DATABASE_URL="postgresql://user:password@localhost:5432/p2p_gear_rental"

    # Supabase
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_PROJECT_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

    # Stripe
    STRIPE_SECRET_KEY="YOUR_STRIPE_SECRET_KEY"
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="YOUR_STRIPE_PUBLISHABLE_KEY"
    STRIPE_WEBHOOK_SECRET="YOUR_STRIPE_WEBHOOK_SECRET"
    ```

4.  **Start Services & Database:**
    *   The project uses Docker to manage the PostgreSQL database.
    *   Run the following command to start the database container in the background:
        ```shell
        docker-compose up -d
        ```

5.  **Apply Database Schema and Seed Data:**
    *   With the database running, apply the schema migrations using Prisma:
        ```shell
        npx prisma migrate dev
        ```
    *   (Optional but Recommended) Populate the database with initial sample data using the seed script:
        ```shell
        npx prisma db seed
        ```

### **Phase 2: Verification**

Now, let's verify that the application is running correctly.

1.  **Run the Application:**
    *   Start the Next.js development server:
        ```shell
        npm run dev
        ```
    *   Open your web browser and navigate to `http://localhost:3000`. You should see the application's home page.

2.  **Run Tests:**
    *   To ensure all core functionality is working as expected, run the project's tests.
    *   **Unit & Integration Tests (Jest):**
        ```shell
        npm test
        ```
    *   **End-to-End Tests (Playwright):**
        ```shell
        npm run test:e2e
        ```

### **Phase 3: Understanding & Contribution**

The application's core functionality is largely complete. The `GEMINI.md` file outlines the next steps, which you can now begin working on.

*   **Review the Codebase:** Familiarize yourself with the code in the `src/` directory, especially the `app/` and `components/` folders.
*   **Tackle Next Steps:** Based on the "Next Steps & Future Improvements" section of the project documentation, here are excellent areas to contribute:
    *   **Search & Filtering:** Enhance the search functionality in `src/components/gear/SearchFilters.tsx` and the backing API at `src/app/api/gear/route.ts`.
    *   **Error Handling:** Implement more robust error handling and user feedback (e.g., toast notifications) for form submissions and API calls.
    *   **UI/UX Polish:** Refine the Tailwind CSS styling to improve responsiveness and visual appeal. Focus on creating a consistent design system in `src/components/ui/`.
    *   **Testing:** Increase test coverage by adding more Jest tests for components and API routes, and more Playwright tests for user flows.

### **Phase 4: Deployment**

Once you are ready to move to a production environment, follow these steps.

1.  **Build the Application:**
    *   Create an optimized production build of the Next.js application:
        ```shell
        npm run build
        ```
2.  **Deployment Strategy:**
    *   **Vercel (Recommended for Next.js):** Deploy the project directly from your Git repository to Vercel for a seamless experience.
    *   **Docker:** Use the provided `Dockerfile` and `docker-compose.yml` to build and deploy a containerized version of the application to any cloud provider (e.g., AWS, Google Cloud, Azure).