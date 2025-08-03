# Development Workflow

## Two-Terminal Setup

### Terminal 1: Frontend Development
```bash
cd agentic-marketing-generator
npm run dev
```
**Keep this running!** It serves your app and auto-reloads when you save files.

**Work on these files in Terminal 1:**
- `src/app/page.tsx` - Home page
- `src/app/create/page.tsx` - Create content page  
- `src/app/dashboard/page.tsx` - Dashboard
- `src/components/` - All UI components
- `src/app/globals.css` - Styles

### Terminal 2: Backend Development  
```bash
cd agentic-marketing-generator
# No separate server needed - just edit files!
```

**Work on these files in Terminal 2:**
- `src/app/api/` - All API routes
- `src/lib/agents/` - AI agent logic
- `src/lib/workflow.ts` - Business logic
- `src/types/` - TypeScript types

## How It Works

1. **One Next.js Server**: Handles both frontend and backend
2. **Auto-Reload**: Changes to any file automatically refresh the browser
3. **Same Git Repo**: All changes in one place, easy commits

## Commands You'll Use

```bash
# Start development (Terminal 1)
npm run dev

# Run tests (Terminal 2)  
npm test

# Build for production (Terminal 2)
npm run build

# Deploy to Netlify (Terminal 2)
netlify deploy --prod
```

## File Organization

```
📁 Frontend Work (Terminal 1)
├── src/app/*.tsx (pages)
├── src/components/ (UI components)
└── src/app/globals.css

📁 Backend Work (Terminal 2)  
├── src/app/api/ (API endpoints)
├── src/lib/agents/ (AI logic)
└── src/lib/ (business logic)
```

## Tips for Non-Developers

1. **Terminal 1**: Always keep `npm run dev` running
2. **Terminal 2**: Use for file editing and git commands
3. **Save Files**: Browser auto-refreshes when you save
4. **One Repo**: No complex git setup needed
5. **Same Folder**: Both terminals work in the same directory

## Git Commands (Terminal 2)

```bash
# See what changed
git status

# Add your changes  
git add .

# Save your work
git commit -m "Updated marketing page"

# Backup to GitHub
git push
```