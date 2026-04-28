# 🚀 CogniVault ServerStack

A secure, production-grade research data vault backend built with Node.js, Express, MongoDB, and Mongoose.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (Access + Refresh tokens)
- **Encryption**: AES via crypto-js
- **Validation**: Joi
- **Docs**: Swagger UI
- **Testing**: Jest + Supertest
- **Containerization**: Docker + Docker Compose

## Quick Start

### 1. Clone & Install
```bash
git clone <repo-url>
cd cognivault-serverstack
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run with Docker
```bash
docker-compose up --build
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login |
| POST | `/api/auth/refresh` | Public | Refresh tokens |
| POST | `/api/auth/logout` | JWT | Logout |
| GET | `/api/auth/me` | JWT | Current user |
| POST | `/api/data` | JWT | Create data record |
| GET | `/api/data` | JWT | List data (role-filtered) |
| GET | `/api/data/:id` | JWT | Get + decrypt data |
| PUT | `/api/data/:id` | JWT | Update data |
| DELETE | `/api/data/:id` | JWT | Delete data |
| GET | `/api/admin/users` | Admin | List all users |
| PATCH | `/api/admin/users/:id/deactivate` | Admin | Deactivate user |
| PATCH | `/api/admin/users/:id/activate` | Admin | Activate user |
| GET | `/api/logs` | Admin | View audit logs |

## Swagger Docs

Visit `http://localhost:5000/api/docs` after starting the server.

## Testing
```bash
npm test
npm run test:coverage
```

## Deployment (Render)

1. Push to GitHub
2. Create a new Web Service on [Render](https://render.com)
3. Set environment variables from `.env.example`
4. Add `RENDER_DEPLOY_HOOK_URL` to GitHub Secrets for auto-deploy

## Security Features

- Helmet (secure HTTP headers)
- Rate limiting (global + auth-specific)
- AES encryption for sensitive data
- bcrypt password hashing (cost factor 12)
- JWT with short-lived access tokens (15m) + refresh tokens (7d)
- RBAC (Admin / Researcher)
- Audit logging (all actions tracked with IP)
- Input validation via Joi
- NoSQL injection prevention via Mongoose strict mode

## Project Structure

```
src/
├── app.js              # Express app entry point
├── config/
│   ├── db.js           # MongoDB connection
│   └── swagger.js      # Swagger config
├── controllers/        # Request handlers
├── services/           # Business logic
├── models/             # Mongoose schemas
├── routes/             # Express routers
├── middleware/         # Auth, validation, error handling
└── utils/              # Encryption, tokens, response helpers
tests/                  # Jest test suites
```
