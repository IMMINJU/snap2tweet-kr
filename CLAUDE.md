# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Package Manager**: This project uses pnpm

```bash
# Development mode (with hot reload)
pnpm dev

# Build for production
pnpm build

# Production server
pnpm start

# Type checking
pnpm check

# Database schema push
pnpm db:push

# Install dependencies
pnpm install
```

## Project Architecture

This is a Korean tweet generation application using AI to create social media content from food photos. The application consists of:

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite build tool
- **UI**: shadcn/ui components on Radix UI primitives with Tailwind CSS
- **Routing**: Wouter for client-side routing with 3 main routes:
  - `/` - Input form for uploading images and entering menu details
  - `/results` - Generated tweets display with sharing functionality
  - `/shared/:id` - Public pages for shared tweets
- **State**: TanStack Query for server state, sessionStorage for temporary data
- **Forms**: React Hook Form with Zod validation
- **File Upload**: React Dropzone for image handling

### Backend (Express + TypeScript)
- **Server**: Express.js with TypeScript ES modules
- **Database**: PostgreSQL via Drizzle ORM (configured for Neon Database)
- **AI**: OpenAI GPT-4o integration for tweet generation
- **File Handling**: Multer for multipart uploads, base64 encoding for API transmission
- **Sessions**: Express sessions with PostgreSQL storage

### Key API Endpoints
- `POST /api/generate-tweet` - Generate tweets from images and metadata
- `POST /api/share` - Create shareable links for tweet results
- `GET /api/share/:id` - Retrieve shared tweet data
- `GET /shared/:id` - Server-rendered pages with social meta tags
- `GET /shared/:id/image` - Image serving for social previews

### Database Schema
- **shared_tweets table**: Stores shareable tweet results with images, metadata, and generated content
- **Schema location**: `shared/schema.ts` with Zod validation schemas
- **Types**: Satisfaction levels: ["애매함", "나쁘지 않음", "맛있음", "개쩜"]
- **Tweet tones**: ["솔직톤", "드립톤", "극단톤"]

### Directory Structure
- `client/` - React frontend application
- `server/` - Express backend with API routes
- `shared/` - Shared types, schemas, and validation between frontend/backend
- `dist/` - Production build output

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string (Neon Database)
- `OPENAI_API_KEY` - OpenAI API access key

### Development Notes
- Uses TypeScript strict mode across entire codebase
- Path aliases: `@/*` for client src, `@shared/*` for shared code
- Hot reload via Vite HMR (frontend) and tsx (backend)
- Image processing: 10MB max file size, base64 encoding for OpenAI API
- Social sharing: Open Graph and Twitter Card meta tags for rich previews

## Vercel Deployment Requirements

When deploying to Vercel, the following changes are required:

### 1. Convert Express Routes to Vercel Functions
- Move `server/routes.ts` endpoints to individual files in `api/` folder
- Create `api/generate-tweet.ts` for POST /api/generate-tweet
- Create `api/share.ts` for POST /api/share
- Create `api/shared/[id].ts` for GET /shared/:id (social meta page)
- Create `api/shared/[id]/image.ts` for GET /shared/:id/image

### 2. Required Configuration Files
- Add `vercel.json` with proper rewrites and function configuration
- Update build commands to use Vite only (remove Express server build)
- Use `pnpm` as package manager in Vercel settings

### 3. Function Structure
Each API function should:
- Export default handler function with (req, res) parameters
- Import required dependencies (db, OpenAI, multer, etc.)
- Handle CORS headers for cross-origin requests
- Use proper error handling and response formats

### 4. Environment Variables
Configure in Vercel dashboard:
- `DATABASE_URL` - Neon PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API access key

### 5. File Upload Handling
- Use `@vercel/node` compatible multer configuration
- Maintain existing base64 encoding for OpenAI API transmission