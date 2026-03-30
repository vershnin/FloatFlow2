# FloatFlow — Float & Petty Cash Management System
## Spring Boot Backend — Setup & Developer Guide

> **Project by:** Orinda Richard Gak (Reg No: 22/05815)  
> **Supervisor:** Dr. Rachael Kibuku — KCA University  
> **Stack:** Java 25 · Spring Boot 4.0 · PostgreSQL · JWT · Maven 3.9

---

## 📁 Project Structure

```
com.floatflow
├── config/           → SecurityConfig, OpenApiConfig, AsyncConfig
├── security/         → JwtService, JwtAuthenticationFilter
├── controller/       → REST API endpoints (AuthController, FloatController, etc.)
├── service/          → Business logic (AuthService, FloatService, ExpenseService, etc.)
├── repository/       → JPA database queries
├── dto/
│   ├── request/      → Input validation objects (RegisterRequest, SubmitExpenseRequest, etc.)
│   └── response/     → API output objects (AuthResponse, FloatResponse, etc.)
├── entity/           → Database table definitions (User, Float, Expense, etc.)
├── exception/        → Custom exceptions + GlobalExceptionHandler
├── audit/            → AuditService — immutable event logging
└── policy/           → PolicyEngine — spending rule enforcement
```

---

## 🚀 Prerequisites

Before running the project, install:
1. **Java 25** → https://adoptium.net/
2. **Maven 3.9.14** → https://maven.apache.org/download.cgi
3. **PostgreSQL 15+** → https://www.postgresql.org/download/
4. **Git** → https://git-scm.com/

---

## 🗄️ Database Setup (PostgreSQL)

Open a terminal and run:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create the database and user
CREATE DATABASE floatflow_db;
CREATE USER floatflow_user WITH PASSWORD 'floatflow_password';
GRANT ALL PRIVILEGES ON DATABASE floatflow_db TO floatflow_user;

-- Exit
\q
```

---

## ⚙️ Configuration

Edit `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/floatflow_db
    username: floatflow_user      # ← Change if different
    password: floatflow_password  # ← Change if different

jwt:
  secret: your-very-long-random-secret-key-change-this-in-production
  expiration: 86400000  # 24 hours
```

> ⚠️ **Important:** Change the JWT secret before deploying to production!

---

## ▶️ Running the Application

```bash
# Navigate to project root
cd floatflow

# Build the project (downloads dependencies)
mvn clean install

# Run the application
mvn spring-boot:run
```

The server starts at: **http://localhost:8080**

---

## 📖 API Documentation (Swagger UI)

Once running, open your browser:

```
http://localhost:8080/swagger-ui.html
```

**To test protected endpoints in Swagger:**
1. Call `POST /api/auth/login` to get a JWT token
2. Click the **"Authorize"** button (top right)
3. Paste the token and click Authorize
4. Now all requests include the JWT automatically

---

## 🔐 Authentication Flow

```
1. POST /api/auth/register  →  Create account
2. POST /api/auth/login     →  Get JWT token
3. All other requests       →  Include: Authorization: Bearer <token>
```

**Example login response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "email": "finance@company.com",
    "role": "FINANCE_OFFICER",
    "userId": 1,
    "branchId": 2
  }
}
```

---

## 🛡️ Role Permissions

| Role             | Can Do |
|------------------|--------|
| ADMIN            | Everything |
| FINANCE_OFFICER  | Create floats, top-up, configure policies, view all reports |
| BRANCH_MANAGER   | Approve/reject expenses, view branch reports |
| EMPLOYEE         | Submit expenses, view own expense history |
| AUDITOR          | Read-only access to audit logs and reports |

---

## 📡 API Endpoints Summary

### Auth (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user |
| POST | `/api/auth/login` | Login and get JWT |

### Floats (Finance Officer / Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/floats` | Allocate a new float to a branch |
| GET | `/api/floats` | List all floats |
| PUT | `/api/floats/{id}/topup` | Add money to a float |
| GET | `/api/floats/{id}/transactions` | View transaction history |

### Expenses (All Authenticated Users)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Submit an expense (Policy Engine runs here) |
| GET | `/api/expenses` | List all expenses (Finance only) |
| GET | `/api/expenses/my` | View my own expenses |
| GET | `/api/expenses/pending` | View pending approvals |
| PUT | `/api/expenses/{id}/approve` | Approve an expense |
| PUT | `/api/expenses/{id}/reject` | Reject an expense |

### Policies (Finance Officer / Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/policies` | Create spending policy |
| GET | `/api/policies` | List active policies |
| PUT | `/api/policies/{id}` | Update policy |
| DELETE | `/api/policies/{id}` | Deactivate policy (soft delete) |

### Reports (Finance / Auditor)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/summary` | All-branch summary |
| GET | `/api/reports/branch/{id}` | Single branch report |

### Audit (Auditor / Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit?page=0&size=20` | Paginated audit logs |
| GET | `/api/audit/entity/{type}/{id}` | Entity-specific audit trail |

---

## 🧠 Policy Engine — How It Works

When an employee submits an expense, the PolicyEngine runs 4 checks:

```
Submit Expense Request
        │
        ▼
[1] Float Balance Check     → Fails if amount > currentBalance
        │
        ▼
[2] Category Max Amount     → Fails if amount > policy.maxAmount
        │
        ▼
[3] Daily Limit Check       → Fails if todayTotal + amount > policy.dailyLimit
        │
        ▼
[4] Duplicate Detection     → Fails if same (user, amount, category) within 10 min
        │
        ▼
   Expense Saved ✓
```

If any check fails, the response is:
```json
{
  "success": false,
  "message": "PolicyViolation: Expense amount 6000.00 exceeds maximum allowed 5000.00 for category 'TRAVEL'"
}
```

---

## 🧪 Running Tests

```bash
# Run all tests
mvn test

# Run a specific test class
mvn test -Dtest=PolicyEngineTest
mvn test -Dtest=AuthServiceTest
```

---

## 📦 Sample API Usage (cURL)

### 1. Register a Finance Officer
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Finance",
    "email": "jane@company.com",
    "password": "password123",
    "role": "FINANCE_OFFICER",
    "branchId": 1
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "jane@company.com", "password": "password123"}'
```

### 3. Create a Float (use token from step 2)
```bash
curl -X POST http://localhost:8080/api/floats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"branchId": 1, "initialAmount": 50000}'
```

### 4. Submit an Expense
```bash
curl -X POST http://localhost:8080/api/expenses \
  -H "Authorization: Bearer EMPLOYEE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "floatId": 1,
    "amount": 1500,
    "category": "TRAVEL",
    "description": "Taxi to client meeting"
  }'
```

---

## 🔮 Future Enhancements (Phase 3)

- WebSocket real-time notifications (Flask-SocketIO equivalent: Spring WebSocket)
- M-Pesa API integration for disbursements
- Redis caching for float balances (30s TTL)
- PDF report generation (iText/JasperReports)
- ERP export (SAP/QuickBooks CSV sync)
- Docker + Docker Compose deployment
- Kubernetes horizontal scaling

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| `Connection refused` | Ensure PostgreSQL is running on port 5432 |
| `relation "users" does not exist` | Set `ddl-auto: update` in application.yml |
| `401 Unauthorized` | Include `Authorization: Bearer <token>` header |
| `403 Forbidden` | Your role doesn't have access to this endpoint |
| `422 Unprocessable Entity` | Policy Engine blocked the expense — check the message |
