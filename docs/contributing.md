# Contributing

## Development Workflow

### Branch Strategy

```
main          ← Production-ready code
├── develop   ← Integration branch
│   ├── feat/member-import    ← Feature branches
│   ├── fix/login-validation  ← Bug fix branches
│   └── chore/update-deps     ← Maintenance
```

### Branch Naming

| Prefix      | Purpose          | Example                   |
| ----------- | ---------------- | ------------------------- |
| `feat/`     | New feature      | `feat/bulk-member-import` |
| `fix/`      | Bug fix          | `fix/transaction-balance` |
| `chore/`    | Maintenance      | `chore/update-prisma`     |
| `docs/`     | Documentation    | `docs/api-reference`      |
| `refactor/` | Code refactoring | `refactor/auth-service`   |

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(members): add bulk import from CSV
fix(auth): handle expired refresh tokens
chore(deps): update prisma to 7.6
docs(api): add loan endpoint documentation
```

## Code Standards

### TypeScript

- Strict mode enabled (`"strict": true`)
- No `any` types — use `unknown` and type guards
- Use interfaces for data shapes, types for unions
- Export types from `@iffe/shared`, don't duplicate

### Backend (Hono API)

```
routes/     → HTTP handling only (no business logic)
services/   → Business logic, orchestration
repositories/ → Data access, Prisma queries
middleware/ → Cross-cutting concerns (auth, logging)
utils/      → Pure utility functions
```

**Rules:**

- Routes call Services, never Repositories directly
- Services call Repositories, never Prisma directly
- Repositories own all Prisma queries
- Validate input with Zod at the route level
- Throw `HTTPException` for expected errors
- Let error handler catch unexpected errors

### Frontend (Next.js)

```
app/(auth)/     → Public auth pages
app/(dashboard)/ → Authenticated pages
components/     → Reusable components
components/ui/  → Primitive UI components
hooks/          → TanStack Query hooks
stores/         → Zustand state stores
lib/            → Utilities, API client, schemas
```

**Rules:**

- Pages are Server Components by default
- Add `"use client"` only when needed (interactivity, hooks)
- Use TanStack Query for all server data
- Use Zustand only for client-only state
- Validate forms with React Hook Form + Zod
- Show loading, error, and empty states for all data

### Styling

- Use Tailwind CSS utility classes
- Use `glass-card`, `glass-strong`, etc. for glassmorphism
- Use `cn()` helper for conditional classes
- Follow the color token system — never hardcode colors
- Support dark mode for every new component
- Ensure mobile responsiveness (test at 375px)

## Adding a New Feature

### Example: Adding "Notifications" module

1. **Shared types** — `packages/shared/src/types.ts`:

   ```typescript
   export interface Notification {
     id: string;
     userId: string;
     title: string;
     message: string;
     read: boolean;
     createdAt: string;
   }
   ```

2. **Schema** — `packages/shared/src/schemas.ts`:

   ```typescript
   export const createNotificationSchema = z.object({
     userId: z.string().uuid(),
     title: z.string().min(1),
     message: z.string().min(1),
   });
   ```

3. **Prisma model** — `apps/api/prisma/schema.prisma`:

   ```prisma
   model Notification {
     id        String   @id @default(uuid())
     userId    String
     title     String
     message   String
     read      Boolean  @default(false)
     createdAt DateTime @default(now())
     user      User     @relation(fields: [userId], references: [id])
     @@map("notifications")
   }
   ```

4. **Migration** — `bunx prisma migrate dev --name add-notifications`

5. **Repository** — `apps/api/src/repositories/notification.repository.ts`

6. **Service** — `apps/api/src/services/notification.service.ts`

7. **Routes** — `apps/api/src/routes/notification.routes.ts`

8. **Wire up** — Add to `apps/api/src/index.ts`:

   ```typescript
   import { notificationRoutes } from "./routes/notification.routes";
   app.route("/notifications", notificationRoutes);
   ```

9. **Frontend hook** — `apps/web/src/hooks/use-notifications.ts`

10. **Frontend page** — `apps/web/src/app/(dashboard)/notifications/page.tsx`

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:4000/api/v1/health

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@iffeds.org","password":"password123"}' \
  | jq -r '.data.tokens.accessToken')

# Use token for authenticated requests
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/api/v1/members?page=1&limit=5
```

### Frontend Build Check

```bash
cd apps/web
bun run build  # Must compile all 35 routes with 0 errors
```

## Pull Request Checklist

- [ ] Branch created from `develop`
- [ ] Code follows project style (TypeScript strict, no `any`)
- [ ] Shared types/schemas added/updated in `@iffe/shared`
- [ ] API routes have Zod validation
- [ ] Frontend shows loading/error/empty states
- [ ] Mobile responsive (tested at 375px)
- [ ] Dark mode supported
- [ ] `bun run build` passes for all workspaces
- [ ] Documentation updated if needed
