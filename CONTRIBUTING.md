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
1. Search [existing GitHub Issues](https://github.com/) to see if the issue has already been reported.
2. If not, open a new issue using our **Bug Report** template.
3. Include:
   - Clear, descriptive title.
   - Steps to reproduce the bug.
   - Expected vs. actual behavior.
   - Relevant error logs, stack traces, and OS/Python versions.

### Suggesting Features
Ideas and suggestions are always welcome!
1. Check existing issues to see if a similar feature is already under discussion.
2. Open a new issue with a detailed explanation of:
   - What problem the feature solves.
   - Proposed solution or API design.
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
Navigate to the `backend/` directory and configure Python:

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

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Local Environment Variables
Create your local `.env` file from the provided template:
```bash
cp .env.example .env
```
Ensure your `.env` contains valid configuration:
```env
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-at-least-32-chars-long
# For local development with SQLite:
SQLALCHEMY_DATABASE_URI=sqlite:///iats.db

# Or for MySQL:
# SQLALCHEMY_DATABASE_URI=mysql+pymysql://username:password@localhost:3306/iats_db
```

### 5. Run the Server
```bash
python run.py
```
The server will start at `http://127.0.0.1:5000`.

---

## 🌿 Branching & Commit Guidelines

### Branch Naming Conventions
Create a new branch from `main` or the designated feature branch (`authapisetup`):
```bash
git checkout -b <type>/<short-description>
```

Types:
- `feat/` - New feature or endpoint (e.g. `feat/test-creation-api`)
- `fix/` - Bug fix (e.g. `fix/auth-token-expiration`)
- `docs/` - Documentation changes (e.g. `docs/update-contributing`)
- `refactor/` - Code refactoring without behavioral change
- `test/` - Adding or improving tests

### Commit Messages
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```text
<type>(<scope>): <subject>

[optional body]
```

Examples:
- `feat(auth): add admin registration endpoint`
- `fix(schema): resolve validation error on user roll number`
- `docs(backend): update API endpoint table in readme`
- `refactor(models): extract shared timestamps into model base`

---

## 📐 Architecture & Coding Standards

To maintain clean and maintainable code, follow these principles:

### 1. Layered Architecture
- **Routes (`backend/app/v1/routes/`)**: Pure endpoint definitions mapping URLs and HTTP methods to controller functions. Keep routes thin.
- **Controllers (`backend/app/v1/controllers/`)**: Parse HTTP requests, validate input via schemas, handle business logic orchestration, and return structured JSON responses.
- **Models (`backend/app/models/`)**: SQLAlchemy ORM models representing database tables and relationships.
- **Schemas (`backend/app/schemas/`)**: Marshmallow schemas for validating incoming request payloads and serializing outgoing responses.
- **Config (`backend/app/config/`)**: Environment-specific settings loaded from `.env`.

### 2. Code Quality & Formatting
- Adhere to **PEP 8** style guidelines.
- Use explicit type annotations where helpful.
- Keep functions modular and focused on a single responsibility.
- Clean up any unused imports or commented-out code before opening a PR.

### 3. Security & Validation
- **Never commit `.env` or sensitive credentials.**
- Always validate incoming client input using Marshmallow schemas.
- Hash passwords using Werkzeug's secure hashing (`generate_password_hash` / `set_password()`). Never store plaintext passwords.
- Always use parameterized queries via SQLAlchemy to prevent SQL injection.
- Catch database exceptions, invoke `db.session.rollback()`, and return clean JSON error responses with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).

---

## 🚀 Submitting a Pull Request

1. **Keep PRs Focused**: Keep your pull request scoped to a single feature or bugfix. Smaller PRs are reviewed and merged much faster.
2. **Test Locally**: Verify that your endpoints work correctly and do not break existing functionality:
   ```bash
   python backend/run.py
   ```
3. **Push to Your Fork**:
   ```bash
   git push origin <your-branch-name>
   ```
4. **Open a Pull Request**:
   - Navigate to the repository on GitHub and click **Compare & pull request**.
   - Fill out the provided [Pull Request Template](.github/pull_request_template/pull_request.md).
   - Link any related issues (e.g., `Closes #12`).
5. **Review & Iterate**: Address any reviewer feedback or requested changes promptly.

---

Thank you for contributing to the **Intelligent Academic Test System**! 🎉

