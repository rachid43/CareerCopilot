# Supabase Migration Guide

## Prerequisites

1. Create a Supabase project at https://supabase.com
2. Get your database connection string from the project settings

## Database Setup

1. In your Supabase project dashboard, go to **Settings** > **Database**
2. Copy the connection string under "Connection string" > "Transaction pooler"
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set this as your `DATABASE_URL` environment variable

## Migration Steps

1. **Update Environment Variables**:
   ```
   DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

2. **Run Database Migration**:
   ```bash
   npm run db:push
   ```

3. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard:
     - `DATABASE_URL`
     - `OPENAI_API_KEY`
     - `SENDGRID_API_KEY`
     - `SENDGRID_FROM_EMAIL`
     - `SMTP_HOST`
     - `SMTP_PASSWORD`
     - `SMTP_PORT`
     - `SMTP_USER`

## Code Changes Made

1. **Database Driver**: Migrated from `@neondatabase/serverless` to `postgres` for better Supabase compatibility
2. **Connection**: Updated `server/db.ts` to use standard PostgreSQL connection with SSL
3. **Build Configuration**: Added `vercel.json` for proper deployment routing
4. **Error Handling**: Updated storage methods to work with the new driver

## Vercel Deployment

The project is now configured for Vercel with:
- Automatic builds using `vercel-build` script
- API routes properly routed through `/api/*`
- Static files served from `/dist/public`
- Environment variables support

## Benefits of Supabase + Vercel

- **Scalability**: Auto-scaling database and serverless functions
- **Performance**: Global CDN and edge functions
- **Cost**: Pay-as-you-go pricing model
- **Monitoring**: Built-in analytics and logging
- **Security**: Automatic SSL, connection pooling, and security updates