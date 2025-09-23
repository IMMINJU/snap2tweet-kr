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

## Next.js Migration Plan

**STATUS**: Planned - migrating from Express + Vite to Next.js App Router

### Migration Constraints
- **MINIMIZE CHANGES**: Keep existing UI, API behavior, and data structures unchanged
- **NO FUNCTIONAL MODIFICATIONS**: Maintain exact same user experience and API responses
- **PRESERVE EXISTING LOGIC**: Only change framework/architecture, not business logic

### Migration Steps
1. **Project Initialization**
   - Create Next.js project with TypeScript, Tailwind, App Router
   - Remove Express dependencies: `express`, `express-session`, `connect-pg-simple`
   - Remove Vite dependencies: `vite`, `@vitejs/plugin-react`
   - Remove routing: `wouter` (use Next.js router)

2. **Folder Structure Conversion**
   ```
   src/app/                 # Next.js App Router
   ├── layout.tsx          # Root layout
   ├── page.tsx            # Home (/)
   ├── results/page.tsx    # Results (/results)
   ├── shared/[id]/page.tsx # Shared (/shared/[id])
   └── api/                # API Routes
       ├── generate-tweet/route.ts
       ├── share/route.ts
       └── shared/[id]/
           ├── route.ts
           └── image/route.ts
   src/components/         # UI components (from client/src/components)
   src/lib/               # Utils + shared schemas
   src/hooks/             # Custom hooks
   ```

3. **API Routes Migration**
   - Convert Express routes to Next.js Route Handlers
   - Change from `(req, res)` to `Request/Response` pattern
   - **PRESERVE EXACT API BEHAVIOR**: Keep same request/response formats, error handling, and status codes
   - Maintain existing business logic and database connections without modification

4. **Component Migration**
   - Convert pages from Wouter to Next.js pages
   - Replace `wouter` Link with Next.js Link
   - **PRESERVE EXACT UI**: Keep existing UI components, hooks, and styling without visual changes
   - Maintain same component props, state management, and user interactions

5. **Metadata & SSR Enhancement**
   - Use Next.js metadata API for social sharing
   - Implement proper SSR for shared pages
   - **PRESERVE EXACT METADATA**: Maintain identical Open Graph and Twitter Card meta tags
   - Keep same social sharing behavior and preview generation

6. **Configuration Updates**
   - Create `next.config.js`
   - Update `tailwind.config.ts` for Next.js
   - Simplify `package.json` scripts
   - Remove `vercel.json` complexity (Next.js handles deployment)

### Benefits
- Remove Express/Vercel Functions complexity
- Better SSR and metadata handling
- Unified development experience
- Automatic optimizations (images, fonts, etc.)
- Simpler deployment to Vercel

### Files and Dependencies to Remove

#### Complete File Removal
```bash
server/                    # Entire Express server folder
├── index.ts              # Express app setup
├── vite.ts               # Vite dev server integration
├── routes.ts             # Express routes (already migrated to api/)
├── storage.ts            # Express session storage
└── db.ts                 # (move to lib/)

vite.config.ts            # Replaced by Next.js
vercel.json               # Next.js handles deployment automatically
client/index.html         # Next.js auto-generates
client/src/main.tsx       # Next.js handles automatically
client/src/App.tsx        # Convert to layout.tsx
```

#### Package.json Dependencies to Remove
```json
{
  "dependencies": {
    "express": "^4.21.2",           // Express server
    "express-session": "^1.18.1",  // Session management (unused)
    "connect-pg-simple": "^10.0.0", // Session storage
    "memorystore": "^1.6.7",       // Memory sessions
    "passport": "^0.7.0",          // Authentication (unused)
    "passport-local": "^1.0.0",    // Local auth
    "wouter": "^3.3.5"            // Client routing
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.2",  // Vite React
    "vite": "^5.4.19",                 // Vite build tool
    "@vercel/node": "^3.0.0"           // Vercel Functions
  }
}
```

#### Code Elements to Remove
- `wouter` routing (Link, Route, Router components)
- Express-related types and middleware
- Vite HMR related code
- Session/authentication code (currently unused)
- WebSocket related code

#### Files to Keep (with modifications)
- `postcss.config.js` - Tailwind setup
- `components.json` - shadcn/ui configuration
- `tailwind.config.ts` - Style configuration (update paths)
- `drizzle.config.ts` - Database configuration
- All UI components in `client/src/components/`
- API logic in `api/` folder (convert to Next.js route handlers)

**Result**: ~15 files removed + 10 dependencies removed = significantly smaller project size