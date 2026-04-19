# Smart Cart — Project Plan

> PWA shopping list with community-driven price voting  
> Stack: React 19 · Vite 8 · TypeScript · Tailwind v4 · shadcn/ui · Express 5 · Prisma 5 · PostgreSQL 16

---

## Current Status: MVP Prototype — Running ✅

Both servers are live (`localhost:5173` for client, `localhost:3001` for API).  
PostgreSQL running via Docker. Database migrated and seeded with 5 stores + 15 products.

---

## Architecture

```
smart-cart/                   # npm workspaces monorepo
├── .env                      # DATABASE_URL, JWT_SECRET, PORT
├── docker-compose.yml        # PostgreSQL 16 Alpine
├── prisma/
│   ├── schema.prisma         # 8 models (User, Store, Product, VotingRound, PriceReport, etc.)
│   ├── seed.ts               # 5 stores, 15 products
│   └── migrations/           # auto-generated
├── server/                   # Express 5 + TypeScript
│   └── src/
│       ├── index.ts          # app entry, CORS, routes
│       ├── lib/prisma.ts     # PrismaClient singleton
│       ├── middleware/        # auth.ts (JWT), error.ts
│       ├── routes/           # auth, products, stores, lists, prices
│       └── services/         # PricingService (voting engine)
└── client/                   # React 19 + Vite 8
    └── src/
        ├── lib/              # api.ts (fetch wrapper), auth-context.tsx, utils.ts
        ├── components/
        │   ├── ui/           # button, input, card, dialog, badge, label
        │   ├── Layout.tsx    # header + bottom nav + Outlet
        │   ├── ProductSearch.tsx
        │   ├── StoreComparisonTable.tsx
        │   ├── RunningTotal.tsx
        │   ├── PriceInputDialog.tsx
        │   └── ReputationBadge.tsx
        └── pages/            # Home, Login, Register, NewList, PlanningMode, BuyingMode, Stores, Products, Profile
```

---

## What's Built (Phase 1 — Complete)

### Backend API
- **Auth**: Anonymous creation, email/password register + login, anonymous→email upgrade, JWT tokens
- **Products**: Search (case-insensitive), CRUD, price lookup (consensus + provisional)
- **Stores**: List, get, user-suggested stores
- **Shopping Lists**: Full CRUD with items, quantity editing, store comparison endpoint
- **Prices**: Report endpoint, price history, current price lookup
- **PricingService**: Voting engine — rounds close at 5 reports, consensus by majority (tie-break by reporter reputation), +1/-1 reputation, +2 early reporter recovery

### Frontend
- **App shell**: React Router v7 with Layout (header + bottom nav), protected routes, AuthProvider
- **Auth flows**: Login, Register, Continue as Guest (anonymous)
- **Planning Mode**: Search + add products, edit quantities, compare stores side-by-side, "Shop here" to switch to buying
- **Buying Mode**: Checklist UI, price input dialog on check-off (auto-reports to community), running total footer
- **Stores page**: Browse + suggest new stores
- **Products page**: Browse + add to community catalog
- **Profile page**: Reputation display, sign out
- **PWA**: Service worker (vite-plugin-pwa), manifest, offline-capable via workbox NetworkFirst strategy

### Infrastructure
- Docker Compose for PostgreSQL 16
- npm workspaces monorepo
- Vite proxy `/api` → Express on port 3001
- Prisma migrations + seed script

---

## What's Next (Phase 2 — Polish & Hardening)

### High Priority
| Task | Description | Effort |
|------|-------------|--------|
| **Error toasts** | Add react-hot-toast or sonner for user-facing error/success feedback | Small |
| **Loading states** | Add skeletons/spinners to pages during API fetches | Small |
| **Form validation** | Client-side zod validation on forms (login, register, price input) | Small |
| **Price report in buying mode** | Wire up actual price auto-report when checking off items | Small |
| **List deletion** | Add delete list + remove items UI | Small |
| **Responsive polish** | Test and fix layout on various mobile breakpoints | Medium |

### Medium Priority
| Task | Description | Effort |
|------|-------------|--------|
| **Price history view** | Show voting round history per product/store with chart | Medium |
| **Account upgrade flow** | In-app prompt for anonymous users to upgrade to email | Small |
| **Search debounce tuning** | Optimize product search UX with better empty states | Small |
| **Offline support** | Cache product/store data for offline planning mode | Medium |
| **TanStack Query integration** | Replace manual fetch + useState with useQuery/useMutation for caching + retries | Medium |
| **Dark mode toggle** | CSS variables are ready, just need a toggle button | Small |

### Phase 3 — Features
| Task | Description | Effort |
|------|-------------|--------|
| **Google OAuth** | Add Google sign-in (schema supports it, backend endpoint needed) | Medium |
| **Barcode scanning** | Use device camera to scan product barcodes for quick add | Large |
| **Push notifications** | Notify when voting rounds close on products you reported | Medium |
| **Store geolocation** | Show nearby stores using browser geolocation API | Medium |
| **Price trend charts** | Visualize price changes over time per product/store | Medium |
| **List sharing** | Share shopping lists between users (collaborative shopping) | Large |
| **Admin dashboard** | Moderate products, stores, review flagged price reports | Large |

---

## How to Run

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Run migration + seed (first time only)
cd server && npx prisma migrate dev --schema=../prisma/schema.prisma --name init
npx tsx ../prisma/seed.ts

# 3. Start both servers
cd .. && npm run dev
# → Client: http://localhost:5173
# → API:    http://localhost:3001

# Other commands
npm run db:studio           # Prisma Studio (visual DB browser)
npm run dev:server          # Server only
npm run dev:client          # Client only
```

---

## Key Design Decisions

1. **Anonymous-first auth** — Users can start immediately, upgrade later. Reduces friction.
2. **Flow-based voting (5 reports)** — No time-based expiry, rounds close naturally as data flows in.
3. **Reputation as tie-breaker** — When vote counts are equal, higher-reputation reporters' price wins.
4. **Early reporter recovery** — Users who reported a price that lost in round N but wins in round N+1 get +2 (compensating the -1 loss + bonus).
5. **Prisma 5.22** — Chosen over Prisma 7 for stability with the `env("DATABASE_URL")` pattern.
6. **Vite 8 + vite-plugin-pwa** — PWA plugin installed with `--legacy-peer-deps` (peer dep mismatch with Vite 8, functionally works).
7. **Express 5** — Native async error handling, modern middleware.

---

*Last updated: April 19, 2026*
