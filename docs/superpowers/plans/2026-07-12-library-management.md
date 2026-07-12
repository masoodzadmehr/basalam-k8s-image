# Library Management System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete library management system with JWT-authenticated Spring Boot backend, Angular 21 frontend, and PostgreSQL database.

**Architecture:** Monolithic Spring Boot 3.5 backend with package-by-feature structure, Angular 21 standalone-components frontend with lazy-loaded feature routes, and PostgreSQL 16 with Liquibase migrations.

**Tech Stack:** Java 21, Spring Boot 3.5.x, Spring Security 6, jjwt, Spring Data JPA/Hibernate, Liquibase, PostgreSQL 16, H2 (tests), JUnit 5, Mockito, Angular 21, Angular Material 3, Docker Compose.

**Spec reference:** `docs/superpowers/specs/2026-07-12-library-management-design.md`

## Global Constraints

- Java 21, no deprecated APIs
- Spring Boot 3.5.x, Spring Security 6 — stateless JWT
- PostgreSQL 16 dialect; H2 in PostgreSQL mode for tests
- JWT with access token (15 min) + refresh token (7 days)
- BCrypt password encoding
- All DTOs use Jakarta Bean Validation with `@Valid` on controllers
- Error responses use the standard `{status, error, message, timestamp, path}` format
- All test classes end in `*Test.java`; integration tests use `@SpringBootTest` + H2
- No wildcard imports; IntelliJ default formatting
- Liquibase changesets in `src/main/resources/db/changelog/`
- Frontend uses standalone components, lazy loading, Signals + RxJS
- Angular Material 3 for UI components

---

## Phase 1: Backend Foundation (Tasks 1-9)

### Task 1: Project Scaffolding & Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `backend/pom.xml`
- Create: `backend/src/main/java/com/library/LibraryApplication.java`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/resources/application-dev.yml`
- Create: `backend/src/test/resources/application-test.yml`
- Create: `backend/src/test/java/com/library/LibraryApplicationTests.java`

**Interfaces:**
- Produces: `LibraryApplication` main class with `@SpringBootApplication` + `@EnableScheduling`
- Produces: `pom.xml` with dependencies: spring-boot-starter-web, data-jpa, security, validation, actuator, liquibase-core, postgresql, jjwt (api, impl, jackson), springdoc-openapi 2.8.0, lombok, spring-boot-starter-test, spring-security-test, h2
- Produces: `docker-compose.yml` with postgres:16-alpine on port 5432 (db: library, user: library, pass: library123)

Subagent prompt for this task:

```
Create the project scaffolding for the Library Management System at /data/gitProject/basalam-k8s-image/.

1. Create docker-compose.yml with postgres:16-alpine, database "library", user "library", password "library123", port 5432
2. Create backend/pom.xml as a Spring Boot 3.5.0 Maven project (groupId: com.library, artifactId: library-management) with these dependencies:
   - spring-boot-starter-web, data-jpa, security, validation, actuator
   - liquibase-core, postgresql (runtime), h2 (test)
   - jjwt-api 0.12.6, jjwt-impl (runtime), jjwt-jackson (runtime)
   - springdoc-openapi-starter-webmvc-ui 2.8.0
   - lombok (optional)
   - spring-boot-starter-test, spring-security-test (test)
   - Java 21
3. Create backend/src/main/java/com/library/LibraryApplication.java:
   - @SpringBootApplication + @EnableScheduling, main method
