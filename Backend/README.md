# Mearns Gadget Repair — Backend API

Node.js + Express + Supabase backend for the Mearns Gadget Repair admin panel.

## Tech Stack

- **Node.js 18+**
- **Express** — web framework
- **Supabase** — Postgres database + Auth
- **Nodemailer** — SMTP email
- **Helmet, CORS, Rate Limiting** — security

## Setup

1. Clone the repo
2. `npm install`
3. Copy `.env.example` → `.env`
4. Fill Supabase credentials in `.env`
5. `npm run dev`

## Environment Variables

| Key | Description |
|-----|-------------|
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` or `production` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔒 Secret server key (never expose) |
| `SMTP_HOST` | Mail server host |
| `SMTP_PORT` | Mail server port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Default sender address |

## API Endpoints

### Public
- `GET /health` — health check
- `POST /api/bookings` — create booking from website
- `POST /api/auth/login` — admin login

### Protected (require `Authorization: Bearer <token>`)
- `GET /api/bookings` — list bookings
- `PATCH /api/bookings/:id` — update booking
- `DELETE /api/bookings/:id` — delete booking
- `GET/POST/PATCH/DELETE /api/services`
- `GET/POST/PATCH/DELETE /api/reviews`
- `GET/POST/PATCH/DELETE /api/blog`
- `GET/POST /api/branding`
- `GET/POST /api/content`
- `GET/POST /api/email/config`
- `POST /api/email/test`
- `GET /api/email/logs`
- `GET/POST/PATCH/DELETE /api/users`
- `GET/POST /api/settings`

## Scripts

- `npm start` — production server
- `npm run dev` — development with hot reload

## Deployment

Deployable to Render, Railway, Fly.io, or any Node host. Set env vars in the dashboard.

## Security

- Supabase Auth for admin login
- JWT verification on protected routes
- Rate limiting on all API routes
- Input validation on POST endpoints
- CORS whitelist
- `.env` never committed