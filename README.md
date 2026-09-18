# Access Control Module - Backend

System Administration, Security & Access Control module for the SLIIT
Vehicle Rental Service group project.

## Stack
- Java 17, Spring Boot 3.2.5
- Spring Security + JJWT (JWT auth)
- Spring Data JPA + MySQL
- Spring Mail (email OTP for MFA)
- AspectJ (cross-cutting `@RequiresPermission` enforcement)

## Setup (IntelliJ + XAMPP/MySQL Workbench)

1. **Start MySQL** (via XAMPP control panel, or your local MySQL service).

2. **Create the schema.** In MySQL Workbench, open and run
   `database/schema.sql`. This creates the `vehicle_rental_db` database,
   all tables, seed roles/permissions, a default admin account, and the
   audit-log immutability triggers.

   > Default admin login: `admin@vehiclerental.local` / `Admin@12345`
   > (forced password change on first login — `mustChangePassword=true`).

3. **Open the project in IntelliJ**: File → Open → select the `backend`
   folder (the one with `pom.xml`). Let Maven download dependencies.

4. **Configure `src/main/resources/application.properties`:**
   - `spring.datasource.username` / `password` — your MySQL credentials
   - `app.jwt.secret` — generate one: `openssl rand -base64 32`
   - `spring.mail.username` / `password` — a real mailbox for OTP emails
     (Gmail: use an **App Password**, not your normal password)
   - `app.backup.mysqldump-path` — full path to `mysqldump.exe` if it's
     not on your system PATH (typical XAMPP path on Windows:
     `C:/xampp/mysql/bin/mysqldump.exe`)
   - `app.backup.db-user` / `db-password` — same MySQL creds as above

5. **Run** `AccessControlApplication.java`. Server starts on port `8080`.

## Key architectural notes for the team

- **RBAC:** roles are fixed (`RoleName` enum), permissions are toggleable
  per role via the `role_permissions` join table. Admin manages this
  through `RoleController` / `PUT /api/roles/{id}/permissions`.
- **Cross-cutting enforcement:** any method anywhere in the merged system
  can be gated with `@RequiresPermission("SOME_CODE")` — `PermissionAspect`
  intercepts it and throws `AccessDeniedException` (→ HTTP 403) if the
  caller's role lacks that permission. Teammates don't need to know how
  RBAC works internally to use it.
- **Audit trail:** `AuditLogService.log(...)` is the *only* write path into
  `audit_logs`. No update/delete method exists in code, and the DB has
  `BEFORE UPDATE` / `BEFORE DELETE` triggers that hard-abort any attempt at
  the SQL level too. **Call `auditLogService.log(...)` from your own module
  after any critical action** (booking created, payment processed, etc.)
  so it lands in the same trail.
- **MFA:** real email OTP. `AuthService.login()` returns
  `{ mfaRequired: true }` with no token if the account has MFA enabled;
  frontend then calls `/api/auth/verify-otp` to get the actual JWT.
- **Backups:** `BackupScheduler` runs `mysqldump` nightly (cron configurable),
  logs each run to `backup_status`. `IT_SECURITY`/`SYSTEM_ADMIN` can also
  trigger one on demand via `POST /api/backups/run`.
- **Soft-delete only:** `DEACTIVATE_USER` flips `status` to `DEACTIVATED`;
  no user row is ever physically deleted.

## API surface

| Endpoint | Method | Permission required |
|---|---|---|
| `/api/auth/login` | POST | none |
| `/api/auth/verify-otp` | POST | none |
| `/api/users` | GET | VIEW_USERS |
| `/api/users` | POST | CREATE_USER |
| `/api/users/{id}` | PUT | UPDATE_USER |
| `/api/users/{id}/deactivate` \| `/reactivate` | PATCH | DEACTIVATE_USER |
| `/api/users/{id}/reset-password` | POST | RESET_USER_PASSWORD |
| `/api/users/me` | GET | (self) |
| `/api/users/me/change-password` | POST | (self) |
| `/api/roles` | GET | VIEW_ROLES |
| `/api/roles/{id}/permissions` | PUT | MANAGE_ROLE_PERMISSIONS |
| `/api/audit-logs` | GET | VIEW_AUDIT_LOG |
| `/api/backups` | GET | VIEW_BACKUP_STATUS |
| `/api/backups/run` | POST | TRIGGER_MANUAL_BACKUP |
| `/api/security-settings` | GET/PUT | CONFIGURE_SESSION_SETTINGS |

Full permission code list: `security/PermissionCodes.java`.