4. Create application.yml: app name library-management, profiles.active: dev, server.port: 8080
5. Create application-dev.yml:
   - datasource: jdbc:postgresql://localhost:5432/library, user/pass: library/library123
   - jpa: hibernate ddl-auto: validate, open-in-view: false, dialect: PostgreSQLDialect, format_sql:true, show-sql:false
   - liquibase: change-log: classpath:db/changelog/db.changelog-master.yaml
   - jwt.access-token.secret: "dGhpcy1pcy1hLXZlcnktbG9uZy1zZWNyZXQta2V5LWZvci1hY2Nlc3MtdG9rZW4tYW5kLWl0LW5lZWRzLXRvLWJlLWxvbmctZW5vdWdo", expiration-ms: 900000
   - jwt.refresh-token.secret: "cmVmcmVzaC10b2tlbi1zZWNyZXQta2V5LWZvci1saWJyYXJ5LW1hbmFnZW1lbnQtc3lzdGVtLXRoaXMtaXMtdmVyeS1sb25nLXNlY3JldA==", expiration-ms: 604800000
   - logging.level.com.library: DEBUG
6. Create application-test.yml:
   - H2 datasource: jdbc:h2:mem:library_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DEFAULT_NULL_ORDERING=HIGH
   - jpa ddl-auto: create-drop, H2 dialect, show-sql: true
   - liquibase.enabled: false
   - Same JWT config
