# Vibecode Ad Generator

**Turn your product details into high-impact static ads in seconds.**

Vibecode Ad Generator leverages AI (OpenAI) to analyze your product title, description, and image, generating compelling ad copy and visually enhanced images optimized for social media platforms. Built with Next.js, React, Supabase, and shadcn/ui.

---

## 🚦 Project Progress

**Overall Completion: ~15-20%**

-   **Core Functionality:** Basic ad generation (title + desc + image → copy + edited image) is implemented.
-   **Image Handling:** Image upload via dropzone, processing with Sharp, and storage in Supabase are functional.
-   **UI Foundation:** Using shadcn/ui components for the interface.
-   **Next Steps:** Focus on fixing the ad library display, implementing multi-copy/ratio/theme features, database integration, and authentication.

---

## ✨ Core Technologies

-   **Framework:** [Next.js](https://nextjs.org/) (with Turbopack for dev)
-   **Language:** TypeScript
-   **UI:** [React](https://react.dev/), [shadcn/ui](https://ui.shadcn.com/) (using Radix UI primitives), Tailwind CSS v4
-   **State Management:** React Hooks (potential for TanStack Query for server state)
-   **AI:** [OpenAI API](https://openai.com/api/) (O4 Mini high for copy, GPT Image 1 for image edits)
-   **Backend/DB:** [Supabase](https://supabase.com/) (Auth, Storage, potentially Database)
-   **Image Processing:** [Sharp](https://sharp.pixelplumbing.com/)
-   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
-   **Linting/Formatting:** ESLint (Next.js config)

---

## 🚀 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    cd vibecode-ad-generator
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install or pnpm install
    ```
3.  **Set up Environment Variables:**
    -   Create a `.env.local` file in the root directory.
    -   Add the following variables (get values from your service dashboards):
        ```env
        # OpenAI
        OPENAI_API_KEY=sk-...

        # Supabase
        NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
        NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
        # Add SUPABASE_SERVICE_ROLE_KEY if needed for backend operations

        # Sentry (Optional - based on package.json)
        # SENTRY_DSN=...
        # NEXT_PUBLIC_SENTRY_DSN=...
        ```
4.  **Set up Supabase:**
    -   Ensure you have a Supabase project created.
    -   Create a Storage bucket (e.g., `generated-ads`) and set appropriate public access policies (e.g., allow anonymous SELECT and authenticated INSERT).
    -   If moving data to DB, set up required tables (e.g., `products`, `ads`, `users`).
5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Features & TODOs

*(Based on current implementation and user goals)*

### Core Ad Generation (`/api/generate-ad`)
-   [x] **Input Processing:** Accepts title, description, image (Base64).
-   [x] **Ad Copy Generation:** Uses OpenAI GPT model.
-   [x] **Image Editing:** Uses OpenAI DALL-E image edit API.
-   [x] **Image Conversion:** Uses Sharp to ensure PNG format for OpenAI.
-   [x] **Storage:** Uploads final image to Supabase Storage.
-   [x] **URL Retrieval:** Gets public URL from Supabase.
-   [ ] **Error Handling:** Needs robust handling for API/upload failures.
-   [ ] **Multiple Generations:** Adapt API to handle requests for 4/8 ads.
-   [ ] **Aspect Ratio Control:** Pass ratio parameter to OpenAI/image processing.
-   [ ] **Theme Control:** Pass theme parameter to influence image edit prompt.
-   [ ] **Audience Targeting:** Integrate audience input into prompts.

### Frontend (`/src/components`)
-   **Ad Generator (`ad-generator.tsx`):**
    -   [x] Form using React Hook Form & Zod schema.
    -   [x] Image dropzone (`react-dropzone`).
    -   [x] API call to `/api/generate-ad`.
    -   [x] Saves results to `localStorage` (Temporary).
    -   [ ] **Loading/Pending State:** Improve UI feedback during generation.
    -   [ ] **Error Display:** Show user-friendly errors from API.
    -   [ ] **Inputs for:** Copies, Ratio, Theme, Audience.
-   **Ad Library (`ad-library.tsx`):**
    -   [x] Reads ads from `localStorage` (Temporary).
    -   [ ] **BUG:** Fix image rendering issue (likely URL/path/policy related).
    -   [ ] **Design:** Clean up layout and add actions (download, delete).
    -   [ ] **Fetch from DB:** Replace localStorage with database fetch.
-   **Product Management:**
    -   [ ] Component to add/manage products (image, title, desc).
    -   [ ] Component to select existing product for ad generation.

### Authentication (`@supabase/auth-helpers-nextjs`)
-   [ ] **Google OAuth:** Implement login/logout flow.
-   [ ] **Protect Routes:** Secure dashboard/generation pages.
-   [ ] **User Context:** Manage user session state.

### Database Integration
-   [ ] **Schema Design:** Define tables (`users`, `products`, `ads`, `credits`).
-   [ ] **Data Storage:** Save product info, generated ads, and user data to Supabase DB.
-   [ ] **Data Retrieval:** Fetch data for Product Library, Ad Library, Settings.

### System Prompts & AI Logic
-   [ ] **Deep Research:** Refine or implement the research step prompt.
-   [ ] **Ad Copy:** Continuously improve the copy generation prompt based on themes/audience.
-   [ ] **Image Prompting:** Enhance logic for creating effective DALL-E edit prompts.

### Settings & Billing
-   [ ] **User Profile:** Display user info, manage settings.
-   [ ] **Subscription Management:** UI for viewing/changing plans.
-   [ ] **Credit Tracking:** Display and update usage based on generations.
-   [ ] **Credit System Logic:** Implement API checks for limits based on plan.
-   [ ] **Payment Gateway:** Integrate Stripe/LemonSqueezy etc. for subscriptions.

---

## 📝 Contributing

1.  Fork the repository.
2.  Create a new branch (`git checkout -b feature/your-feature-name`).
3.  Make your changes.
4.  Commit your changes (`git commit -m 'Add some feature'`).
5.  Push to the branch (`git push origin feature/your-feature-name`).
6.  Open a Pull Request.

---
