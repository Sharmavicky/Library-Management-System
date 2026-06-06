# 📚 Library Management System

**Live Demo:** [ReadMatrix — Smart Library Management System](https://readmatrix.netlify.app/)

A comprehensive, full-stack Library Management System built with the MERN stack (MongoDB, Express.js, React, Node.js). This system is designed to streamline library operations, offering distinct role-based access for both Administrators and Members. It encompasses everything from book inventory management and issuance tracking to fine calculations, automated overdue jobs, and analytical reports.

---

## 🌟 Key Features

### 👨‍💼 Administrator Features
- **Dashboard & Analytics:** Visual insights and real-time statistics (powered by Chart.js).
- **Book Inventory Management:** Add, update, delete, and categorize books.
- **Member Management:** View, approve, or manage library member accounts.
- **Issue & Return Tracking:** Manage book loans, track due dates, and process returns.
- **Fine Management:** Automated fine calculations for overdue books.
- **Reports:** Generate and view library activity reports.

### 👤 Member Features
- **Personalized Dashboard:** Track currently borrowed books, history, and active fines.
- **Book Catalog & Search:** Browse the library's collection with search and filtering capabilities.
- **Book Requests:** Request to borrow books directly through the platform.
- **Fines & History:** View detailed history of past issuances and outstanding fines.

### ⚙️ Core System Features
- **Authentication & Authorization:** Secure, role-based JWT & Redis-backed session management. Includes OTP-based email verification.
- **Automated Background Jobs:** Cron jobs designed to automatically flag overdue books and apply fines.
- **Security:** Helmet, rate limiting, and MongoDB sanitization against NoSQL injection.
- **Caching & Performance:** Redis integration for rapid session and token management.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (via Vite)
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Data Fetching:** TanStack React Query + Axios
- **Routing:** React Router v7
- **UI Components & Icons:** Chart.js, react-chartjs-2, react-icons

### Backend
- **Runtime & Framework:** Node.js, Express.js (v5)
- **Database:** MongoDB (with Mongoose ORM)
- **Caching & Sessions:** Redis, `express-session`, `connect-redis`
- **Authentication:** `jsonwebtoken` (JWT), `bcrypt`
- **Validation:** Zod schemas
- **Task Scheduling:** `node-cron`
- **Email Services:** `nodemailer`, `deep-email-validator`
- **Security:** `helmet`, `express-rate-limit`, `express-mongo-sanitize`

---

## 📁 Architecture & Project Structure

```text
Library-Management-System/
├── Backend/
│   ├── index.js                  # Entry point for the Express backend
│   ├── controllers/              # Business logic (Auth, Books, Fines, Issues, Reports, etc.)
│   ├── Models/                   # Mongoose schemas (Book, User, Issue, Fine, etc.)
│   ├── src/
│   │   ├── config/               # DB, Redis, Mailer configurations
│   │   ├── jobs/                 # node-cron scheduled jobs (e.g., OverDueJob)
│   │   ├── middleware/           # Auth, Error handlers, Rate limiters
│   │   ├── routes/               # Express API blueprints
│   │   ├── validators/           # Zod validation schemas
│   │   └── scripts/              # DB seeding scripts
│   └── utils/                    # Helpers (OTP, Pagination, Token Cache)
│
└── Frontend/
    ├── index.html
    ├── src/
    │   ├── api/                  # Axios configuration
    │   ├── Components/           # Reusable UI components (Nav, Sidebar, ProtectedRoute)
    │   ├── pages/                # Views (Login, Register, OTP)
    │   │   ├── admin/            # Admin-specific pages (Dashboard, Books, Fines)
    │   │   └── member/           # Member-specific pages (Catalog, Reader, History)
    │   ├── services/             # API request wrappers
    │   └── store/                # Zustand global state (AuthStore)
    └── vite.config.js
```

---

## 🚀 Setup & Installation

### 1. Prerequisites
Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local or Atlas URI)
- [Redis](https://redis.io/download/) (running locally on port 6379, or a cloud instance)

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory and configure your environment variables:
```env
# Server
PORT=5000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/library-management

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Security & Sessions
SESSION_SECRET=your_super_secret_session_key
JWT_SECRET=your_jwt_secret_key

# Email (For nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

**Start the Backend Server:**
```bash
# For development
npm run dev

# To seed the database with initial book data
npm run seed
```

### 3. Frontend Setup
```bash
cd Frontend
npm install
```

*(Optional)* Create a `.env` file in the `Frontend/` directory to store API URLs if they differ from defaults (e.g., `VITE_API_URL=http://localhost:5000/api`).

**Start the Frontend Server:**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` and will communicate with the backend running on `http://localhost:5000`.

---

## 📌 Available Scripts

### Backend (`/Backend`)
- `npm run dev` ⎯ Starts the development server using `nodemon`.
- `npm run start` ⎯ Starts the production server.
- `npm run seed` ⎯ Populates the database with sample book records.

### Frontend (`/Frontend`)
- `npm run dev` ⎯ Starts the Vite development server.
- `npm run build` ⎯ Compiles the app into static files for production.
- `npm run preview` ⎯ Serves the production build locally.
- `npm run lint` ⎯ Runs ESLint to check for code quality issues.

---

## 🛡️ Security Highlights
- **Request Validations:** Using Zod ensures only strictly typed data enters the backend flow.
- **Rate Limiting:** Protects exposed API endpoints from brute-force and DDoS attacks.
- **Sanitization:** Protects MongoDB against NoSQL Injection via `express-mongo-sanitize`.
- **HTTP Headers:** Secures responses utilizing `helmet`.
- **OTP Verification:** Ensures emails are verified via `deep-email-validator` and standard 6-digit OTPs.

---

## 👨‍💻 Author

**Vicky Sharma**
- GitHub: [@Sharmavicky](https://github.com/Sharmavicky)

- `POST /api/auth/refresh` — refresh authentication token
- `GET /api/books` — list all books
- `GET /api/books/search?query=` — search books
- `GET /api/books/:bookId` — view a single book
- `PUT /api/books/:bookId` — admin updates a book
- `DELETE /api/books/:bookId` — admin removes a book
- `GET /api/issues/my` — member issue history
- `POST /api/issues` — admin issues a book
- `PATCH /api/issues/:issuedId/return` — admin returns an issued book
- `GET /api/users/profile` — get logged-in member profile
- `GET /api/users` — admin lists all members
- `PATCH /api/users/:userId/block` — admin blocks a member
- `PATCH /api/users/:userId/fine` — admin clears a fine

## 🛠️ Notes

- Ensure MongoDB and Redis are running before starting the backend.
- The frontend expects the backend API to be available at `http://localhost:3000`.

## 👩‍💻 Author

Vicky Sharma