7. Create LibraryApplicationTests.java with @SpringBootTest contextLoads() test
8. Create all needed directories (mkdir -p)
9. Run: cd backend && mvn test - verify contextLoads passes
```

---

### Task 2: Database Migration — All Tables

**Files:**
- Create: `backend/src/main/resources/db/changelog/db.changelog-master.yaml`
- Create: `backend/src/main/resources/db/changelog/changelogs/001-create-tables.sql`
- Create: `backend/src/main/resources/db/changelog/changelogs/002-seed-config.sql`

**Spec reference:** Design spec section 4.2 (all 11 table definitions)

Subagent prompt: "Create the Liquibase migration for the Library Management System. Create db.changelog-master.yaml that includes two changelog files. Create 001-create-tables.sql with ALL 11 tables: users, refresh_tokens, halls, bookshelves, shelves, books, borrowings, reservations, fines, notifications, borrowing_config. Follow the exact column definitions, types, and constraints from the design spec section 4.2. Follow database-keys-naming conventions: PK_TABLE, FK_CHILD_PARENT, UK_TABLE, IDX_TABLE_COLUMN. Use CREATE UNIQUE INDEX IF NOT EXISTS for unique constraints. All indexes use IF NOT EXISTS. Create 002-seed-config.sql that inserts default borrowing_config (id=1, max_books=3, loan_duration=14, extend_duration=7, max_extensions=1, fine_per_day=1000.00) and an admin user (username: admin, password: '$2a$12$LJ3m4ys3Mpv3mK0A3t4Gc.xP9X8tFQzRQeQHvNq5NqGqkN6nC6iCe' which is BCrypt for 'admin123', email: admin@library.com, role: ADMIN). Use gen_random_uuid() for uid column defaults. Verify the migration by starting the docker postgres and running mvn spring-boot:run."

---

### Task 3: Common Module — BaseEntity, Exceptions, GlobalExceptionHandler

**Files:**
- Create: `backend/src/main/java/com/library/common/entity/BaseEntity.java`
- Create: `backend/src/main/java/com/library/common/exception/ResourceNotFoundException.java`
- Create: `backend/src/main/java/com/library/common/exception/BusinessException.java`
- Create: `backend/src/main/java/com/library/common/exception/ErrorResponse.java`
- Create: `backend/src/main/java/com/library/common/exception/GlobalExceptionHandler.java`

**Interfaces:**
- Consumes: nothing (foundation layer)
- Produces:
  - `BaseEntity` — `@MappedSuperclass` with id (Long, IDENTITY), uid (UUID, auto-generated), createdDate, lastModifiedDate (LocalDateTime), version (int, @Version). Getter/setter for each.
  - `ResourceNotFoundException(String resource, Object id)` — RuntimeException
  - `BusinessException(String message)` — RuntimeException
  - `ErrorResponse(int status, String error, String message, String path, Map<String,String> errors)` — record with nullable `errors`
  - `GlobalExceptionHandler` — `@RestControllerAdvice` handling: ResourceNotFoundException→404, BusinessException→400, BadCredentialsException→401, AccessDeniedException→403, MethodArgumentNotValidException→400 with field errors map, Exception→500

Subagent prompt: "Create the common/base module for the Spring Boot backend at /data/gitProject/basalam-k8s-image/backend/. Create BaseEntity as a @MappedSuperclass with ID, UID, createdDate, lastModifiedDate, version fields matching the database columns. Create ResourceNotFoundException and BusinessException. Create ErrorResponse record with factory methods. Create GlobalExceptionHandler @RestControllerAdvice that maps exceptions to the ErrorResponse format: {status, error, message, timestamp, path}. Map ResourceNotFoundException to 404, BusinessException to 400, BadCredentialsException to 401, AccessDeniedException to 403, MethodArgumentNotValidException to 400 with field errors, generic Exception to 500. Use jakarta.servlet.http.HttpServletRequest for the path. All imports must be individual (no wildcards). Run mvn compile to verify."

---

### Task 4: JWT Configuration & Spring Security

**Files:**
- Create: `backend/src/main/java/com/library/config/JwtProperties.java`
- Create: `backend/src/main/java/com/library/config/JwtTokenProvider.java`
- Create: `backend/src/main/java/com/library/config/JwtAuthenticationFilter.java`
- Create: `backend/src/main/java/com/library/config/SecurityConfig.java`

Subagent prompt: "Create JWT and Spring Security configuration for the library backend at /data/gitProject/basalam-k8s-image/backend/. 

1. JwtProperties.java: @ConfigurationProperties(prefix='jwt') with nested AccessToken (secret, expirationMs) and RefreshToken (secret, expirationMs) classes.

2. JwtTokenProvider.java: @Component that generates access tokens (with 'sub' = username, 'role' claim) and refresh tokens (with random jti). Uses HMAC-SHA keys from Base64-decoded secrets. Methods: generateAccessToken(username, role) → String, generateRefreshToken() → String, validateAccessToken(token) → boolean, validateRefreshToken(token) → boolean, getUsernameFromToken(token) → String, getRoleFromToken(token) → String, getTokenId(token) → String, isTokenExpired(token) → boolean, getAccessTokenExpirationMs() → long, getRefreshTokenExpirationMs() → long. Handle ExpiredJwtException in validateAccessToken (return false, don't throw).

3. JwtAuthenticationFilter.java: OncePerRequestFilter that extracts Bearer token from Authorization header, validates it, and sets SecurityContextHolder with UsernamePasswordAuthenticationToken (username as principal, null credentials, SimpleGrantedAuthority with 'ROLE_' + role).

4. SecurityConfig.java: @Configuration @EnableWebSecurity @EnableMethodSecurity. Stateless session, CSRF disabled. Permit /api/auth/**, /api-docs/**, /swagger-ui/**, /actuator/health. All other requests authenticated. Add JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter. CORS allowed from http://localhost:4200. BCryptPasswordEncoder bean. AuthenticationManager bean.

Run mvn compile to verify."

---

### Task 5: Auth Entities & Repositories

**Files:**
- Create: `backend/src/main/java/com/library/user/User.java`
- Create: `backend/src/main/java/com/library/user/UserRepository.java`
- Create: `backend/src/main/java/com/library/auth/RefreshToken.java`
- Create: `backend/src/main/java/com/library/auth/RefreshTokenRepository.java`

**Interfaces:**
- Consumes: `BaseEntity` from Task 3
- Produces:
  - `User extends BaseEntity` with fields: username (unique), password, email (unique), firstName, lastName, mobile, role (enum: USER, LIBRARIAN, ADMIN), enabled (boolean, default true). Maps to `users` table.
  - `UserRepository extends JpaRepository<User, Long>` with: findByUsername, findByEmail, findByUid, existsByUsername, existsByEmail, existsByRole(Role)
  - `RefreshToken` entity (not extending BaseEntity): id (IDENTITY), token (unique), userId, expiryDate (LocalDateTime), revoked (boolean)
  - `RefreshTokenRepository extends JpaRepository<RefreshToken, Long>` with: findByToken, @Modifying @Query deleteByUserId

Subagent prompt: detailed in plan (follow spec section 4.2 table definitions)

---

### Task 6: Auth DTOs

**Files:**
- Create: `backend/src/main/java/com/library/auth/dto/LoginRequest.java`
- Create: `backend/src/main/java/com/library/auth/dto/RegisterRequest.java`
- Create: `backend/src/main/java/com/library/auth/dto/TokenResponse.java`
- Create: `backend/src/main/java/com/library/auth/dto/RefreshTokenRequest.java`

Subagent prompt: "Create auth DTOs as Java records with Jakarta validation. LoginRequest(username @NotBlank, password @NotBlank). RegisterRequest(username @NotBlank @Size(3,50), password @NotBlank @Size(6,100), email @NotBlank @Email, firstName @NotBlank @Size(max=100), lastName @NotBlank @Size(max=100), mobile @Size(max=20)). TokenResponse(access_token, refresh_token, token_type, expires_in, role, username, email) with static factory method of(). RefreshTokenRequest(refresh_token @NotBlank). All message attributes use keys like auth.error.username.required. Run mvn compile."

---

### Task 7: Auth Service

**Files:**
- Create: `backend/src/main/java/com/library/auth/CustomUserDetailsService.java`
- Create: `backend/src/main/java/com/library/auth/AuthService.java`

Subagent prompt: "Create the auth service layer. 

CustomUserDetailsService implements UserDetailsService — loadUserByUsername looks up User by username from UserRepository, builds Spring Security User with username, password, ROLE_<role> authority, disabled status.

AuthService (@Service @Transactional):
- register(RegisterRequest): check username/email uniqueness, create User with BCrypt encoded password, role=USER, call generateTokens
- login(LoginRequest): use AuthenticationManager.authenticate, on success lookup user and generateTokens, on failure throw BadCredentialsException
- refreshToken(RefreshTokenRequest): hash the raw token with SHA-256, find stored RefreshToken, check not revoked and not expired, revoke old token, generate new tokens
- logout(rawToken): hash and revoke if found
- private generateTokens(User): create access token + raw refresh token, hash refresh token before storing, save RefreshToken entity with userId and expiry, return TokenResponse
- private hashToken(String): SHA-256 hex encoded

Run mvn compile to verify."

---

### Task 8: Auth Controller

**Files:**
- Create: `backend/src/main/java/com/library/auth/AuthController.java`

Subagent prompt: "Create AuthController with endpoints: POST /api/auth/register (returns 201, @Valid RegisterRequest), POST /api/auth/login (returns 200, @Valid LoginRequest), POST /api/auth/refresh (returns 200, @Valid RefreshTokenRequest), POST /api/auth/logout (extracts token from Authorization header, returns {message: 'Logged out successfully'}). Run mvn compile."

---

### Task 9: Auth Integration Test

**Files:**
- Create: `backend/src/test/java/com/library/auth/AuthIntegrationTest.java`

Subagent prompt: "Create AuthIntegrationTest.java using @SpringBootTest, @AutoConfigureMockMvc, @ActiveProfiles('test'), @Transactional. Test cases: 1) register creates user and returns tokens, 2) register duplicate username returns 400, 3) login with valid credentials returns tokens, 4) login with bad credentials returns 401, 5) refresh token returns new tokens (login first, use refresh token from response). Use MockMvc, ObjectMapper, and AssertJ. Each test clears userRepository in @BeforeEach. Run: mvn test -Dtest=AuthIntegrationTest - verify all pass."

---

## Phase 2: Business Domain (Tasks 10-22)

### Task 10: Location Entities & Repositories

**Files:**
- Create: `backend/src/main/java/com/library/location/Hall.java`
- Create: `backend/src/main/java/com/library/location/Bookshelf.java`
- Create: `backend/src/main/java/com/library/location/Shelf.java`
- Create: `backend/src/main/java/com/library/location/HallRepository.java`
- Create: `backend/src/main/java/com/library/location/BookshelfRepository.java`
- Create: `backend/src/main/java/com/library/location/ShelfRepository.java`

Spec ref: Design spec section 4.2 (HALLS, BOOKSHELVES, SHELVES tables)

### Task 11: Location DTOs, Service

**Files:**
- Create: `backend/src/main/java/com/library/location/dto/LocationRequest.java`
- Create: `backend/src/main/java/com/library/location/dto/LocationResponse.java`
- Create: `backend/src/main/java/com/library/location/dto/AssignLibrarianRequest.java`
- Create: `backend/src/main/java/com/library/location/LocationService.java`

### Task 12: Location Controller

**Files:**
- Create: `backend/src/main/java/com/library/location/LocationController.java`

16 endpoints matching spec section 6.4.

### Task 13: Book Entity, Repository, DTOs

**Files:**
- Create: `backend/src/main/java/com/library/book/Book.java`
- Create: `backend/src/main/java/com/library/book/BookRepository.java`
- Create: `backend/src/main/java/com/library/book/dto/BookRequest.java`
- Create: `backend/src/main/java/com/library/book/dto/BookResponse.java`

### Task 14: Book Service & Controller

**Files:**
- Create: `backend/src/main/java/com/library/book/BookService.java`
- Create: `backend/src/main/java/com/library/book/BookController.java`

### Task 15: Borrowing Entity, Repository, DTOs, Config

**Files:**
- Create: `backend/src/main/java/com/library/borrowing/Borrowing.java`
- Create: `backend/src/main/java/com/library/borrowing/BorrowingRepository.java`
- Create: `backend/src/main/java/com/library/borrowing/BorrowingConfig.java`
- Create: `backend/src/main/java/com/library/borrowing/BorrowingConfigRepository.java`
- Create: `backend/src/main/java/com/library/borrowing/dto/BorrowRequest.java`
- Create: `backend/src/main/java/com/library/borrowing/dto/BorrowingResponse.java`

### Task 16: Borrowing Service & Controller

**Files:**
- Create: `backend/src/main/java/com/library/borrowing/BorrowingService.java`
- Create: `backend/src/main/java/com/library/borrowing/BorrowingController.java`

### Task 17: Reservation Entity, Repository, DTOs, Service, Controller

**Files:**
- Create: `backend/src/main/java/com/library/reservation/Reservation.java`
- Create: `backend/src/main/java/com/library/reservation/ReservationRepository.java`
- Create: `backend/src/main/java/com/library/reservation/dto/ReservationRequest.java`
- Create: `backend/src/main/java/com/library/reservation/dto/ReservationResponse.java`
- Create: `backend/src/main/java/com/library/reservation/ReservationService.java`
- Create: `backend/src/main/java/com/library/reservation/ReservationController.java`

### Task 18: Fine Entity, Repository, Service, Controller

**Files:**
- Create: `backend/src/main/java/com/library/fine/Fine.java`
- Create: `backend/src/main/java/com/library/fine/FineRepository.java`
- Create: `backend/src/main/java/com/library/fine/dto/FineResponse.java`
- Create: `backend/src/main/java/com/library/fine/FineService.java`
- Create: `backend/src/main/java/com/library/fine/FineController.java`

### Task 19: Notification Entity, Repository, Service, Controller

**Files:**
- Create: `backend/src/main/java/com/library/notification/Notification.java`
- Create: `backend/src/main/java/com/library/notification/NotificationRepository.java`
- Create: `backend/src/main/java/com/library/notification/NotificationType.java`
- Create: `backend/src/main/java/com/library/notification/NotificationService.java`
- Create: `backend/src/main/java/com/library/notification/NotificationController.java`

### Task 20: User Service & Controller

**Files:**
- Create: `backend/src/main/java/com/library/user/dto/UserResponse.java`
- Create: `backend/src/main/java/com/library/user/dto/UpdateProfileRequest.java`
- Create: `backend/src/main/java/com/library/user/dto/UpdateRoleRequest.java`
- Create: `backend/src/main/java/com/library/user/UserService.java`
- Create: `backend/src/main/java/com/library/user/UserController.java`

### Task 21: Configuration Controller

**Files:**
- Create: `backend/src/main/java/com/library/config/BorrowingConfigController.java`
- Create: `backend/src/main/java/com/library/config/dto/BorrowingConfigResponse.java`
- Create: `backend/src/main/java/com/library/config/dto/BorrowingConfigUpdateRequest.java`

### Task 22: Scheduled Tasks

**Files:**
- Create: `backend/src/main/java/com/library/config/ScheduledTasks.java`

## Phase 3: Integration Tests (Task 23)

### Task 23: Backend Integration Tests

**Files:**
- Create: `backend/src/test/java/com/library/book/BookIntegrationTest.java`
- Create: `backend/src/test/java/com/library/borrowing/BorrowingIntegrationTest.java`
- Create: `backend/src/test/java/com/library/location/LocationIntegrationTest.java`

## Phase 4: Angular Frontend (Tasks 24-27)

### Task 24: Angular Project Scaffolding

**Files:** All files under `frontend/` via `ng new`
- Angular 21 project with standalone components, routing, SCSS
- Angular Material 3 setup
- Core folder structure per spec section 3

### Task 25: Angular Core — Auth, Guards, Interceptors, Layout

**Files:**
- `frontend/src/app/core/models/*.ts` — User, Book, Borrowing, Reservation, Fine, Notification, Location, Config interfaces
- `frontend/src/app/core/services/auth.service.ts` — login, register, refresh, logout, isLoggedIn, getCurrentUser signals
- `frontend/src/app/core/services/api.service.ts` — base HTTP service with JWT header
- `frontend/src/app/core/guards/auth.guard.ts` — redirect to /login if not authenticated
- `frontend/src/app/core/guards/role.guard.ts` — check role from JWT, redirect to /books if insufficient
- `frontend/src/app/core/interceptors/auth.interceptor.ts` — add Bearer token from localStorage
- `frontend/src/app/core/interceptors/error.interceptor.ts` — catch 401 → redirect to login
- `frontend/src/app/layout/main-layout/` — sidebar + navbar + router-outlet
- `frontend/src/app/app.routes.ts` — all routes with lazy loading and role data

### Task 26: Angular Auth — Login & Register Pages

**Files:**
- `frontend/src/app/features/auth/login/` — login component with form, error display
- `frontend/src/app/features/auth/register/` — register component with form

### Task 27: Angular Feature Pages

**Files (one set per task, can run in parallel):**
- `frontend/src/app/features/books/` — book-list, book-detail, book-form
- `frontend/src/app/features/borrowings/` — my-borrowings, all-borrowings, return-book
- `frontend/src/app/features/reservations/` — my-reservations
- `frontend/src/app/features/fines/` — my-fines
- `frontend/src/app/features/locations/` — location-tree
- `frontend/src/app/features/users/` — user-list, user-profile
- `frontend/src/app/features/admin/` — role-management, system-config
- `frontend/src/app/features/notifications/` — notification-list

## Phase 5: Final Integration (Task 28)

### Task 28: Docker Compose Full Stack

**Files:**
- Modify: `docker-compose.yml` — add backend and frontend services
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`

---

## Task Execution Detail

Each task above should be executed by dispatching a subagent with:
1. The task specification from this plan
2. The design spec at `docs/superpowers/specs/2026-07-12-library-management-design.md` as reference
3. The project rules for code quality, formatting, imports, naming, and validation

The subagent creates all files, verifies `mvn compile` passes, and reports back.

**For a complete implementation of each task including all code details**, refer to the design spec and implement following Fixa code conventions (IntelliJ formatting, no wildcard imports, K&R braces, 4-space indent, English comments, Jakarta validation annotations on all DTOs with message keys).
