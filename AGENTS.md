# AGENTS.md

This file provides guidance for AI agents working on the AiNote codebase.

## Build & Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Frontend only (:3100)
pnpm dev:backend          # Backend only (:3001)
pnpm build                # Build all packages
pnpm build:frontend       # Build frontend only
pnpm build:backend        # Build backend only
pnpm lint                 # Run ESLint across all packages
cd packages/frontend && npx tsc --noEmit    # Frontend type check
cd packages/backend && npx tsc --noEmit     # Backend type check
cd packages/backend && pnpm prisma:generate # Generate Prisma client
cd packages/backend && pnpm prisma:migrate    # Run migrations
cd packages/backend && pnpm seed:public-assistants  # Seed public assistants
```

**Note:** No test framework currently configured. Tests mentioned in docs use Vitest/Playwright but are not yet implemented.

## Code Style Guidelines

### General
- Use **pnpm** as package manager (monorepo)
- **NO COMMENTS** in code unless explicitly requested
- Follow existing code patterns and conventions

### Frontend (React + TypeScript)

#### Imports Order
```typescript
// 1. React/hooks, 2. External libs, 3. Internal (with @/* alias), 4. Styles
import React, { useState } from 'react';
import { Button } from 'antd';
import { useAuthStore } from '@/store/authStore';
import styled from 'styled-components';
```

#### Components
- Function components with hooks, named exports preferred
- TypeScript interfaces above component: `interface Props { title: string; }`

#### State Management (Zustand)
```typescript
interface NoteState { notes: Note[]; loadNotes: () => Promise<void>; }
export const useNoteStore = create<NoteState>()((set, get) => ({
  notes: [], loadNotes: async () => { /* ... */ }
}));
```

#### Styling
- Use **styled-components** with tokens from `@/styles/design-tokens`
- TypeScript props: `const Container = styled.div<{ $isActive: boolean }>``

#### API Calls
```typescript
import { apiClient } from '@/lib/api/client';
export const notesApi = {
  getAll: () => apiClient.get('/notes'),
  create: (data) => apiClient.post('/notes', data),
};
```

### Backend (Fastify + TypeScript)

#### Imports
```typescript
import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.middleware.js';
```

#### Routes
- Named exports: `export default async function routes(fastify: FastifyInstance)`
- Use `authenticate` middleware for protected routes
- Type params and query with interfaces

#### Error Handling
```typescript
try { await operation(); } catch (error) {
  console.error('Operation failed:', error);
  reply.status(500).send({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } });
}
```

### Naming Conventions

#### Files
- Components: PascalCase (NoteEditor.tsx)
- Stores: camelCase + "Store" suffix (authStore.ts)
- Services: camelCase + "Service" suffix (aiService.ts)
- Routes: camelCase + "routes" suffix (notes.routes.ts)
- Hooks: camelCase + "use" prefix (useAutoSave.ts)

#### Variables/Functions
- camelCase: `loadNotes`, `isLoading`
- Constants: UPPER_SNAKE_CASE: `API_BASE_URL`
- Interfaces/Types: PascalCase: `User`, `AuthState`

#### Database
- Prisma models: PascalCase (User, Note)
- Tables: snake_case (users, notes)
- Enums: PascalCase (NoteFileType)

### TypeScript Best Practices
- Strict mode enabled in tsconfig
- Define interfaces for complex objects
- Avoid `any` - prefer `unknown` or specific types
- Use utility types: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`

### File Organization
```
src/
├── components/   # Reusable UI components
├── pages/        # Page-level components
├── store/        # Zustand stores
├── lib/api/      # API client modules
├── lib/sync/     # Sync coordination
├── hooks/        # Custom React hooks
├── services/     # Backend services
├── types/        # TypeScript type definitions
├── db/           # IndexedDB setup
└── styles/       # Design tokens
```

## Architecture Principles

1. **Offline-First**: IndexedDB first, PostgreSQL second
2. **Monorepo**: Shared types in `packages/shared/`
3. **State Management**: Zustand with persistence for auth/settings
4. **Editor System**: Plugin-based architecture via EditorRegistry
5. **AI Integration**: Stream-based responses with context builders

## Common Patterns

### Creating a New Feature
1. Define types in `packages/shared/src/` if shared
2. Create Zustand store in `src/store/`
3. Add API module in `src/lib/api/`
4. Create backend route in `src/routes/`
5. Add service layer in `src/services/`
6. Build UI components
7. Update Prisma schema if needed

### Error Response Format (Backend)
```json
{ "error": { "message": "Error description", "code": "ERROR_CODE" } }
```

## Before Submitting
- Run `pnpm lint` to check code quality
- Run TypeScript type check: `cd packages/frontend && npx tsc --noEmit`
- Test manual workflows in the application
- Verify data sync works (IndexedDB + PostgreSQL)
