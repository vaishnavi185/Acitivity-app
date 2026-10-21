# Activity Management Platform

A mobile-first activity discovery and management platform that allows users to create, discover, and join local activities such as sports meetups, study groups, and casual gatherings.

The project consists of a **Next.js frontend**, a **FastAPI backend**, and a **PostgreSQL database**.

## Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Installation and Running Locally](#installation-and-running-locally)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Security and Validation](#security-and-validation)
- [Known Limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Assessment Submission Checklist](#assessment-submission-checklist)

## Features

### Authentication and Profiles
- User registration and login.
- JWT-based authentication.
- Profile viewing and updating.
- Protected API endpoints.

### Activity Management
- Create, edit, and delete activities.
- View activity details.
- Browse available activities.
- Discover geocoded activities within 25 km of the selected dashboard location, ordered by distance.
- Search by keyword.
- Filter by category and indoor/outdoor environment.
- Join or leave activities.
- Like and bookmark activities.
- Prevent joining activities when capacity is full.

### Dashboard
- View activities created by the logged-in user.
- View joined activities.
- View upcoming and past activities.
- Display dashboard statistics.
- View bookmarked activities.

### Categories
- List and retrieve activity categories.
- Create, update, and delete categories through the backend API.

### Responsive Interface
- Mobile-oriented, responsive frontend layout.
- Dedicated login, registration, dashboard, activities, and profile pages.

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| UI libraries | Lucide React, SweetAlert2 |
| Backend | Python, FastAPI, Uvicorn |
| Validation | Pydantic |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Authentication | JWT, Passlib, bcrypt |
| Backend testing | pytest, FastAPI TestClient, httpx |
| Browser testing | Playwright |
| Code quality | ESLint, TypeScript |

## Project Architecture

```text
Activity-Management-Platform/
├── backend/
│   ├── config/             # Authentication and security
│   ├── db/                 # Database connection and sessions
│   ├── models/             # SQLAlchemy database models
│   ├── routes/             # FastAPI endpoints
│   ├── schemas/            # Pydantic request/response schemas
│   ├── service/            # Backend business logic
│   ├── tests/              # Backend automated tests
│   ├── main.py             # FastAPI application entry point
│   └── requirements.txt
│
└── activity-app/
    ├── app/                # Next.js App Router pages
    ├── e2e/                # Playwright browser tests
    ├── service/            # Frontend API service layer
    ├── src/components/     # UI components
    ├── package.json
    └── playwright.config.ts
```

### Architecture Overview

**Frontend:** Next.js handles the user interface, page navigation, forms, activity discovery, dashboard, and profile screens.

**Service layer:** The frontend service modules manage communication with backend endpoints. The shared authentication request helper attaches the JWT bearer token when available.

**Backend:** FastAPI exposes REST APIs. Routes handle HTTP requests, Pydantic schemas validate input, and service modules implement business logic.

**Database:** PostgreSQL stores users, activities, categories, and activity interactions using SQLAlchemy.

**Authentication:** Users log in to receive a JWT access token. Protected endpoints require a valid bearer token.

## Prerequisites

Install the following before starting:

- Python 3.10 or later
- Node.js 20.9 or later
- npm
- PostgreSQL
- Git

For browser tests, Playwright's Chromium browser must also be installed.

## Environment Configuration

Create local environment files before starting the application. Never commit files containing database passwords, JWT secrets, or other sensitive values.

### Backend environment

Create `backend/.env` with the following variables:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_NAME=activity_app
DB_USER=postgres
DB_PASSWORD=your_local_database_password

SECRET_KEY=replace_with_a_long_random_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Update the database credentials to match your local PostgreSQL configuration.

Create the file using PowerShell:

```powershell
cd backend
notepad .env
```

Paste the configuration, update the values, and save it.

### Frontend environment

Create `activity-app/.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

PowerShell command:

```powershell
cd activity-app
Set-Content .env.local "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000"
```

Restart the frontend server after changing environment variables.

The `NEXT_PUBLIC_API_BASE_URL` value is public frontend configuration, not a secret.

## Database Setup

The backend uses PostgreSQL. Configure the connection using the environment variables described above.

### 1. Start PostgreSQL

Ensure your PostgreSQL service is running.

### 2. Create the database

Run the following command if PostgreSQL's command-line tools are installed:

```powershell
psql -U postgres -c "CREATE DATABASE activity_app;"
```

If the database already exists, do not create it again.

### 3. Configure the connection

Update `backend/.env` with the correct database host, port, database name, username, and password.

### 4. Initialize tables

The application uses SQLAlchemy's `Base.metadata.create_all()` during startup to create mapped tables that do not already exist.

No Alembic migration scripts or database seed script were identified in the inspected project.

### 5. Create initial categories

If the database has no categories, create them through the Swagger UI using `POST /categories/`.

Example request:

```json
{
  "name": "Food",
  "slug": "food",
  "icon_name": "utensils"
}
```

Create each category separately. The endpoint expects one category object per request, not an array.

## Installation and Running Locally

The following commands use Windows PowerShell.

### Step 1: Clone the repository

Replace the placeholder URL with the public GitHub repository URL.

```powershell
git clone <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
cd Activity-Management-Platform
```

### Step 2: Set up the backend

From the repository root:

```powershell
cd backend

py -3 -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt
```

Create and configure `backend/.env` as described in the environment section.

### Step 3: Start the backend

Run this command from the `backend` directory:

```powershell
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

The backend will be available at:

- API base URL: `http://localhost:8000`
- Swagger documentation: `http://localhost:8000/docs`
- OpenAPI schema: `http://localhost:8000/openapi.json`

Keep the backend terminal running.

### Step 4: Set up the frontend

Open a **second PowerShell terminal** and navigate to the frontend directory:

```powershell
cd Activity-Management-Platform\activity-app

npm install
```

Create `activity-app/.env.local`:

```powershell
Set-Content .env.local "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000"
```

### Step 5: Start the frontend

```powershell
npm run dev
```

Open the application in your browser:

**Frontend:** `http://localhost:3000`

Keep both frontend and backend servers running while using the application.

## API Documentation

All endpoints below use the base URL:

`http://localhost:8000`

Protected endpoints require an `Authorization: Bearer <access_token>` header.

### Authentication

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Log in and receive an access token | No |
| GET | `/auth/me` | Get the current user's profile | Yes |
| PATCH | `/auth/me` | Partially update the current user's profile | Yes |

Registration accepts `full_name`, `email`, and `password`, with optional `location`. Login accepts `email` and `password`.

### Users and Profiles

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/users/me` | Get the current user's profile | Yes |
| PUT | `/users/me` | Update the current user's profile | Yes |
| GET | `/users/me/bookmarks` | List bookmarked activities | Yes |

### Categories

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/categories/` | List categories | No |
| GET | `/categories/{category_id}` | Get a category by ID | No |
| POST | `/categories/` | Create a category | No |
| PATCH | `/categories/{category_id}` | Update a category | No |
| DELETE | `/categories/{category_id}` | Delete a category | No |

Example category request:

```json
{
  "name": "Reading",
  "slug": "reading",
  "icon_name": "book-open"
}
```

### Activities

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/activities/` | List and discover activities | No |
| GET | `/activities/{activity_id}` | Get activity details | No |
| POST | `/activities/` | Create an activity | Yes |
| GET | `/activities/my/created` | List activities created by the current user | Yes |
| GET | `/activities/my/joined` | List activities joined by the current user | Yes |
| GET | `/activities/my/joined/count` | Get joined activity count | Yes |
| PATCH | `/activities/{activity_id}` | Update an activity | Yes |
| DELETE | `/activities/{activity_id}` | Delete an activity | Yes |
| POST | `/activities/{activity_id}/join` | Join an activity | Yes |
| POST | `/activities/{activity_id}/leave` | Leave an activity | Yes |
| POST | `/activities/{activity_id}/like` | Toggle an activity like | Yes |
| POST | `/activities/{activity_id}/bookmark` | Toggle an activity bookmark | Yes |

The activity listing endpoint supports query parameters for keyword search, category filtering, environment, pagination offset (`skip`), and page size (`limit`). To discover nearby activities, pass `near_latitude`, `near_longitude`, and `radius_km` (defaults to 25 km); results are limited to activities with mapped locations and ordered by distance.

Activity creation includes fields such as `title`, `description`, `category_id`, `location`, `latitude`, `longitude`, `activity_date`, `start_time`, `end_time`, and `additional_needed`. Coordinates are optional for API compatibility but must be supplied together for nearby discovery. The cover image URL is optional, and the environment defaults to `outdoor`.

The backend checks activity ownership for update/delete operations and prevents joining activities that have reached capacity.

### Dashboard

| Method | Endpoint | Description | Authentication |
|---|---|---|---|
| GET | `/dashboard/stats` | Get created, joined, and upcoming activity counts | Yes |
| GET | `/dashboard/activities?type=created` | List created activities | Yes |
| GET | `/dashboard/activities?type=joined` | List joined activities | Yes |
| GET | `/dashboard/activities?type=upcoming` | List upcoming activities | Yes |
| GET | `/dashboard/activities?type=past` | List past activities | Yes |

### Interactive API documentation

Visit `http://localhost:8000/docs` to explore endpoints, inspect schemas, and send requests.

To test protected endpoints, log in through `/auth/login`, copy the returned access token, and enter it in Swagger's **Authorize** dialog.

## Testing

### Backend tests

Backend automated tests are located in `backend/tests/`.

From the repository root:

```powershell
cd backend

.\.venv\Scripts\Activate.ps1

python -m pytest -q
```

The test configuration should use an isolated test database. Verify the current fixtures before running tests to ensure they do not use or modify development data.

### Frontend browser tests

Playwright browser tests are located in `activity-app/e2e/`.

Run:

```powershell
cd activity-app

npx playwright install chromium

npm run test:e2e
```

The configured browser tests cover selected authentication and route-protection behavior. Some tests intercept API calls, so they should not be treated as proof of a complete live frontend-to-database workflow.

### Lint, TypeScript, and build checks

Run these commands from `activity-app/`:

```powershell
npm run lint

npx tsc --noEmit

npm run build
```

These checks help identify lint, TypeScript, and build issues. They do not replace functional API or browser tests.

**Testing status:** Run the commands above before submission and report the actual results. Do not describe tests as passing unless they have been executed successfully.

## Security and Validation

- Passwords are hashed using bcrypt.
- JWT bearer tokens are used for authenticated API requests.
- Protected endpoints validate authentication.
- Pydantic schemas validate incoming request data.
- Activity update and delete operations check ownership.
- The backend prevents duplicate participation and joining activities that are full.
- CORS is configured for the local frontend origin `http://localhost:3000`.
- Environment files containing credentials and secrets should remain untracked.

**Security consideration:** Category creation, update, and deletion endpoints are not authenticated in the inspected backend. Add suitable authorization before exposing these endpoints in an untrusted production environment.

The backend also provides a `/test-db` diagnostic route. Avoid exposing raw database errors or diagnostic details in production.

## Known Limitations

- A complete password-reset backend flow was not identified.
- Database initialization uses SQLAlchemy `create_all()`; no migration scripts were found.
- Initial category seed data is not provided automatically.
- Category management endpoints currently lack authentication and authorization.
- Frontend browser tests do not establish that every feature works end-to-end against a live PostgreSQL database.
- PostgreSQL-specific behavior is not fully covered by tests that use SQLite.
- Real-time activity updates, comments, and map integration were not identified as implemented features.

These limitations can be addressed as future improvements, depending on the scope of the assessment.

## Troubleshooting

### PostgreSQL connection error

- Ensure PostgreSQL is running.
- Verify `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`.
- Confirm the database exists and the configured user has access.

### Missing JWT secret

Ensure `SECRET_KEY` is set in `backend/.env`, then restart the backend.

### Frontend cannot connect to the backend

- Ensure the backend is running on port `8000`.
- Verify `NEXT_PUBLIC_API_BASE_URL` in `activity-app/.env.local`.
- Restart Next.js after changing environment variables.
- Check browser DevTools for CORS, network, and API validation errors.

### No categories available

Create categories using `POST /categories/` through Swagger UI, then refresh the frontend.

### Login or protected route failure

- Register an account and log in.
- Confirm the credentials are correct.
- Check that the browser request includes a valid bearer token.
- Log in again if the access token has expired.

### Port already in use

Stop the conflicting process or configure another port. If the backend port changes, update `NEXT_PUBLIC_API_BASE_URL` and the CORS configuration as necessary.

### Virtual environment activation is blocked

You can run Python through the virtual environment directly:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

.\.venv\Scripts\python.exe -m pytest -q
```
