<div align="center">
  <img src="/repo_images/header.png" alt="Intelligent Academic Test System Banner" width="100%" />
</div>

# 🎓 INTELLIGENT ACADEMIC TEST SYSTEM (IATS)
## Frontend Web Client

This is the **React + TypeScript + Vite** frontend for the **Intelligent Academic Test System (IATS)**, connected to the Flask REST API backend.

---

### 🛠️ Tech Stack

- **UI Library**: React 19
- **Language**: TypeScript (~6.0)
- **Build Tool & Dev Server**: Vite 8 (`@vitejs/plugin-react`)
- **HTTP Client**: Axios
- **Linting**: ESLint (`@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)

---

### 📁 Project Structure

```text
frontend/
├── env/                         # Environment directory (configured via envDir in vite.config.ts)
│   └── .env                     # Local environment variables (ignored by git)
├── public/                      # Static assets (favicon, icons)
├── src/
│   ├── assets/                  # Bundled images and SVGs
│   ├── App.tsx                  # Root React component
│   ├── App.css                  # App component styles
│   ├── index.css                # Global styles
│   ├── main.tsx                 # React DOM entry point
│   └── vite-env.d.ts            # TypeScript definitions for Vite env variables
├── .env.example                 # Template for required frontend env variables
├── .gitignore                   # Git ignore rules
├── eslint.config.js             # ESLint configuration
├── index.html                   # HTML entry template
├── package.json                 # Dependencies and npm scripts
├── tsconfig.app.json            # TypeScript config for application source
├── tsconfig.json                # Root TypeScript project references
├── tsconfig.node.json           # TypeScript config for Vite/Node tooling
└── vite.config.ts               # Vite configuration (sets envDir: './env')
```

---

### 🚀 Getting Started

#### 1. Prerequisites
- Node.js 22+ and npm

#### 2. Install Dependencies
```bash
cd frontend
npm install
```

#### 3. Configure Environment Variables
Vite is configured in [vite.config.ts](vite.config.ts) with `envDir: './env'`, so place your `.env` file inside `frontend/env/`:

```bash
mkdir -p env
cp .env.example env/.env
```

Example `frontend/env/.env`:
```env
VITE_SERVER_URL=http://127.0.0.1:5000
VITE_API_URL=http://127.0.0.1:5000/api/v1
```

> **Note:** Client-side environment variables in Vite must use the `VITE_` prefix and are typed in [src/vite-env.d.ts](src/vite-env.d.ts) for `import.meta.env` access.

#### 4. Start the Development Server
```bash
npm run dev
```
The Vite dev server starts by default at `http://localhost:5173`. Ensure the Flask backend is running on `http://127.0.0.1:5000` and includes the frontend origin in `CORS_ORIGINS` (see [backend/README.md](../backend/README.md)).

---

### 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Starts Vite development server with HMR |
| `build` | `npm run build` | Type-checks with `tsc -b` and creates a production build in `dist/` |
| `lint` | `npm run lint` | Runs ESLint across the project |
| `preview` | `npm run preview` | Serves the production build locally for preview |
