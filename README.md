# FloatFlow

I built **FloatFlow** to solve a common headache in branch-based businesses: managing petty cash without losing track of where the money actually goes. Instead of messy spreadsheets and paper receipts, this system provides a clear, automated workflow for handling "floats" at the branch level.

The goal was to create something that feels snappy for the employee submitting an expense, but rigid enough for a finance officer to trust the audit trail.

---

## How it's Organized
I’ve set this up as a monorepo to keep the frontend and backend in sync:

* **/backend**: The engine of the app. It's a Spring Boot 3 REST API built with **Java 25**. It handles the heavy lifting—security, business rules, and the "Policy Engine."
* **/frontend**: A React dashboard built with Vite and TypeScript. I used Tailwind CSS and Shadcn UI to keep the interface clean and responsive.

---

## What it Actually Does

### Smart Expense Validation
I didn't want a simple "submit and pray" system. The **Policy Engine** I wrote checks every expense in real-time. It automatically blocks submissions if:
* The branch float is running too low.
* Someone tries to claim more than the allowed daily limit for a category (like "Transport").
* A user accidentally double-clicks or submits the same thing twice within 10 minutes.

### Automated Money Tracking
Once a manager clicks "Approve," a lot happens behind the scenes:
* The float balance is instantly deducted.
* If the balance hits zero, the float status flips to `EXHAUSTED` automatically.
* A financial ledger entry (`FloatTransaction`) is created so you can see a perfect history of every coin.

### Audit & Transparency
I used `@Async` logging for the **AuditService** so the app stays fast while recording every login, approval, and top-up. Basically, if something happens in the system, there’s a record of who did it and when.

---

## Tech Stack
* **Backend**: Java 25, Spring Boot 3, Spring Security (JWT), Hibernate, PostgreSQL.
* **Frontend**: React, TypeScript, Vite, Tailwind CSS.
* **Tools**: IntelliJ for the heavy lifting, VS Code for the UI, and Docker for the database.

---

## Setting it Up

### Backend (IntelliJ)
1. Navigate to `backend/FloatFlow`.
2. Ensure you have **JDK 25** configured.
3. Run `FloatFlowApplication.java`.

### Frontend (VS Code)
1. Navigate to `frontend`.
2. `npm install`
3. `npm run dev`

---

