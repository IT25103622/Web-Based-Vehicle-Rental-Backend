# Web-Based Vehicle Rental Service — Unified Backend

A single Spring Boot application merging all six group members' modules
into one process, one database, one authentication/RBAC system, and one
audit trail.

## Stack
- Java 17, Spring Boot 3.2.5, Maven
- Spring Security + JJWT (JWT auth), Spring Data JPA + MySQL
- Spring Mail (email OTP for MFA), AspectJ (`@RequiresPermission` enforcement)

## Modules merged (source branch → package)

| Module | Author's branch | Package |
|---|---|---|
| Access Control, Security & RBAC (canonical auth for the whole app) | `widanage-pwcn` | `accesscontrol` |
| Fleet Management & Vehicle Inventory (canonical `Vehicle` entity) | `sampath-kamp` | `fleet` |
| Return & Inspection | `sampath-kamp` | `inspection` |
| Vehicle Images / Media | `sampath-kamp` | `media` |
| Booking & Search | `maduwerachchi-tgon` | `booking`, `customer`, `vehiclesearch`, `manager` |
| Support Tickets | `ahamed-mha` (completed during merge) | `support` |
| Discounts & Promotions (ported from Node.js/TypeScript/MongoDB) | `wijesinghe-st` | `pricing` |

`samarakoon-ps`'s branch had no pushed module-specific code at merge time.

## Setup

1. **Start MySQL**, then run `database/schema.sql` in MySQL Workbench (or
   `mysql -u root -p < database/schema.sql`). This creates the database,
   every table, seed roles/permissions/demo vehicles, and the audit-log
   immutability triggers.

   > Default admin login: `admin@vehiclerental.local` / `Admin@12345`
   > (forced password change on first login).

2. **Open the project**: `backend/` is the Maven root (the folder with
   `pom.xml`). Let Maven download dependencies.

3. **Configure `src/main/resources/application.properties`** — copy from
   `application.properties.example` and fill in your own values:
   - `spring.datasource.username` / `password` — your MySQL credentials
   - `app.jwt.secret` — generate one: `openssl rand -base64 32`
   - `spring.mail.username` / `password` — a real mailbox for OTP emails
     (Gmail: use an **App Password**)
   - `app.backup.mysqldump-path` — full path to `mysqldump` if not on PATH
   - **Never commit the real `application.properties`** — it's gitignored
     on purpose; a previous commit leaked real credentials and they were
     rotated. Only the `.example` template with placeholders is tracked.

4. **Run** `com.sliit.vehiclerental.VehicleRentalApplication`. Server
   starts on port `8080`.

The companion React frontend lives in `../frontend` (see its own README).

## Key architectural decisions made during the merge

- **One auth system for everyone.** Access Control's JWT + `UserPrincipal`
  + `@RequiresPermission`/`PermissionAspect` is the single source of truth.
  Every other module's endpoints are gated with it instead of rolling
  their own auth.
- **One canonical `Vehicle` entity.** Fleet's `fleet.entity.Vehicle` (table
  `vehicles`) is authoritative; Booking, Inspection, Support and Pricing
  all reference it via `@ManyToOne` rather than keeping their own copies.
  Cross-module status transitions go through the `VehicleStatusService`
  interface Fleet exposes (`setVehicleReserved`, `setVehicleRented`,
  `updateInspectionResults`, etc.) so modules never write to `vehicles`
  directly.
- **`@RequiresPermission(value, anyOf = {...})`** lets an endpoint accept
  more than one permission (e.g. a Fleet Manager *or* an Inspector).
- **Discounts & Promotions** were ported line-for-line in business logic
  from the original Node.js/Express/Mongoose module to Spring/JPA/MySQL so
  the whole system runs as one deployable process instead of two services.
- **Audit trail:** `AuditLogService.log(...)` is the only write path into
  `audit_logs`; the DB also has `BEFORE UPDATE`/`BEFORE DELETE` triggers
  that hard-abort any attempt to tamper with it at the SQL level.
- **Soft-delete only** for users (`DEACTIVATE_USER` flips `status`); fleet
  vehicles support an explicit permanent delete for data-entry mistakes,
  gated separately and blocked while bookings/inspections reference them.

## API surface (by module)

See each controller for the full parameter list; permission codes are in
`accesscontrol/security/PermissionCodes.java`.

| Module | Base path |
|---|---|
| Auth | `/api/auth/login`, `/api/auth/verify-otp` |
| Access Control | `/api/users`, `/api/roles`, `/api/audit-logs`, `/api/security-settings`, `/api/backups` |
| Fleet | `/api/fleet/vehicles` (staff CRUD), `/api/vehicles` (public search/browse) |
| Inspection | `/api/inspections` |
| Media | `/api/fleet/vehicles/{id}/images`, `/api/inspections/{id}/images`, `/api/vehicle-images/{id}/content` |
| Booking | `/api/bookings`, `/api/manager/stats`, `/api/manager/bookings`, `/api/me` |
| Support | `/api/support-tickets` |
| Pricing | `/api/discounts`, `/api/discounts/calculate`, `/api/promotions`, `/api/promotions/evaluate`, `/api/promotions/analytics` |

## Verifying this build

Maven Central was unreachable from the sandbox this merge was built in, so
compilation could not be verified with `mvn compile` there. The merge was
instead verified by manual cross-reference review (every repository method
call checked against its interface, every cross-module service call
checked against its signature) and static checks (stale-import grep,
brace-balance check across all 136+ Java files). **Please run a real
`mvn compile` / `mvn spring-boot:run` locally before merging** — two real
issues were already caught and fixed this way during the merge
(`RequiresPermission.anyOf` was missing from the annotation, and
`BookingRepository` was missing a method `InspectionService` called), so
a full compiler pass may still surface something static review couldn't.
