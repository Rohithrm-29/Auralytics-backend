# Auralytics Backend API

Enterprise-grade Node.js + Express + TypeScript REST API for the Auralytics workforce management platform.

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express 4
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL)
- **Auth**: JWT (access + refresh tokens)
- **Validation**: Zod
- **Logging**: Winston + Morgan
- **Security**: Helmet, bcryptjs, express-rate-limit

---

## Quick Start

### 1. Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### 2. Clone & Install
```bash
cd auralytics-backend
npm install
```

### 3. Environment Variables
```bash
cp .env.example .env
```
Fill in your `.env`:
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=a-long-random-secret-min-32-chars
JWT_REFRESH_SECRET=another-long-random-secret
```

### 4. Set Up Database
1. Open your Supabase project → SQL Editor
2. Run the full contents of `schema.sql`
3. This creates all tables, indexes, and inserts seed data

### 5. Run Dev Server
```bash
npm run dev
```
API runs at `http://localhost:5000`

### 6. Build for Production
```bash
npm run build
npm start
```

---

## API Overview

All endpoints are prefixed with `/api/v1/`

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Login with email + password |
| POST | `/auth/refresh` | Refresh access token |
| GET  | `/auth/me` | Get current user |

### Employees
| Method | Path | Access |
|--------|------|--------|
| GET | `/employees` | All roles |
| POST | `/employees` | HR only |
| PATCH | `/employees/:id` | HR only |
| DELETE | `/employees/:id` | HR only |
| GET | `/employees/:id/profile` | Self + manager |
| GET | `/employees/:id/subordinates` | Manager hierarchy |

### Projects
| Method | Path | Access |
|--------|------|--------|
| GET | `/projects` | All roles |
| POST | `/projects` | HR only |
| POST | `/projects/:id/assign` | HR only |

### Tasks
| Method | Path | Access |
|--------|------|--------|
| GET | `/tasks` | All (filtered by role) |
| POST | `/tasks` | HR, Manager |
| PATCH | `/tasks/:id` | Assignee (status only) / HR, Manager (all) |
| POST | `/tasks/:id/comments` | All |

### KRA
| Method | Path | Access |
|--------|------|--------|
| GET | `/kra` | All |
| POST | `/kra` | HR, Manager |
| PATCH | `/kra/:id/status` | HR, Manager |

### Revenue
| Method | Path | Access |
|--------|------|--------|
| GET | `/revenue` | HR, Manager |
| GET | `/revenue/trends` | HR, Manager |
| GET | `/revenue/budget-vs-revenue` | HR, Manager |
| POST | `/revenue` | HR only |

### Dashboard
| GET | `/dashboard/stats` | HR, Manager, Recruiter |
| GET | `/dashboard/activity` | HR, Manager, Recruiter |
| GET | `/dashboard/performance` | HR, Manager |

### Notifications
| GET | `/notifications` | Self |
| PATCH | `/notifications/:id/read` | Self |
| PATCH | `/notifications/mark-all-read` | Self |

### Audit Logs
| GET | `/audit` | HR, Manager |

---

## Seed Credentials

| Name | Email | Role |
|------|-------|------|
| Sarah Chen | sarah.chen@auralytics.io | HR |
| Marcus Tan | marcus.tan@auralytics.io | Manager |
| Priya Nair | priya.nair@auralytics.io | Recruiter |
| Jordan Lee | jordan.lee@auralytics.io | Senior Designer |
| Aisha Malik | aisha.malik@auralytics.io | Designer |
| Wei Zong | wei.zong@auralytics.io | Designer |

---

## Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```
Error:
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "AUTH_FAILED"
  }
}
```

---

## Deployment (Render / Railway)

1. Push repo to GitHub
2. Create new Web Service on Render
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all env variables from `.env.example`
6. Set `NODE_ENV=production`
