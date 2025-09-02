# CareerCopilot - AI-Powered Career Assistant

## Overview
CareerCopilot is a comprehensive AI-powered career assistant web application designed to help users with resume and cover letter creation, review, and assessment. It provides an AI Career Mentor chatbot and a Mock Interview system. The project serves as an intelligent career growth partner, offering advanced AI tools for job seekers to enhance their career prospects.

## User Preferences
Preferred communication style: Simple, everyday language.
Color scheme: Using #F08A5D (coral orange) as primary color instead of blue.
Deployment preference: Supabase for database and Vercel for hosting instead of current Replit/Neon setup.

## System Architecture

### UI/UX Decisions
- **Color Scheme**: Primary color is #F08A5D (coral orange).
- **UI Library**: Shadcn/ui components built on Radix UI primitives.
- **Styling**: Tailwind CSS with a custom design system.
- **Internationalization**: Supports Dutch and English, with Dutch as default for users and English for superadmins.

### Technical Implementations
- **Frontend**: React with TypeScript, Wouter for routing, TanStack Query for server state, and Vite as build tool.
- **Backend**: Node.js with Express.js, TypeScript, and ES modules.
- **Database**: PostgreSQL with Drizzle ORM, hosted on Supabase.
- **AI Integration**: Utilizes OpenAI API (GPT-4o model) for document processing, career mentoring, and mock interviews.
- **File Processing**: Multer for uploads, pdf-parse for PDFs, and mammoth for DOCX files.
- **Speech Processing**: OpenAI Whisper API for speech-to-text transcription in mock interviews.
- **Email Service**: Hostinger SMTP for user invitations.

### Feature Specifications
- **AI Processing Modes**: Create (generates documents), Review (feedback on documents), Assess (compares documents to job descriptions with scoring).
- **AI Career Mentor**: Chatbot with conversation history and multi-language support.
- **Mock Interview System**:
    - AI recruiter personas with dynamic question generation and answer evaluation.
    - Text-based and Avatar modes (webcam/microphone recording).
    - CV import for personalized questions.
    - Overall scoring (0-100) and category breakdowns.
    - DOCX report download with full transcripts.
    - Avatar selection with 6 diverse AI interviewer personas and text-to-speech.
- **User Management**:
    - Session-based user identification (migrated from `sessionId` to `userId`).
    - Superadmin role for user management (activate/deactivate, extend validity, subscription management).
    - Email-based user invitations (12-month default subscription).
    - Role-based access control.
- **Document Handling**: Upload, parse (PDF/DOCX), and store document content.
- **Job Applications Tracker**: CSV/Excel import/export with intelligent column mapping.
- **Performance Optimization**: Parallel processing for AI Review and Assess endpoints.

### System Design Choices
- **Session-based Architecture**: Uses session IDs for user identification.
- **Shared Schema**: TypeScript schemas in `/shared` for type safety between frontend and backend.
- **Server-side Document Parsing**: Ensures security and proper content extraction.
- **Single Server Deployment**: Production serves both static files and API from one Express instance.
- **Database Migrations**: Drizzle ORM manages schema changes.

## External Dependencies

- **Database**: Supabase (PostgreSQL)
- **AI Service**: OpenAI API (GPT-4o model, Whisper API)
- **Email Service**: Hostinger SMTP
- **UI Components**: Radix UI
- **Document Parsing Libraries**: `pdf-parse`, `mammoth`