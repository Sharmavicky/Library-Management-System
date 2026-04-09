# Library Management System

A full-stack library management application with role-based authentication, book inventory management, issue/return tracking, and admin/member dashboards.

## 🔎 Features

- User registration, login, logout, and token refresh
- Role-based access: Admin and Member
- Book catalog browsing and search by title or author
- Admin book management: update and delete book records
- Issue and return workflow for borrowing books
- Member profile and issue history
- Redis-backed session management for secure authentication

## 🧱 Tech Stack

- Backend: Node.js, Express, MongoDB, Mongoose, Redis
- Frontend: React, Vite, Tailwind CSS, React Router, Axios
- Validation: Zod
- Session management: express-session + connect-redis

## 📁 Project Structure

- `Backend/`
  - `index.js` — Express server entry point
  - `src/routes/` — API route definitions
  - `controllers/` — Route handlers and business logic
  - `Models/` — Mongoose schema definitions
  - `src/config/` — MongoDB and Redis connection setup
  - `src/middleware/` — Authentication and error handling middleware
  - `src/validators/` — Request validation logic
  - `src/scripts/seedBooks.js` — Sample data seeding script

- `Frontend/`
  - `src/` — React application source
  - `src/pages/` — App pages and views
  - `src/Components/` — UI components
  - `src/services/` — API service modules
  - `src/api/axios.js` — Axios configuration

## 🚀 Setup

### 1. Backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/` with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/library-management
REDIS_URL=redis://localhost:6379
SESSION_SECRET=your-session-secret
```

Start the backend server:

```bash
npm run dev
```

Optional: Seed initial books data:

```bash
npm run seed
```

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend is developed to run on `http://localhost:5173` and communicates with the backend API.

## 📌 Available Scripts

### Backend

- `npm run dev` — start the backend with `nodemon`
- `npm run start` — run the backend once with Node
- `npm run seed` — populate sample book data

### Frontend

- `npm run dev` — start the local Vite development server
- `npm run build` — build the production frontend
- `npm run preview` — preview the production build
- `npm run lint` — run ESLint on frontend files

## 🔗 API Overview

- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and receive session
- `POST /api/auth/logout` — logout authenticated user
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