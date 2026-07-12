-- liquibase formatted sql

-- changeset library:002-seed-borrowing-config
INSERT INTO PUBLIC.BORROWING_CONFIG (ID, MAX_BOOKS_PER_USER, LOAN_DURATION_DAYS, EXTEND_DURATION_DAYS, MAX_EXTENSIONS, FINE_PER_DAY_IRT)
VALUES (1, 3, 14, 7, 1, 1000.00)
ON CONFLICT (ID) DO NOTHING;

-- ============================================================
-- Changeset 2: Seed admin user
-- Password: BCrypt hash of 'admin123'
-- Email: admin@library.com
-- Role: ADMIN
-- ============================================================
-- changeset library:013-seed-admin-user
INSERT INTO PUBLIC.USERS (ID, UID, USERNAME, PASSWORD, EMAIL, FIRST_NAME, LAST_NAME, ROLE, ENABLED, CREATED_DATE, LAST_MODIFIED_DATE, VERSION)
VALUES (
    1,
    GEN_RANDOM_UUID(),
    'admin',
    '$2a$12$LJ3m4ys3Mpv3mK0A3t4Gc.xP9X8tFQzRQeQHvNq5NqGqkN6nC6iCe',
    'admin@library.com',
    'Admin',
    'User',
    'ADMIN',
    TRUE,
    LOCALTIMESTAMP,
    LOCALTIMESTAMP,
    0
)
ON CONFLICT (ID) DO NOTHING;
