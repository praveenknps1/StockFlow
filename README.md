# StockFlow MVP (MERN)

Multi-tenant inventory app: sign up with an organization, manage products, see a dashboard with low-stock items.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node. Auth is JWT + bcrypt.

## Run it

You need Node 18+ and a MongoDB instance (local, or a free Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env      # set MONGO_URI and JWT_SECRET
npm install
npm run dev               # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev               # http://localhost:5173 (proxies /api to :5000)
```

## How the requirements map to code

| Requirement | Where |
|---|---|
| FR-1 Signup / login | `server/src/routes/auth.js`, `client/src/pages/Login.jsx`, `Signup.jsx` |
| FR-2 Org context, tenant scoping | Org created on signup; `orgId` comes from the signed JWT (`middleware/auth.js`) and every query filters by it |
| FR-3 Product model, SKU unique per org | `server/src/models/Product.js` (compound unique index on organization + sku) |
| FR-4 Product CRUD + delete confirm | `routes/products.js`, `pages/Products.jsx`, `pages/ProductForm.jsx` (hard delete) |
| FR-5 Stock adjust + last updated by | `PATCH /api/products/:id/adjust`, `lastUpdatedBy` field |
| FR-6 Dashboard | `routes/dashboard.js`, `pages/Dashboard.jsx` |
| FR-7 Default low-stock setting | `routes/settings.js`, `pages/Settings.jsx` (stored on the Organization) |

Low stock rule: `quantityOnHand <= (product threshold ?? organization default)`. The default is 5 until changed in Settings.

## Demo script

1. Sign up with an organization name.
2. Add 3 products, giving one a quantity at or below 5.
3. Check the Dashboard: totals update and the low-stock item appears.
4. Change the default threshold in Settings and watch the low-stock list change.
5. Sign up a second account and confirm it sees none of the first account's data.
