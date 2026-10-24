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




```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

.\.venv\Scripts\python.exe -m pytest -q
```
