# FitAI Backend 🏋️‍♂️

The backend API for the FitAI application, an AI-powered fitness training platform. This service handles user authentication, workout generation, nutrition planning, and payment processing.

## 🛠️ Tech Stack

- **Runtime**: Node.js (Express)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth + JWT
- **Payments**: Stripe
- **SMS**: Twilio
- **AI**: Google Gemini

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- npm
- Supabase project
- Stripe account
- Twilio account

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/fitai-backend.git
    cd fitai-backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment:**
    Copy `.env.example` to `.env` and update with your credentials:
    ```bash
    cp .env.example .env
    ```

4.  **Run Migrations:**
    Execute the SQL in `supabase_migration.sql` in your Supabase SQL Editor.

### Local Development

Start the development server with hot-reload:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`.

## 📜 Scripts

-   `npm run dev`: Start dev server
-   `npm run build`: Compile TypeScript
-   `npm start`: Start production server
-   `npm test`: Run tests
-   `npm run lint`: Lint code

## 📂 Project Structure

-   `src/modules`: Feature-based modules (Auth, Users, Workouts, etc.)
-   `src/shared`: Shared utilities, middleware, and types
-   `src/config`: Configuration files
-   `scripts`: Setup and verification scripts

## 📄 License

[MIT](LICENSE)
