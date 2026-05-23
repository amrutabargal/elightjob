# Elite Placement Hub

Full-stack placement portal with live API job feeds, JWT auth, mandatory email verification, AI resume analysis, and application tracking. **No admin panel** — jobs are fetched automatically from external APIs.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Node.js, Express, JWT, Nodemailer, Multer |
| Database | MongoDB |

## Features

- User registration / login / forgot password
- **Mandatory email verification** before applying
- Live jobs from **Adzuna**, **JSearch (RapidAPI)**, **Remotive (Remote Jobs)**
- Demo jobs when API keys are not configured
- Job filters: title, skills, location, remote, full-time, part-time, freshers
- Apply with resume + cover letter
- Application status: Applied, Under Review, Shortlisted, Interview, Selected, Rejected
- AI Resume Analyzer & ATS score
- AI Skill Match & Recommended Jobs
- User dashboard: profile, saved jobs, applications

---

## Quick Start

### 1. Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/try/download/community) running locally **OR** MongoDB Atlas connection string

### 2. Install dependencies

```bash
cd c:\Users\user\OneDrive\Desktop\job
npm run install:all
```

### 3. Configure `.env` files

**Backend** — edit `backend/.env`:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret for JWT |
| `CLIENT_URL` | Frontend URL (`http://localhost:5173`) |
| `SMTP_USER` / `SMTP_PASS` | Gmail + [App Password](https://myaccount.google.com/apppasswords) |
| `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` | From [Adzuna Developer](https://developer.adzuna.com/) |
| `RAPIDAPI_KEY` | From [JSearch on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) |

> **Note:** If SMTP is empty, verification emails are **printed in the backend terminal** (dev mode).  
> If job API keys are empty, **demo jobs** are shown so the app still works.

**Frontend** — `frontend/.env`:

```
VITE_API_URL=http://localhost:5000/api
```

### 4. Start MongoDB

Make sure MongoDB is running on `mongodb://127.0.0.1:27017` or update `MONGODB_URI`.

### 5. Run the app

**Terminal 1 — Backend:**
```bash
npm run dev:backend
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```

Open **http://localhost:5173**

---

## Gmail SMTP Setup

1. Enable 2-Step Verification on your Google account
2. Create an **App Password**: https://myaccount.google.com/apppasswords
3. In `backend/.env`:
   ```
   SMTP_USER=your.email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   EMAIL_FROM=Elite Placement Hub <your.email@gmail.com>
   ```

---

## API Keys (Live Jobs)

### Adzuna
1. Register at https://developer.adzuna.com/
2. Create an application → copy App ID and App Key
3. Set `ADZUNA_COUNTRY=in` (India) or `gb`, `us`, etc.

### JSearch (RapidAPI)
1. Subscribe at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Copy your `X-RapidAPI-Key` into `RAPIDAPI_KEY`

### Remote Jobs
Remotive API works **without a key** (free).

---

## Project Structure

```
job/
├── backend/
│   ├── .env              ← your secrets (not in git)
│   ├── .env.example
│   ├── server.js
│   ├── config/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── uploads/
├── frontend/
│   ├── .env
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── context/
│   └── ...
└── README.md
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home |
| `/register` | Sign up |
| `/login` | Login |
| `/verify-email` | Email verification |
| `/forgot-password` | Password reset request |
| `/jobs` | Job listings + filters |
| `/jobs/:id` | Job details + apply |
| `/dashboard` | Profile, AI tools, saved jobs |
| `/applied` | Application tracking |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| MongoDB connection failed | Start MongoDB service or use Atlas URI |
| Email not sending | Set SMTP in `.env` or check backend console for dev link |
| No live jobs | Add API keys; demo jobs show as fallback |
| CORS error | Ensure `CLIENT_URL` matches frontend URL |

---

## License

MIT — for educational / portfolio use.
