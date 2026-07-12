# Library Management System — Design Specification

**Date:** 2026-07-12
**Status:** In Design
**Project:** Library Management System (independent project, no Fixa dependency)

---

## 1. Overview

A standalone library management system with a Spring Boot 3.5 + Java 21 backend,
Angular 21 frontend, and PostgreSQL 16 database. The system manages users (with
roles: USER, LIBRARIAN, ADMIN), books, physical locations (halls → bookshelves →
shelves), borrowing workflows (borrow, return, extend, reserve, fines), and
notifications.

### 1.1 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Project independence | Fully standalone | No dependency on Fixa ecosystem (fixa-web, Keycloak, etc.) |
| Architecture | Monolith with package-by-feature | Right-sized for the scope; avoids microservice complexity |
| Authentication | JWT (access + refresh tokens) | Stateless, ideal for Angular SPA |
| Registration | Open, default role USER | Simple onboarding; admin elevates roles |
| Fine calculation | Fixed daily rate | Simple and predictable |
| Borrowing rules | Currently fixed values (3 books, 14 days, 1 extension of 7 days) | Design is config-ready via a `borrowing_config` table |

---

## 2. Technology Stack

### 2.1 Backend

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | Java 21 | |
| Framework | Spring Boot 3.5.x | |
| Security | Spring Security 6 + JWT (jjwt library) | Stateless; JWT filter chain |
| ORM | Spring Data JPA + Hibernate | |
| Database | PostgreSQL 16 | |
| Migrations | Liquibase | Inside `src/main/resources/db/changelog` |
| Validation | Jakarta Bean Validation | Annotations on DTOs + `@Valid` on controllers |
| API Docs | springdoc-openapi | Auto-generated OpenAPI/Swagger |
| Logging | SLF4J + Logback | |
| Build | Maven (single module) | |
| Testing | JUnit 5, Mockito, H2 (integration tests) | |

### 2.2 Frontend

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Angular 21 | Standalone components |
| UI Kit | Angular Material 3 | Material Design 3 |
| State | Signals + RxJS | No NgRx — scope doesn't need it |
| Routing | Angular Router | Lazy-loaded feature routes |
| Auth | HTTP Interceptor (JWT) + Auth Guards | Role-based route protection |
| Forms | Reactive Forms | |
| Icons | Material Icons | |
| Build | Angular CLI | |
| Testing | Jasmine + Karma (unit), Cypress optional (e2e) | |

### 2.3 Infrastructure

- **Local dev:** Docker Compose (PostgreSQL + backend)
- **Frontend dev server:** `ng serve` proxied to backend on `localhost:8080`

---

## 3. Project Structure

```
library-management/                  ← Git repo root
├── backend/                         ← Spring Boot project (Maven)
│   ├── pom.xml
│   └── src/
│       ├── main/java/com/library/
│       │   ├── LibraryApplication.java
│       │   ├── auth/                ← JWT, login, register, refresh, logout
│       │   ├── user/                ← User CRUD, role management, profile
│       │   ├── book/                ← Book CRUD, search, availability
│       │   ├── location/            ← Hall, Bookshelf, Shelf (CRUD + librarian assignment)
│       │   ├── borrowing/           ← Borrow, Return, Extend, Overdue tracking
│       │   ├── reservation/         ← Reserve, Cancel reservation
│       │   ├── fine/                ← Fine calculation, payment recording
│       │   ├── notification/        ← Notification CRUD, scheduled reminders
│       │   ├── config/              ← Spring Security config, JWT filter, CORS, scheduled tasks
│       │   └── common/              ← Shared DTOs, exceptions, exception handler
│       ├── main/resources/
│       │   ├── application.yml
│       │   ├── application-dev.yml
│       │   └── db/changelog/        ← Liquibase changesets
│       └── test/
│
├── frontend/                        ← Angular 21 project
│   └── src/app/
│       ├── app.config.ts
│       ├── app.routes.ts
│       ├── core/
│       │   ├── guards/              ← auth.guard.ts, role.guard.ts
│       │   ├── interceptors/        ← auth.interceptor.ts, error.interceptor.ts
│       │   ├── services/            ← auth.service.ts, notification.service.ts
│       │   └── models/              ← TypeScript DTO interfaces
│       ├── shared/                  ← Reusable UI components (confirm-dialog, page-header)
│       ├── layout/                  ← Sidebar, navbar, main-layout shell
│       └── features/               ← Lazy-loaded feature modules
│           ├── auth/                ← Login, Register
│           ├── books/               ← Book list, detail, form
│           ├── locations/           ← Location tree, forms
│           ├── borrowings/          ← My borrowings, all borrowings, return
│           ├── fines/               ← My fines, fine management
│           ├── reservations/        ← My reservations
│           ├── users/               ← User list, profile
│           ├── admin/               ← Role management, system config
│           └── notifications/       ← Notification list
│
└── docker-compose.yml
```

