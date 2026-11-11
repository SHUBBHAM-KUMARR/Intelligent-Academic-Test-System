# 🤝 Contributing to Intelligent Academic Test System (IATS)

Thank you for your interest in contributing to **Intelligent Academic Test System (IATS)**! Contributions from the community help make this platform more robust, scalable, and intelligent for educators and students alike.

Please take a few moments to review these guidelines before getting started.

---

## 📑 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [How Can I Contribute?](#-how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Code Contributions](#code-contributions)
- [Development Setup](#-development-setup)
  - [Backend Setup](#2-set-up-the-backend-environment)
  - [Frontend Setup](#3-set-up-the-frontend-environment)
- [Branching & Commit Guidelines](#-branching--commit-guidelines)
- [Architecture & Coding Standards](#-architecture--coding-standards)
- [Submitting a Pull Request](#-submitting-a-pull-request)

---

## 📜 Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful, constructive, and open to feedback in all interactions across issues, discussions, and pull requests.

---

## 💡 How Can I Contribute?

### Reporting Bugs
If you encounter a bug or unexpected behavior:
1. Search existing GitHub Issues to see if the issue has already been reported.
2. If not, open a new issue using the repository's **Bug Report** issue template.
3. Include:
   - Clear, descriptive title.
   - Steps to reproduce the bug.
   - Expected vs. actual behavior.
   - Relevant error logs, stack traces, and OS / Python / Node.js versions.

### Suggesting Features
Ideas and suggestions are always welcome!
1. Check existing issues to see if a similar feature is already under discussion.
2. Open a new issue with a detailed explanation of:
   - What problem the feature solves.
   - Proposed solution, UI flow, or API design.
   - Any alternative solutions considered.

### Code Contributions
Whether you're fixing a typo, resolving an open issue, or building a new feature:
1. Pick an existing open issue or open one to discuss your proposed change first.
2. Follow the development workflow outlined below.

---

## 🛠️ Development Setup

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork locally:
```bash
git clone https://github.com/<your-username>/iats.git
cd iats
```

### 2. Set Up the Backend Environment
Navigate to `backend/` and set up your Python virtual environment (Python 3.10+, tested on 3.13):

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create `backend/.env` from `backend/.env.example`:
```bash
cp .env.example .env
```
Ensure `backend/.env` contains valid configuration:
```env
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-at-least-32-chars-long
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# For local development with SQLite:
SQLALCHEMY_DATABASE_URI=sqlite:///iats.db

# Or for MySQL:
# SQLALCHEMY_DATABASE_URI=mysql+pymysql://username:password@localhost:3306/iats_db
```

Run the backend server:
```bash
python run.py
```
The API server will start at `http://127.0.0.1:5000`.

### 3. Set Up the Frontend Environment
In a separate terminal, navigate to `frontend/` (requires Node.js 22+ and npm):
```bash
cd frontend
npm install
```

Vite is configured with `envDir: './env'` in `frontend/vite.config.ts`. Create `frontend/env/.env` from `frontend/.env.example`:
```bash
mkdir -p env
cp .env.example env/.env
```
Ensure `frontend/env/.env` contains:
```env
VITE_SERVER_URL=http://127.0.0.1:5000
VITE_API_URL=http://127.0.0.1:5000/api/v1
```

Start the frontend dev server:
```bash
npm run dev
```
The React + Vite client will start at `http://localhost:5173`.

---

## 🌿 Branching & Commit Guidelines

### Branch Naming Conventions
Create a new branch from `dev` (or the target integration branch specified in the issue):
```bash
git checkout dev
git pull origin dev
git checkout -b <type>/<short-description>
```

Types:
- `feat/` or `feature/` — New feature or endpoint (e.g. `feat/test-creation-api`)
- `fix/` — Bug fix (e.g. `fix/auth-token-expiration`)
- `docs/` — Documentation changes (e.g. `docs/update-contributing`)
- `refactor/` — Code refactoring without behavioral change
- `test/` — Adding or improving tests
- `chore/` — Maintenance, dependencies, or tooling updates

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```text
<type>(<scope>): <subject>

[optional body]
```

Examples:
- `feat(auth): add admin registration endpoint`
- `fix(cors): allow localhost and 127.0.0.1 Vite origins`
- `docs(readme): update backend and frontend documentation`
- `chore(env): map frontend and backend environment variables`
- `test(auth): add registration and login pytest cases`

---

## 📐 Architecture & Coding Standards

To maintain clean and maintainable code across both stacks, follow these principles:

### 1. Project Architecture
**Backend (`backend/app/`):**
- **Routes (`app/v1/routes/`)**: Pure endpoint definitions mapping URLs and HTTP methods to controller functions. Keep routes thin.
- **Controllers (`app/v1/controllers/`)**: Parse HTTP requests, validate input via schemas, handle business logic orchestration, and return structured JSON responses.
- **Models (`app/models/`)**: SQLAlchemy ORM models representing database tables and relationships.
- **Schemas (`app/schemas/`)**: Marshmallow schemas for validating incoming request payloads and serializing outgoing responses.
- **Config & Extensions (`app/config/`, `app/extensions.py`)**: Environment-specific settings loaded from `.env` and shared extension instances (`cors`, `db`, `ma`).

**Frontend (`frontend/src/`):**
- **Components & Pages (`src/`)**: Functional React components using TypeScript (`.tsx`), hooks, and modular styling.
- **Environment Access**: Use `import.meta.env.VITE_*` and keep TypeScript definitions updated in `src/vite-env.d.ts`.

### 2. Code Quality & Formatting
- **Backend**: Follow **PEP 8**, use type annotations where helpful, keep functions focused, and remove unused imports before committing.
- **Frontend**: Pass TypeScript type checking (`tsc -b`) and ESLint (`npm run lint`) with zero errors; keep React hooks and dependencies clean.

### 3. Security & Validation
- **Never commit `.env` files (`backend/.env`, `frontend/env/.env`) or sensitive credentials.**
- **CORS**: Keep `CORS_ORIGINS` explicit rather than using wildcard `*` when credentials are enabled.
- **Input & Auth**: Validate incoming backend payloads using Marshmallow schemas, hash passwords with Werkzeug (`set_password()` / `check_password()`), and use parameterized SQLAlchemy queries.
- **Error Handling**: Catch database exceptions, call `db.session.rollback()`, and return structured JSON responses with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).

---

## 🚀 Submitting a Pull Request

1. **Keep PRs Focused**: Scope your pull request to a single feature or fix. Smaller PRs are reviewed and merged faster.
2. **Test Locally**:
   - **Backend**: Run the test suite and verify the server starts cleanly:
     ```bash
     cd backend
     pytest
     python run.py
     ```
   - **Frontend**: Verify linting and production build succeed with zero errors:
     ```bash
     cd frontend
     npm run lint
     npm run build
     ```
3. **Push to Your Branch**:
   ```bash
   git push origin <your-branch-name>
   ```
4. **Open a Pull Request**:
   - Open a PR targeting `dev` (unless instructed otherwise).
   - Fill out the provided [Pull Request Template](.github/pull_request_template/pull_request.md).
   - Link any related issues (e.g., `Closes #12`).
5. **Review & Iterate**: Address reviewer feedback promptly.

---

Thank you for contributing to the **Intelligent Academic Test System**! 🎉
