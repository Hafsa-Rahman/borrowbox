# BorrowBox — Community Tool & Equipment Lending Platform

A full-stack PERN (PostgreSQL · Express.js · React · Node.js) application built for the
U Devs Internship Batch 6 Final Year Project brief. Members list items they own,
other members search by date availability and send borrow requests, and every
booking moves through a defined life-cycle from request to return with condition
logging and two-way trust reviews.

## Tech stack
- **Database:** PostgreSQL
- **Backend:** Node.js + Express.js, JWT auth, bcrypt password hashing
- **Frontend:** React (Vite), React Router, Axios
- **No** payment gateway, live chat/sockets, maps/GPS or AI — by design (see FYP brief).

## Features
- Authentication & profiles with JWT and bcrypt-hashed passwords
- Item listing with category, condition, max lending days and pickup area
- Browse/search with keyword, category filter, "available between dates" filter, sorting and pagination
- Booking engine with a date-overlap check, a role-based status state machine, and auto-rejection of clashing requests inside a database transaction
- Handover / return condition logging
- Two-way 1–5 star reviews and a computed trust score (`AVG(rating)`)
- Dashboard with **My Items / My Borrowings / Incoming Requests** tabs
- Admin panel: activate/deactivate users, manage categories, platform stats
- Full CRUD on every entity, enforced both in the API and the React UI

## Project structure

```
borrowbox/
├── client/                # React app (Vite)
│   └── src/
│       ├── api/           # Axios instance with JWT interceptor
│       ├── components/    # Navbar, ItemCard, StatusBadge, BookingForm, ConfirmDialog
│       ├── context/       # AuthContext, ToastContext
│       ├── pages/         # Home, ItemDetail, Login, Register, Dashboard, ItemForm, Profile, Admin
│       ├── routes/        # ProtectedRoute, AdminRoute
│       └── App.jsx
├── server/
│   └── src/
│       ├── config/        # db.js (pg Pool)
│       ├── controllers/   # auth, users, items, categories, bookings, reviews, admin
│       ├── middleware/    # auth.js, role.js, validate.js, errorHandler.js
│       ├── routes/        # one file per module
│       ├── services/      # bookingService.js — business rules & status transitions
│       ├── db/             # schema.sql, seed.sql
│       └── server.js
└── README.md
```

## Setup

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 13+ running locally (or update the `PG*` variables to point elsewhere)

### 2. Database
```bash
createdb borrowbox
psql -U postgres -d borrowbox -f server/src/db/schema.sql
psql -U postgres -d borrowbox -f server/src/db/seed.sql
```
This creates the six tables (`users`, `categories`, `items`, `bookings`, `condition_logs`,
`reviews`) and loads sample data: one admin, three members, six items, and one
completed booking with reviews so trust scores show up right away.

> **Seeded accounts** (password for all: `Passw0rd!`)
> - `admin@borrowbox.dev` — admin
> - `ali@borrowbox.dev`, `sara@borrowbox.dev`, `bilal@borrowbox.dev` — members

### 3. Backend
```bash
cd server
cp .env.example .env   # edit PG* values and JWT_SECRET as needed
npm install
npm run dev            # starts on http://localhost:5000
```

### 4. Frontend
```bash
cd client
cp .env.example .env   # VITE_API_URL defaults to http://localhost:5000/api
npm install
npm run dev             # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## API overview

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | Public | Create account |
| POST | /api/auth/login | Public | Log in, get JWT |
| GET | /api/auth/me | Member | Current user |
| PUT / DELETE | /api/users/me | Member | Edit / soft-delete profile |
| GET | /api/users/:id | Public | Public profile + trust score |
| GET/POST/PUT/DELETE | /api/categories | Public / Admin | Category CRUD |
| GET/POST/PUT/DELETE | /api/items | Public / Member / Owner | Item CRUD, search & filter |
| GET | /api/items/:id/availability | Public | Booked date ranges |
| POST/GET/PUT/DELETE | /api/bookings | Member | Booking CRUD |
| PATCH | /api/bookings/:id/status | Owner/Borrower | approve\|reject\|cancel\|pickup\|return |
| POST/PUT/DELETE | /api/bookings/:id/reviews, /api/reviews/:id | Member | Reviews |
| GET | /api/admin/stats, /api/admin/users | Admin | Platform stats & user list |
| PATCH | /api/admin/users/:id/status | Admin | Activate/deactivate a user |

Full endpoint list and business rules are documented in the original FYP brief PDF.

## Booking status flow
```
REQUESTED --approve--> APPROVED --pickup--> PICKED_UP --return--> RETURNED
    |                     |
  reject               cancel
    v                     v
REJECTED              CANCELLED
```
Approving a booking runs inside a single database transaction that re-checks the
date overlap, locks the item row, and auto-rejects any other pending requests
whose dates now clash.

## Notes
- All SQL uses parameterised queries (`$1, $2 …`) — never string concatenation.
- Response shape: `{ success, data, message }`. Errors use `400` validation, `401`
  not logged in, `403` not allowed, `404` not found, `409` conflict (date overlap /
  invalid status transition).