---

## 4. Database Design

### 4.1 Entity-Relationship Diagram

```
USERS ──┬── BORROWINGS ── FINES
        │       │
        │       ├── BOOKS ─── SHELVES ─── BOOKSHELVES ─── HALLS
        │       │                                       └── librarian_user_id
        │       ├── RESERVATIONS                       └── librarian_user_id
        │                                            └── librarian_user_id
        │
        ├── NOTIFICATIONS

Standalone config table: BORROWING_CONFIG (1 row)
```

### 4.2 Table Definitions

#### USERS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | Random UUID |
| username | VARCHAR(50) | NOT NULL UNIQUE | Login name |
| password | VARCHAR(255) | NOT NULL | BCrypt hashed |
| email | VARCHAR(100) | NOT NULL UNIQUE | |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| mobile | VARCHAR(20) | | Optional |
| role | VARCHAR(20) | NOT NULL | ENUM: USER, LIBRARIAN, ADMIN |
| enabled | BOOLEAN | NOT NULL DEFAULT TRUE | |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | Optimistic locking |

#### REFRESH_TOKENS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| token | VARCHAR(255) | NOT NULL UNIQUE | Hashed refresh token |
| user_id | BIGINT | FK → USERS.id | |
| expiry_date | TIMESTAMP | NOT NULL | |
| revoked | BOOLEAN | NOT NULL DEFAULT FALSE | For logout |

#### HALLS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| name | VARCHAR(100) | NOT NULL | |
| description | TEXT | | Optional |
| librarian_user_id | BIGINT | FK → USERS.id NULLABLE | Assigned librarian |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### BOOKSHELVES

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| name | VARCHAR(100) | NOT NULL | |
| hall_id | BIGINT | FK → HALLS.id NOT NULL | |
| librarian_user_id | BIGINT | FK → USERS.id NULLABLE | Assigned librarian |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### SHELVES

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| name | VARCHAR(100) | NOT NULL | |
| bookshelf_id | BIGINT | FK → BOOKSHELVES.id NOT NULL | |
| librarian_user_id | BIGINT | FK → USERS.id NULLABLE | Assigned librarian |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### BOOKS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| title | VARCHAR(255) | NOT NULL | |
| author | VARCHAR(255) | NOT NULL | |
| isbn | VARCHAR(20) | NOT NULL UNIQUE | ISBN-10 or ISBN-13 |
| publisher | VARCHAR(255) | | |
| publication_year | INT | | |
| copies_count | INT | NOT NULL DEFAULT 1 | Total copies owned |
| shelf_id | BIGINT | FK → SHELVES.id NOT NULL | Physical location |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

Available copies = `copies_count - COUNT(borrowings WHERE status IN ('BORROWED', 'OVERDUE', 'EXTENDED'))`

#### BORROWINGS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| user_id | BIGINT | FK → USERS.id NOT NULL | Borrower |
| book_id | BIGINT | FK → BOOKS.id NOT NULL | |
| borrow_date | TIMESTAMP | NOT NULL | |
| due_date | TIMESTAMP | NOT NULL | borrow_date + loan_duration_days |
| return_date | TIMESTAMP | | Set on return |
| status | VARCHAR(20) | NOT NULL | BORROWED, RETURNED, OVERDUE, EXTENDED |
| extension_count | INT | NOT NULL DEFAULT 0 | How many times extended |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### RESERVATIONS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| user_id | BIGINT | FK → USERS.id NOT NULL | |
| book_id | BIGINT | FK → BOOKS.id NOT NULL | |
| reserve_date | TIMESTAMP | NOT NULL | |
| expiry_date | TIMESTAMP | NOT NULL | When the reservation expires if not fulfilled |
| fulfilled_date | TIMESTAMP | | Set when book returned and reservation activated |
| status | VARCHAR(20) | NOT NULL | PENDING, FULFILLED, CANCELLED, EXPIRED |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### FINES

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| borrowing_id | BIGINT | FK → BORROWINGS.id NOT NULL | |
| user_id | BIGINT | FK → USERS.id NOT NULL | Denormalized for easier queries |
| amount | DECIMAL(15,2) | NOT NULL | Total fine amount |
| daily_rate | DECIMAL(15,2) | NOT NULL | Rate per day at time of fine creation |
| days_overdue | INT | NOT NULL | Number of late days |
| paid | BOOLEAN | NOT NULL DEFAULT FALSE | |
| paid_date | TIMESTAMP | | When payment was recorded |
| created_date | TIMESTAMP | NOT NULL | |
| last_modified_date | TIMESTAMP | NOT NULL | |
| version | INT | NOT NULL DEFAULT 0 | |

