# Online Voting Backend (Node + MongoDB)

## Quick Start (Windows)

1. Ensure MongoDB is running locally (default port 27017).
2. Create `.env` from `.env.example` and set values:
   - `MONGO_URI` e.g. `mongodb://127.0.0.1:27017/online_voting`
   - `JWT_SECRET` a long random string
   - `FRONTEND_ORIGIN=http://localhost:5173`
   - Optional admin seed envs: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`
3. Install and run:

```bash
cd "c:\Users\saish\Online Voting Portal\server" && npm install
```

```bash
npm run dev
```

4. Seed an admin account (optional):

```bash
npm run seed:admin
```

## API Summary

- Auth
  - `POST /api/auth/signup` { name, email, password }
  - `POST /api/auth/login` { email, password }
  - `POST /api/auth/admin/login` { email, password }
  - `GET /api/auth/me` (Bearer token)
- Elections
  - `GET /api/elections` (public, active only)
  - `POST /api/elections` (admin) { title, description, startDate, endDate, isActive }
  - `PUT /api/elections/:id` (admin)
  - `DELETE /api/elections/:id` (admin)
  - `GET /api/elections/:id/candidates` (public)
  - `POST /api/elections/:id/candidates` (admin) { name }
- Votes
  - `POST /api/votes` (user) { electionId, candidateId }
  - `GET /api/votes/stats/:electionId` (admin)