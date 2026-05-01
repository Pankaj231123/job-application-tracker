# Job Application Tracker

A full-stack web app to track your job applications — built with Go + React.

## Features
- JWT authentication (register & login)
- Add, edit, delete job applications
- Track status: Saved → Applied → Interview → Offer → Rejected
- Dashboard with stats and counts
- Filter and search applications

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Backend | Go, Gin, GORM |
| Database | PostgreSQL |
| Auth | JWT |
| Frontend | React |
| Deploy | Render |

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env
go mod tidy
go run main.go
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| GET | /jobs | Get all jobs |
| POST | /jobs | Add new job |
| PUT | /jobs/:id | Update job |
| DELETE | /jobs/:id | Delete job |
| GET | /dashboard | Stats |

## Live Demo
Coming soon — deploying on Render