#### NOTIFICATIONS

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | |
| uid | UUID | NOT NULL UNIQUE | |
| user_id | BIGINT | FK → USERS.id NOT NULL | |
| message | TEXT | NOT NULL | |
| type | VARCHAR(30) | NOT NULL | OVERDUE, RESERVATION_READY, RESERVATION_EXPIRED, GENERAL |
| is_read | BOOLEAN | NOT NULL DEFAULT FALSE | |
| created_date | TIMESTAMP | NOT NULL | |

#### BORROWING_CONFIG

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | BIGSERIAL | PK | Only one row (id=1) |
| max_books_per_user | INT | NOT NULL DEFAULT 3 | |
| loan_duration_days | INT | NOT NULL DEFAULT 14 | |
| extend_duration_days | INT | NOT NULL DEFAULT 7 | |
| max_extensions | INT | NOT NULL DEFAULT 1 | |
| fine_per_day_irt | DECIMAL(15,2) | NOT NULL DEFAULT 1000 | In Iranian Rials |

---

## 5. Roles & Permissions

| Operation | USER | LIBRARIAN | ADMIN |
|-----------|------|-----------|-------|
| Register, Login, Refresh token | ✅ | ✅ | ✅ |
| View own profile, edit own profile | ✅ | ✅ | ✅ |
| Search and view books | ✅ | ✅ | ✅ |
| Borrow a book (self) | ✅ | ✅ | ✅ |
| Extend own borrowing | ✅ | ✅ | ✅ |
| Reserve a book | ✅ | ✅ | ✅ |
| Cancel own reservation | ✅ | ✅ | ✅ |
| View own borrowings, reservations, fines | ✅ | ✅ | ✅ |
| View own notifications | ✅ | ✅ | ✅ |
| Return a book | ❌ | ✅ | ✅ |
| Borrow on behalf of a user | ❌ | ✅ | ✅ |
| View all users | ❌ | ✅ | ✅ |
| View all borrowings | ❌ | ✅ | ✅ |
| Manage books (add, edit) | ❌ | ✅ | ✅ |
| Manage locations (assigned sections only) | ❌ | ✅ (own) | ✅ (all) |
| Create & manage fines | ❌ | ✅ | ✅ |
| Send notifications | ❌ | ✅ | ✅ |
| Delete a book | ❌ | ❌ | ✅ |
| Change user roles | ❌ | ❌ | ✅ |
| Assign librarians to locations | ❌ | ❌ | ✅ |
| Update borrowing config | ❌ | ❌ | ✅ |
| Delete locations (hall, bookshelf, shelf) | ❌ | ❌ | ✅ |

### Librarian Location Scoping

A LIBRARIAN assigned to a hall can manage all bookshelves and shelves within it.
A LIBRARIAN assigned to a specific bookshelf can manage only that bookshelf and its shelves.
A LIBRARIAN assigned to a specific shelf can manage only that shelf.
A LIBRARIAN can be assigned to multiple locations.

---

## 6. REST API Design

### 6.1 Authentication — Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user (default role: USER) |
| `POST` | `/api/auth/login` | Login → returns access + refresh tokens |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/logout` | Revoke refresh token |

### 6.2 Users

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/users/me` | All | Current user profile |
| `PUT` | `/api/users/me` | All | Update own profile |
| `GET` | `/api/users` | LIBRARIAN, ADMIN | Paginated user list |
| `GET` | `/api/users/{id}` | LIBRARIAN, ADMIN | View a user |
| `PUT` | `/api/users/{id}/role` | ADMIN | Change user role |

