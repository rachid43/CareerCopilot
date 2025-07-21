import { users, profiles, documents, aiResults, type User, type InsertUser, type Profile, type InsertProfile, type Document, type InsertDocument, type AiResult, type InsertAiResult } from "@shared/schema";
import { db } from './db';
import { eq, and } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProfile(sessionId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(sessionId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  getDocuments(sessionId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  getAiResults(sessionId: string, mode?: string): Promise<AiResult[]>;
  createAiResult(result: InsertAiResult): Promise<AiResult>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProfile(sessionId: string): Promise<Profile | undefined> {
    const [profile] = await db.select().from(profiles).where(eq(profiles.sessionId, sessionId));
    return profile || undefined;
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const [profile] = await db
      .insert(profiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async updateProfile(sessionId: string, updateData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const existingProfile = await this.getProfile(sessionId);
    
    if (!existingProfile) return undefined;

    const [updatedProfile] = await db
      .update(profiles)
      .set(updateData)
      .where(eq(profiles.sessionId, sessionId))
      .returning();
    
    return updatedProfile;
  }

  async getDocuments(sessionId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.sessionId, sessionId));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    // Remove existing document of same type first
    await db
      .delete(documents)
      .where(and(
        eq(documents.sessionId, insertDocument.sessionId),
        eq(documents.type, insertDocument.type)
      ));

    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db
      .delete(documents)
      .where(eq(documents.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getAiResults(sessionId: string, mode?: string): Promise<AiResult[]> {
    if (mode) {
      return await db.select().from(aiResults).where(
        and(
          eq(aiResults.sessionId, sessionId),
          eq(aiResults.mode, mode)
        )
      );
    }
    
    return await db.select().from(aiResults).where(eq(aiResults.sessionId, sessionId));
  }

  async createAiResult(insertAiResult: InsertAiResult): Promise<AiResult> {
    const [aiResult] = await db
      .insert(aiResults)
      .values(insertAiResult)
      .returning();
    
    return aiResult;
  }
}

export const storage = new DatabaseStorage();
