# Web-Based Vehicle Rental Service

Group 26 SLIIT Software Engineering project. This branch (`system-integration`)
merges every member's module into one unified, deployable system:

- **[`backend/`](./backend)** — a single Spring Boot application combining
  Access Control & Security, Fleet Management, Return & Inspection, Vehicle
  Images, Booking & Search, Support Tickets, and Discounts & Promotions,
  sharing one MySQL database, one JWT/RBAC auth system, and one audit trail.
- **[`frontend/`](./frontend)** — a single React app with one sign-in and
  one dark-themed UI, with a dedicated section per module.

Each member's original work lives on their own branch (`ahamed-mha`,
`maduwerachchi-tgon`, `sampath-kamp`, `widanage-pwcn`, `wijesinghe-st`) for
reference; this branch is the integrated result opened as a PR against
`main` for team review.

See `backend/README.md` and `frontend/README.md` for setup instructions.
