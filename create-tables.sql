-- Create tables for CareerCopilot application
-- Based on shared/schema.ts

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "profileImageUrl" TEXT,
  role TEXT DEFAULT 'user',
  "isActive" BOOLEAN DEFAULT true,
  "accountExpiresAt" TIMESTAMP
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  "sessionId" TEXT,
  "userId" INTEGER REFERENCES users(id),
  name TEXT,
  email TEXT,
  phone TEXT,
  position TEXT,
  skills TEXT
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  "sessionId" TEXT,
  "userId" INTEGER REFERENCES users(id),
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  "uploadDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Results table
CREATE TABLE IF NOT EXISTS "aiResults" (
  id SERIAL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  mode TEXT NOT NULL,
  input TEXT NOT NULL,
  result TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Invitations table
CREATE TABLE IF NOT EXISTS "userInvitations" (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP NOT NULL,
  "isUsed" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Conversations table
CREATE TABLE IF NOT EXISTS "chatConversations" (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS "chatMessages" (
  id SERIAL PRIMARY KEY,
  "conversationId" INTEGER NOT NULL REFERENCES "chatConversations"(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for express-session)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR NOT NULL COLLATE "default",
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
) WITH (OIDS=FALSE);

ALTER TABLE sessions ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);