# BudgetBuddy

BudgetBuddy is a FastAPI + React personal finance application with authentication, income/expense CRUD, budgets, savings goals, notifications, analytics and report exports.

## Tech stack

- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL/SQLite
- Frontend: React + Vite, Chart.js
- Reports: ReportLab PDF + openpyxl Excel
- Testing: pytest + FastAPI TestClient; Jest + React Testing Library
- Deployment target: Render (backend/Postgres) + Vercel (frontend)

## Features completed

- Signup/login with JWT and protected frontend routes
- User-owned income, expense, budget, bank-account and savings-goal data
- Pydantic validation for positive amounts, valid emails and bounded strings
- Budget alerts at 80% and when a budget is exceeded
- Savings-goal completion and milestone notifications
- Analytics endpoints:
  - `GET /analytics/spending-by-category`
  - `GET /analytics/monthly-trend`
  - `GET /analytics/savings-progress`
  - `GET /analytics/summary`
- Basic users see current-month analytics only.
- Premium/Admin users can select a custom date range and view a 6-month trend.
- Monthly reports with role-aware access
- PDF/Excel export for Premium/Admin users
- Bank account numbers are masked in API responses and UI (last four digits only)
- Empty-data-safe PDF/Excel generation
- Backend ownership and integration tests
- Frontend protected-route and dashboard smoke tests
- GitHub Actions CI for backend pytest

## Local setup

### Backend

```bash
cd backend
python -m venv venv

# Windows PowerShell
.\venv\Scripts\Activate.ps1

pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

Backend: `http://127.0.0.1:8000`  
Swagger: `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend: `http://localhost:5173`

### Role access

- **Standard user:** own financial data, current-month analytics and current-month bank statement.


### Run tests

Backend:

```bash
cd backend
pytest -q
```

Frontend:

```bash
cd frontend
npm install
npm test
```

## Environment variables

Backend `.env`:

```text
DATABASE_URL=sqlite:///./budgetbuddy.db
SECRET_KEY=replace-with-a-strong-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Frontend `.env`:

```text
VITE_API_URL=http://127.0.0.1:8000
```

Never commit real `.env` files.

## Deployment: Render + Vercel

### 1. PostgreSQL on Render

Create a PostgreSQL database in Render and use its **Internal Database URL** for the backend service.

### 2. Backend on Render

Create a Web Service with `backend` as the root directory.

Build command:

```text
pip install -r requirements.txt
```

Start command:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Set these environment variables in Render:

```text
DATABASE_URL=<Render internal PostgreSQL URL>
SECRET_KEY=<new strong production secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Run migrations before serving production traffic:

```text
alembic upgrade head
```

Verify:

```text
https://YOUR-BACKEND.onrender.com/docs
```

### 3. Frontend on Vercel

Import the repository into Vercel and set the root directory to `frontend`.

Set:

```text
VITE_API_URL=https://YOUR-BACKEND.onrender.com
```

Build with the default Vite settings and deploy.

### 4. CORS

Update `backend/app/main.py` with the actual Vercel URL:

```python
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://YOUR-FRONTEND.vercel.app",
]
```

Commit and push the change so Render redeploys.

## Production verification checklist

1. Open the live Vercel URL.
2. Sign up and log in.
3. Confirm the JWT is stored and Dashboard loads.
4. Add income and an expense.
5. Confirm the transaction appears in Dashboard and Analytics.
6. Create a savings goal and test contribution/notification behaviour.
7. Test Premium/Admin analytics date filtering.
8. Test PDF and Excel exports with both populated and zero-data months.
9. Confirm the frontend uses the deployed backend URL, not localhost.
10. Confirm HTTPS works and CORS allows only the deployed frontend.
11. Confirm `.env`, database files and secrets are not committed.




- **Standard User:** current-month statement only.
- **Premium User:** own statement with a custom date range and CSV download.
- **Admin:** read-only statement access for selected users, with custom date range and CSV download.
- Account numbers are displayed using only the last four digits in the UI.
- Admin system analytics remains separate from personal statements.

The frontend uses a professional finance-dashboard layout with role badges, statement summaries, transaction tables, responsive navigation, and consistent visual styling.

## Account roles

New signups are Standard (`student`) by design. Premium/Admin access is not exposed as a public signup choice. An administrator can manage roles from **User Management**, or the first administrator can be bootstrapped from the backend:

```bash
cd backend
python scripts/set_user_role.py your-email@example.com admin
```

Then sign in again (or refresh the session) and the Admin navigation will show **System Analytics** and **User Management**. Admins can promote other accounts to Premium or Admin.


## Premium/Admin access flow

- New accounts start as Standard (`student`).
- A Standard user opens **Upgrade to Premium** and submits a Premium request.
- An Admin opens **Subscription Requests** and chooses **Approve** or **Reject**.
- Approval changes the selected user's role to `premium`.
- Admins can also use **User Management** to change a specific user's role to `student`, `premium`, or `admin`.
- Reports load automatically; there is no Generate/Clear Report workflow. PDF/Excel downloads are enabled for Premium and Admin users.
- Budget progress uses `/budget/progress?month_year=YYYY-MM`, so spent/remaining/percentage are calculated from real expenses rather than static values.


## Final UI updates in this build

- Budget Progress is driven by the live `/budget/progress` endpoint and refreshes on screen focus and every 30 seconds.
- Monthly budget progress no longer hides valid budgets through a second client-side month/year filter.
- Budget month/year display now safely reads the `YYYY-MM` value returned by the backend.
- Annual Budget is removed from the frontend budget experience; budgeting is monthly.
- Reports are surfaced on the Dashboard with the current-month summary. Premium/Admin users get PDF and Excel download buttons there.
- The standalone Reports navigation/page has been removed from the main application flow.
- Analytics charts use explicit datasets and a bar chart for Standard users' current-month income vs expense; Premium/Admin retain the multi-month line chart and category history.
- Premium access is requested from the sidebar's Premium Access/Upgrade to Premium item. Admins approve/reject requests from Administration → Subscription Requests or directly change a user's role under User Management.

## Roles

`student` = Standard, `premium` = Premium, `admin` = Administrator. Role changes must be performed server-side by an administrator; do not implement client-side role switching for security.

## Admin Premium Access Workflow

Admins now have a single professional Admin Dashboard available from the Dashboard menu. It contains:

- Pending Premium Requests
- Approve Premium
- Reject
- User Management
- Standard / Premium / Admin role assignment
- User and Premium account counts
- Refresh control

A Standard user can submit a Premium request from **Upgrade to Premium**. The request appears in the Admin Dashboard. Clicking **Approve Premium** changes that user's role to `premium`; clicking **Reject** closes the request without upgrading the account.

Admins can also directly assign Premium from **User Management**. If a pending Premium request exists for that user, it is automatically marked approved when Premium is assigned directly.

The normal `/dashboard` route automatically displays the Admin Dashboard for an authenticated administrator. The dedicated `/admin` route is also available.
