# Licencia Manager Pro - Copilot Instructions

## Project Context
This is a full-stack web application for managing driver's license processes in Chilean municipalities.

## Tech Stack
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Python + FastAPI + SQLAlchemy
- **Database**: SQLite
- **AI Integration**: Google Gemini API

## Code Conventions

### TypeScript/React
- Use functional components with hooks
- Prefer `interface` over `type` for object shapes
- Use Lucide icons for UI icons
- Follow existing component patterns in `/components`

### Python/FastAPI
- Use Pydantic schemas for validation
- Follow RESTful conventions in routers
- Use SQLAlchemy ORM for database operations
- Add audit logs for important actions

## File Structure
- `/backend/routers/*.py` - API endpoints by feature
- `/components/*.tsx` - React components
- `/services/*.ts` - API client and auth services
- `/types.ts` - TypeScript type definitions

## Important Patterns
1. All API calls go through `services/api.ts`
2. Authentication uses JWT tokens stored in localStorage
3. User roles: `admin`, `operator`, `viewer`
4. License states: PENDIENTE → EN_PROCESO → APROBADA → LISTA_PARA_ENTREGA → ENTREGADA

## Language
- Code comments: English
- UI text: Spanish (Chilean)
- Variable names: English
