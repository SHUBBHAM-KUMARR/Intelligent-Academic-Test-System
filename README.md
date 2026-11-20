<div align="center">
  <img src="/repo_images/header.png" alt="Intelligent Academic Test System Banner" width="100%" />
</div>

# 🎓 INTELLIGENT ACADEMIC TEST SYSTEM (IATS)
### *Practise . Calibrate . Level Up*

A source-grounded AI testing platform that transforms reference books, course notes, and question repositories into targeted academic assessments — designed to facilitate the creation, administration, and evaluation of academic tests for both educators and students.

---

## ✨ Features

- **Test Creation**: Easily create tests with various question types, including multiple choice, true/false, short answer, and essay questions.
- **Automated Grading**: Automatically grades objective questions and provides instant feedback to students.
- **Adaptive Testing**: Adjusts question difficulty based on student performance to ensure a personalized testing experience.
- **Analytics and Reporting**: Gives educators detailed analytics and reports on student performance to identify areas for improvement.
- **Secure and Scalable**: Built with role-based JWT authentication and modular REST API architecture.

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Marshmallow, Marshmallow, PyJWT, Flask-Cors, PyMySQL / SQLite
- **Frontend**: React 19, TypeScript, Vite, Axios, ESLint

---

## 📁 Project Structure

```text
iats/
├── backend/                 # Flask REST API backend
│   ├── app/                 # Application factory, config, extensions, models, schemas, v1 routes & controllers
│   ├── tests/               # Backend test suite (pytest)
│   ├── .env.example         # Backend environment variable template
│   ├── requirements.txt     # Python dependencies
│   ├── run.py               # Server startup entry point
│   └── README.md            # Backend setup and API documentation
├── frontend/                # React + TypeScript + Vite frontend
│   ├── env/                 # Frontend environment directory (envDir)
│   ├── public/              # Static assets
│   ├── src/                 # React components, styles, and TypeScript definitions
│   ├── .env.example         # Frontend environment variable template
│   ├── package.json         # Node dependencies and scripts
│   ├── vite.config.ts       # Vite configuration
│   └── README.md            # Frontend setup and script documentation
├── repo_images/             # Repository banners and assets
├── CONTRIBUTING.md          # Contribution guidelines & code standards
├── LICENSE                  # Project license
└── README.md                # Project overview
```

---

## 🚀 Quick Start

### 1. Run the Backend
```bash
cd backend
python -m venv venv
# Activate venv (Windows PowerShell: .\venv\Scripts\Activate.ps1 | macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env
python run.py
```
> See [backend/README.md](backend/README.md) for full configuration and API endpoint documentation.

### 2. Run the Frontend
```bash
cd frontend
npm install
mkdir -p env && cp .env.example env/.env
npm run dev
```
> See [frontend/README.md](frontend/README.md) for environment variables, scripts, and build details.

---

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) to learn how to set up your local environment, follow our branch and commit conventions, and submit pull requests.
