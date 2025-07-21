# CareerCopilot - AI-Powered Career Assistant

## Overview

CareerCopilot is a comprehensive web application that helps users create, review, and assess resumes and cover letters using AI technology. The application features a modern React frontend with a Node.js/Express backend, utilizing OpenAI's GPT models for intelligent document processing and career guidance.

## User Preferences

Preferred communication style: Simple, everyday language.
Color scheme: Using #F08A5D (coral orange) as primary color instead of blue.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration for development and production

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **File Processing**: Multer for file uploads, pdf-parse for PDFs, mammoth for DOCX files
- **AI Integration**: OpenAI API using GPT-4o model

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database (recently migrated from in-memory storage)
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Session Storage**: PostgreSQL-based storage with session-based user identification
- **File Storage**: Temporary local storage for uploaded documents (cleaned after processing)

## Key Components

### Database Schema
The application uses four main tables:
- **users**: Basic user authentication (currently unused)
- **profiles**: User personal information (name, email, phone, position, skills)
- **documents**: Uploaded CVs and cover letters with parsed content
- **aiResults**: AI processing results for all three modes (create, review, assess)

### AI Processing Modes
1. **Create Mode**: Generates new CV and cover letter from user profile and job description
2. **Review Mode**: Provides detailed feedback on uploaded documents
3. **Assess Mode**: Compares documents against job descriptions with match scoring

### Frontend Components
- **FileUpload**: Drag-and-drop file upload with validation
- **PersonalProfile**: User profile management form
- **JobDescription**: Job posting input with character limits
- **ModeSelector**: AI mode selection interface
- **ResultsDisplay**: AI results presentation with copy/download functionality

## Data Flow

1. **User Session**: Session-based identification without traditional authentication
2. **Profile Management**: Users create/update personal profiles stored in PostgreSQL
3. **Document Upload**: Files are uploaded, parsed (PDF/DOCX), and content stored in database
4. **AI Processing**: User selects mode, provides job description, and triggers AI analysis
5. **Results Display**: AI responses are stored and presented with formatting and download options

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL)
- **AI Service**: OpenAI API (GPT-4o model)
- **UI Components**: Radix UI primitives
- **File Processing**: pdf-parse, mammoth for document parsing

### Development Dependencies
- **Build Tools**: Vite, ESBuild for production builds
- **TypeScript**: Full TypeScript support across frontend and backend
- **Linting**: Implicit through TypeScript configuration

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations manage schema changes

### Environment Configuration
- **Development**: Vite dev server with Express API
- **Production**: Single Node.js server serving both static files and API
- **Database**: Requires `DATABASE_URL` environment variable
- **AI**: Requires `OPENAI_API_KEY` or `VITE_OPENAI_API_KEY`

### File Structure
```
/client          # React frontend
/server          # Express backend
/shared          # Shared TypeScript schemas
/migrations      # Drizzle database migrations
/uploads         # Temporary file storage
```

### Key Design Decisions

1. **Session-based Architecture**: Uses session IDs instead of user authentication for simplicity
2. **Shared Schema**: TypeScript schemas in `/shared` ensure type safety between frontend and backend
3. **Document Parsing**: Server-side parsing ensures security and proper content extraction
4. **Database Migration**: Recently migrated from in-memory storage to PostgreSQL for data persistence
5. **Single Server Deployment**: Production serves both static files and API from single Express instance

### Recent Changes

- **January 2025**: Added user authentication with Replit Auth integration
- **January 2025**: Migrated from in-memory storage to PostgreSQL database
- **January 2025**: Updated color scheme to coral orange (#F08A5D) as primary color
- **January 2025**: Fixed AI mode selector to stack vertically for better mobile experience

The application prioritizes user experience with a clean, accessible interface while maintaining robust backend processing for document handling and AI integration.