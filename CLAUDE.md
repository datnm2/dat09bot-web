# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

This is a monorepo containing:
- **apps/web**: Next.js frontend application
- **apps/api**: NestJS backend API server
- **packages/shared**: Shared types and schemas

## Development Commands

### Root Commands
- `pnpm dev` - Start both web and API development servers
- `pnpm dev:web` - Start only the web development server
- `pnpm dev:api` - Start only the API development server
- `pnpm build` - Build both applications
- `pnpm start` - Start both applications in production mode

### Database Commands (Web App)
- `pnpm db:setup` - Create .env file with database configuration
- `pnpm db:migrate` - Run database migrations
- `pnpm db:seed` - Seed database with default user (test@test.com / admin123)
- `pnpm db:generate` - Generate new migration files
- `pnpm db:studio` - Open Drizzle Studio for database management

## Architecture Overview

This is a monorepo with a Next.js frontend and NestJS backend API, sharing authentication, team management, and Stripe payments:

### Core Structure
- **App Router**: Uses Next.js 15 app directory structure
- **Database**: PostgreSQL with Drizzle ORM, schema in `lib/db/schema.ts`
- **Authentication**: JWT-based sessions stored in HTTP-only cookies
- **Payments**: Stripe integration with webhook handling
- **UI**: shadcn/ui components with Tailwind CSS

### Key Directories
#### Web App (apps/web/)
- `app/` - Next.js app router pages and API routes
- `lib/db/` - Database schema, queries, and migrations
- `lib/auth/` - Authentication utilities and session management
- `lib/payments/` - Stripe integration and payment handling
- `components/` - Reusable UI components

#### API Server (apps/api/)
- `src/` - NestJS application source code
- `src/auth/` - JWT authentication and strategies
- `src/users/` - User management endpoints
- `src/teams/` - Team management endpoints
- Port: 3001 (configurable via PORT env var)

#### Shared Package (packages/shared/)
- `src/types.ts` - Shared TypeScript interfaces
- `src/schemas.ts` - Zod validation schemas

### Authentication Flow
- JWT tokens signed with `AUTH_SECRET` environment variable
- Sessions managed via `lib/auth/session.ts`
- Global middleware in `middleware.ts` protects `/dashboard` routes
- Password hashing with bcryptjs (10 salt rounds)

### Database Schema
- **users**: User accounts with roles (owner/member)
- **teams**: Team entities with Stripe customer data
- **teamMembers**: User-team relationships with roles
- **activityLogs**: User action tracking
- **invitations**: Team invitation system

### Stripe Integration
- Checkout sessions with 14-day trial period
- Customer portal for subscription management
- Webhook handling for subscription changes at `/api/stripe/webhook`
- Test card: 4242 4242 4242 4242

### Environment Variables Required
- `POSTGRES_URL` - Database connection string
- `AUTH_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `BASE_URL` - Application base URL

### Development Setup
1. Run `pnpm db:setup` to create .env file
2. Run `pnpm db:migrate && pnpm db:seed` to initialize database
3. Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`