### 6.3 Books

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/books` | All | Search/paginate books (filters: title, author, isbn, location) |
| `GET` | `/api/books/{id}` | All | Book detail + available copies count |
| `POST` | `/api/books` | LIBRARIAN, ADMIN | Add a book |
| `PUT` | `/api/books/{id}` | LIBRARIAN, ADMIN | Update a book |
| `DELETE` | `/api/books/{id}` | ADMIN | Delete a book |

### 6.4 Locations

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/halls` | LIBRARIAN, ADMIN | List all halls |
| `POST` | `/api/halls` | ADMIN | Create hall (optionally assign librarian) |
| `PUT` | `/api/halls/{id}` | ADMIN | Update hall |
| `DELETE` | `/api/halls/{id}` | ADMIN | Delete hall (cascade; blocks if shelves contain books) |
| `GET` | `/api/halls/{id}/bookshelves` | LIBRARIAN, ADMIN | Bookshelves in a hall |
| `POST` | `/api/halls/{id}/bookshelves` | ADMIN | Add bookshelf to hall |
| `PUT` | `/api/bookshelves/{id}` | LIBRARIAN*, ADMIN | Update bookshelf (*assigned librarian) |
| `DELETE` | `/api/bookshelves/{id}` | ADMIN | Delete bookshelf |
| `GET` | `/api/bookshelves/{id}/shelves` | LIBRARIAN, ADMIN | Shelves in a bookshelf |
| `POST` | `/api/bookshelves/{id}/shelves` | LIBRARIAN*, ADMIN | Add shelf to bookshelf |
| `PUT` | `/api/shelves/{id}` | LIBRARIAN*, ADMIN | Update shelf |
| `DELETE` | `/api/shelves/{id}` | ADMIN | Delete shelf (blocks if contains books) |
| `PUT` | `/api/halls/{id}/librarian` | ADMIN | Assign librarian to hall |
| `PUT` | `/api/bookshelves/{id}/librarian` | ADMIN | Assign librarian to bookshelf |
| `PUT` | `/api/shelves/{id}/librarian` | ADMIN | Assign librarian to shelf |

### 6.5 Borrowing

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/borrowings` | All | Borrow a book (userId=caller for USER; selectable for LIBRARIAN/ADMIN) |
| `GET` | `/api/borrowings` | All | List borrowings (USER: own; LIBRARIAN/ADMIN: all, filterable by user/status) |
| `GET` | `/api/borrowings/{id}` | All | Borrowing detail |
| `POST` | `/api/borrowings/{id}/return` | LIBRARIAN, ADMIN | Return a book (auto-calculates fine if overdue) |
| `POST` | `/api/borrowings/{id}/extend` | All | Extend borrowing (USER: own; LIBRARIAN/ADMIN: any) |
| `GET` | `/api/borrowings/overdue` | LIBRARIAN, ADMIN | List all overdue borrowings |

### 6.6 Reservations

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `POST` | `/api/reservations` | All | Reserve a book (only when no copies available) |
| `GET` | `/api/reservations` | All | List reservations (USER: own; LIBRARIAN/ADMIN: all) |
| `POST` | `/api/reservations/{id}/cancel` | All | Cancel own reservation (USER: own; LIBRARIAN/ADMIN: any) |

### 6.7 Fines

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/fines` | All | List fines (USER: own; LIBRARIAN/ADMIN: all, filterable) |
| `GET` | `/api/fines/{id}` | All | Fine detail |
| `POST` | `/api/fines/{id}/pay` | LIBRARIAN, ADMIN | Record fine payment |

### 6.8 Notifications

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/notifications` | All | User's notifications (paginated, newest first) |
| `PUT` | `/api/notifications/{id}/read` | All | Mark as read |
| `POST` | `/api/notifications` | LIBRARIAN, ADMIN | Send manual notification |

### 6.9 Configuration

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/config/borrowing` | All | Get current borrowing config |
| `PUT` | `/api/config/borrowing` | ADMIN | Update borrowing config |

---

## 7. Standard Error Response Format

### Generic Error

```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Book not found with id: 42",
  "timestamp": "2026-07-12T14:30:00",
  "path": "/api/books/42"
}
```

### Validation Error (400)

```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "Invalid request",
  "errors": {
    "title": "book.error.title.required",
    "isbn": "book.error.isbn.invalid"
  }
}
```

---

## 8. Edge Cases & Business Rules

