<div align="center">
  <img src="/repo_images/header.png" alt="Intelligent Academic Test System Banner" width="100%" />
</div>

# 🎓 INTELLIGENT ACADEMIC TEST SYSTEM (IATS)
## Backend API Service

This is the **RESTful Backend API** for the **Intelligent Academic Test System (IATS)**, built with Flask and Python. It manages user and administrator authentication, role-based access control, test orchestration, and performance analytics.

---

### 🛠️ Tech Stack

- **Framework**: Flask 3.1
- **CORS**: Flask-Cors 6.0
- **Database & ORM**: SQLAlchemy 2.x & Flask-SQLAlchemy 3.1
- **Driver**: PyMySQL (MySQL support) / SQLite (development fallback)
- **Serialization & Validation**: Marshmallow 4.x & Flask-Marshmallow
- **Authentication**: JWT (JSON Web Tokens via PyJWT) & Werkzeug Security (`scrypt` password hashing)
- **Environment Management**: Python-dotenv

---

### 📁 Project Structure

```text
backend/
├── app/
│   ├── __init__.py              # Application factory (create_app, registers blueprints & extensions)
│   ├── extensions.py            # Shared extension instances (cors, db, ma)
│   ├── config/                  # Environment & database configuration
│   │   ├── __init__.py          # Base, Development, and Production config classes (incl. CORS_ORIGINS)
│   │   └── db_config.py         # Database URI parsing, pooling, and .env loading
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   └── user_model.py        # UserModel (supports student & admin roles, password hashing)
│   ├── schemas/                 # Marshmallow validation and serialization schemas
│   │   ├── __init__.py
│   │   ├── admin_schema.py      # AdminSchema (admin/superadmin payload validation)
│   │   └── user_schema.py       # UserSchema (student payload validation)
│   └── v1/                      # API Version 1
│       ├── controllers/         # Business logic & request/response handlers
│       │   ├── __init__.py
│       │   └── auth_controller.py # Auth handlers (register, login, profile)
│       └── routes/              # Blueprint route definitions
│           ├── __init__.py
│           ├── auth_route.py    # /api/v1/auth endpoints
│           └── home_route.py    # Health/welcome endpoints
├── tests/                       # Backend test suite
│   └── auth_test.py
├── .env                         # Local environment variables (ignored by git)
├── .env.example                 # Template for required environment variables
├── requirements.txt             # Project dependencies
└── run.py                       # Server entry point
```

---

### 🚀 Getting Started

#### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- MySQL Server (optional, SQLite fallback available)

#### 2. Virtual Environment Setup

**Windows (PowerShell):**
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 4. Configure Environment Variables
Copy `.env.example` to `.env` and adjust the variables:
```bash
cp .env.example .env
```

Example `.env`:
```env
FLASK_DEBUG=True
SECRET_KEY=your-super-secret-key-at-least-32-chars-long
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# For MySQL:
SQLALCHEMY_DATABASE_URI=mysql+pymysql://username:password@localhost:3306/database_name
# Or SQLite:
# SQLALCHEMY_DATABASE_URI=sqlite:///iats.db

SQLALCHEMY_ECHO=False
DB_POOL_RECYCLE=300
```

#### 5. Run the Server
```bash
python run.py
```
The server will start at `http://127.0.0.1:5000` with auto-reloading enabled in debug mode.

---

### 📡 API Endpoints (v1)

#### Public & Home
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Returns welcome banner and platform description |

#### Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register a new student |
| `POST` | `/api/v1/auth/register/admin` | No | Register a new administrator |
| `POST` | `/api/v1/auth/admin/register` | No | Alias for `/register/admin` |
| `POST` | `/api/v1/auth/login` | No | Login (student or admin) and receive JWT |
| `GET` | `/api/v1/auth/profile` | Yes (`Bearer <token>`) | Get current authenticated user details |
| `GET` | `/api/v1/auth/me` | Yes (`Bearer <token>`) | Alias for `/profile` |
| `POST` | `/api/v1/auth/logout` | No | Client token invalidation acknowledgement |

---

### 📝 Example Payloads

#### Home Endpoint
`GET /`
```json
[
  { "message": "welcome to IATS" },
  { "description": "A source-grounded AI testing platform that transforms reference books, course notes, and question repositories into targeted academic assessments." }
]
```

#### Student Registration
`POST /api/v1/auth/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```

#### Admin Registration
`POST /api/v1/auth/register/admin`
```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "adminpassword123",
  "role": "admin"
}
```

#### Login
`POST /api/v1/auth/login`
```json
{
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "student",
    "created_at": "2026-11-09T10:00:00Z",
    "updated_at": "2026-11-09T10:00:00Z"
  }
}
```

#### Accessing Protected Endpoints
Include the returned JWT token in the `Authorization` header:
```http
Authorization: Bearer <your_jwt_token>
```
