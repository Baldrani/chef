# Development Guide

This document covers development commands, setup, and technical workflows for the Chef application.

## Development Commands

### Core Development
- `npm run dev` - Start development server on http://localhost:3000
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js configuration

### Database Management
- `npx prisma generate` - Generate Prisma client (runs automatically on `npm install`)
- `npx prisma migrate dev` - Apply pending migrations to development database
- `npx prisma migrate deploy` - Deploy migrations to production database
- `npx prisma studio` - Open Prisma Studio for database browsing

### Deployment
- `npm run vercel-build` - Production build command used by Vercel (generates client, deploys migrations, then builds)

## Key Libraries

- **Next.js 15** with App Router
- **Prisma** with PostgreSQL (@neondatabase/serverless for production)
- **next-intl** for internationalization
- **Zod** for API request validation
- **date-fns** for date manipulation
- **OpenAI** integration (usage unclear from schema)
- **Tailwind CSS** for styling

## File Structure Notes

### Database Connection
- `lib/prisma.ts` - Singleton Prisma client with development hot-reload support
- Uses global variable caching to prevent multiple instances in development

### Route Patterns
- Parallel routes: Both `/app/[locale]/trips/[tripId]/page.tsx` and `/app/trips/[tripId]/page.tsx` exist
- API routes follow resource-based naming with proper HTTP methods
- Nested resources like `/api/meals/[mealSlotId]/participants/[participantId]`

### Date Handling
- `lib/dates.ts` likely contains date utilities for trip/meal date calculations
- Scheduler uses `startOfDay` for consistent date comparisons
- MealSlot table enforces uniqueness on (tripId, date, mealType)

## Feature Flags

The project uses environment-based feature flags for controlling functionality:

### Available Flags
- `FEATURE_AUTO_LOAD_GROCERIES` - Controls automatic loading of groceries when date is selected
  - `true`: Groceries automatically load when date changes (no Load button)
  - `false`: Manual Load button is shown, groceries must be manually loaded

### Configuration
Feature flags are configured in:
- Environment variables (`.env` file or deployment environment)
- `lib/feature-flags.ts` - Central configuration and utilities
- Usage: `import { featureFlags } from '@/lib/feature-flags'`

### Usage Example
```typescript
// Check if auto-load groceries is enabled
if (featureFlags.autoLoadGroceries && date) {
    load(date); // Auto-load groceries
}

// Conditionally render Load button
{!featureFlags.autoLoadGroceries && (
    <button onClick={() => load(date)}>Load</button>
)}
```

## Testing and Quality

The project uses:
- ESLint with Next.js configuration
- TypeScript with strict configuration
- No apparent test framework configured (consider adding Jest/Vitest)

## Internationalization

- Uses next-intl with English/French support
- Middleware handles locale routing automatically
- Message files in `/messages/` directory (en.json, fr.json)
- Locale-specific pages under `/app/[locale]/` directory