| # | Scenario | Behavior |
|---|----------|----------|
| 1 | Borrow book with zero available copies | 400 — "No copies available" |
| 2 | Borrow when at max limit (3 books) | 400 — "Borrowing limit reached" |
| 3 | Borrow a book the user has reserved | Reservation → FULFILLED, borrow proceeds |
| 4 | Borrow a book reserved by another user | Other reservation stays PENDING; first-come borrowing wins |
| 5 | Extend more than max_extensions times | 400 — "Extension limit reached" |
| 6 | Extend an overdue book | 400 — "Please return first" |
| 7 | Reserve a book that is available | 400 — "Book is available; borrow it instead" |
| 8 | Return an overdue book | Fine auto-calculated: `days_late × fine_per_day_irt` |
| 9 | Delete hall/bookshelf/shelf that contains books | 400 — "Cannot delete: shelves contain books" |
| 10 | Delete a currently-borrowed book | 400 — "Cannot delete: book is currently borrowed" |
| 11 | Remove last ADMIN role | 400 — "Cannot remove the last admin" |
| 12 | Refresh token expired | 401 — force re-login |
| 13 | Reservation not borrowed within 24h of FULFILLED | Scheduled job → EXPIRED; next reservation (if any) notified |
| 14 | Same librarian assigned to multiple locations | Allowed |

---

## 9. Scheduled Tasks

| Job | Schedule | Action |
|-----|----------|--------|
| **Overdue Checker** | Daily at 08:00 | BORROWED/EXTENDED past `due_date` → OVERDUE, create notification |
| **Reservation Expiry** | Hourly | PENDING past `expiry_date` → EXPIRED |
| **Fulfilled Reservation Expiry** | Hourly | FULFILLED past 24h without borrow → EXPIRED, notify next in queue |

---

## 10. Frontend Route & Menu Design

### Routes (lazy-loaded)

```
/login                        — public
/register                     — public
/                             — main layout shell (auth required)
  /books                      — book search & list (all roles)
  /books/new                  — add book (LIBRARIAN, ADMIN)
  /books/:id                  — book detail (all roles)
  /books/:id/edit             — edit book (LIBRARIAN, ADMIN)
  /locations                  — location tree manager (LIBRARIAN, ADMIN)
  /borrowings                 — my borrowings (all roles)
  /borrowings/all             — all borrowings (LIBRARIAN, ADMIN)
  /borrowings/overdue         — overdue list (LIBRARIAN, ADMIN)
  /fines                      — my fines (all roles)
  /fines/all                  — all fines (LIBRARIAN, ADMIN)
  /reservations               — my reservations (all roles)
  /reservations/all           — all reservations (LIBRARIAN, ADMIN)
  /users                      — user list (LIBRARIAN, ADMIN)
  /users/:id                  — user detail (LIBRARIAN, ADMIN)
  /profile                    — my profile (all roles)
  /notifications              — my notifications (all roles)
  /admin/roles                — role management (ADMIN)
  /admin/config               — borrowing config (ADMIN)
```

### Sidebar by Role

```
USER                       LIBRARIAN                       ADMIN
├── Search Books           ├── Search Books                ├── Search Books
├── My Borrowings          ├── Manage Books                ├── Manage Books
├── My Reservations        ├── All Borrowings              ├── All Borrowings
├── My Fines               ├── Return Book                 ├── Return Book
├── Notifications          ├── Fines                       ├── Fines
├── Profile                ├── Locations (my sections)     ├── All Locations
                           ├── Users                       ├── Users
                           ├── Reservations                ├── Reservations
                           ├── Notifications               ├── Role Management
                           ├── Profile                     ├── System Config
                                                           ├── Notifications
                                                           ├── Profile
```

---

## 11. Testing Strategy

| Layer | Tool | Scope |
|-------|------|-------|
| Backend service unit | JUnit 5 + Mockito | Services with mocked repositories |
| Backend integration | @SpringBootTest + H2 | Controllers → Services → Repositories (full slice) |
| Backend security | @SpringBootTest + @WithMockUser | Authorization rules per role |
| Frontend unit | Jasmine + Karma | Components and services |
| Frontend e2e | Cypress (optional) | Critical flows (login → borrow → return) |

---

## 12. Implementation Order (Recommended)

1. **Backend foundation:** Project scaffolding, Spring Security + JWT, user entity + auth endpoints
2. **Database:** Full Liquibase migration (all tables)
3. **Location management:** Halls → Bookshelves → Shelves CRUD, librarian assignment
4. **Book management:** Book CRUD, search, location assignment
5. **Borrowing flows:** Borrow, return, extend, due-date tracking
6. **Reservations:** Reserve, cancel, scheduled expiry
7. **Fines:** Auto-calculation on return, payment recording
8. **Notifications:** Scheduled overdue reminders, reservation alerts
9. **Borrowing config:** Config table, admin config endpoint
10. **Frontend:** In parallel with backend, starting with auth + layout, then feature by feature
