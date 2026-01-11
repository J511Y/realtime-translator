# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A real-time voice and image translation web application for Portuguese travelers. Uses OpenAI Realtime API for voice translation and Google Vision/Gemini for OCR.

## Commands

```bash
# Development
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run lint         # ESLint with auto-fix
npm run type-check   # TypeScript type checking

# Testing
npm test             # Run Jest unit tests
npm run test:watch   # Jest in watch mode
npm run test:e2e     # Playwright E2E tests
```

## Architecture

The project follows a layered architecture with strict dependency rules enforced by `eslint-plugin-boundaries`:

```
app/              → UI layer (routes, pages) - can import: components, services, types
  api/            → Server boundary for external API calls (only place that uses API keys)
components/       → UI components (Server Components by default) - can import: services, types
services/         → Business logic, orchestration - can import: lib, repositories, types
lib/              → External SDK clients, utilities - can import: types only
repositories/     → Data access layer (optional) - can import: types only
types/            → Shared type definitions
```

**Key restrictions:**

- `app/` and `components/` cannot directly import from `lib/` (prevents API key exposure)
- `lib/` cannot depend on UI/browser-specific code
- All external API calls must go through `app/api/` routes

## Layer Flow Example

For the Realtime session feature:

1. `app/api/realtime/session/route.ts` - HTTP endpoint, request validation, rate limiting
2. `services/realtime/sessionService.ts` - Business logic, environment validation
3. `lib/openai/client.ts` - OpenAI API client implementation
4. `types/realtime.ts` - All type definitions

## Coding Conventions

- **Language**: All comments and docstrings must be in Korean (한국어)
- **Exports**: Use named exports only (default exports only for Next.js reserved files: page.tsx, layout.tsx, etc.)
- **TypeScript**: Strict mode enabled with `exactOptionalPropertyTypes`, no `any` allowed
- **Components**: Server Components by default, use `'use client'` only when browser APIs are needed
- **File naming**:
  - Components: `PascalCase.tsx`
  - Hooks: `useCamelCase.ts`
  - Utils/Types: `camelCase.ts`
  - API routes: `route.ts`

## Testing

- Unit tests: `__tests__/` directory, Jest + React Testing Library
- E2E tests: `e2e/` directory, Playwright
- Test coverage collects from: `services/`, `lib/`, `features/`, `components/`

## Prohibited

- Tesseract.js (poor performance)
- Web Speech API (use OpenAI Realtime API instead)
- `any` type
- Direct API calls from `app/` or `components/` (must go through services)
