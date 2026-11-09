<div align="center">

  <img src="/repo_images/header.png" alt="Intelligent Academic Test System Banner" width="100%" />
</div>


# INTELLIGENT ACADEMIC TEST SYSTEM (IATS)
## Backend

This is the **backend** of the **IntelligeAcademic Test System (IATS)**.


### Tech Stack
  - **python**
  - **flask**
  

### Project Structure (backend)
  ```
   backend/
├── app/
│   ├── __init__.py              # Application factory (register blueprints, init extensions)
│   ├── config.py                # App configuration per environment
│   ├── controllers/             # Handles HTTP request/response parsing
│   │   ├── __init__.py
│   │   ├── auth_controller.py
│   │   └── user_controller.py
│   ├── routes/                  # Pure endpoint definitions (maps URLs to controllers)
│   │   ├── __init__.py
│   │   ├── auth_routes.py
│   │   └── user_routes.py
│   ├── middlewares/             # Custom decorators & request interceptors
│   │   ├── __init__.py
│   │   ├── auth_guard.py
│   │   └── rate_limiter.py
│   ├── services/                # Core business logic (keeps controllers thin)
│   │   ├── __init__.py
│   │   └── user_service.py
│   ├── models/                  # Database schemas
│   │   ├── __init__.py
│   │   └── user.py
│   └── utils/                   # Helper functions, serializers, custom errors
│       ├── __init__.py
│       └── error_handlers.py
├── run.py                       # App runner
└── requirements.txt

 ```