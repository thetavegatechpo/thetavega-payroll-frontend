# Thetavega Payroll — React Frontend (Phase 1)

React + Vite frontend built to integrate with the **Thetavega MongoDB backend** provided previously.

## Start
1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env` and set `VITE_API_URL=http://localhost:5000/api` (or your backend host).
4. `npm run dev`
5. Open http://localhost:5173 and sign in with the admin credentials configured when running backend `npm run seed`.

## Pages
- Login with backend JWT
- Dashboard with live employee/master counts
- Employee Master: list, search, status filter, pagination, create, edit, activate/deactivate
- Department and Designation Masters: create, edit, activate/deactivate
- Salary Components: view and create
- Payroll Rules: view and create JSON rule versions
- Company Settings: view and edit values

## Important limitations
This is a Phase 1 frontend. Attendance, payroll calculation, admin approval, salary slips and reports have not been implemented in the backend and are not represented as working pages here.
Employee GET responses from the supplied backend omit bank/statutory fields for privacy. Accordingly, the frontend employee editor covers basic profile and employment fields, not bank/statutory updates.
Permissions are enforced by backend API; frontend does not yet hide write controls based on permission. Backend settings/rules are still a scaffold and need category-specific validation and secure policy change controls before production use.
The top bar connection text is a label, not a live connectivity probe.
