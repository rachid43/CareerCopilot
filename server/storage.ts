import { users, profiles, documents, aiResults, userInvitations, type User, type InsertUser, type Profile, type InsertProfile, type Document, type InsertDocument, type AiResult, type InsertAiResult, type UserInvitation, type InsertUserInvitation } from "@shared/schema";
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  
  getProfile(sessionId: string): Promise<Profile | undefined>;
  getProfileByUserId(userId: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(sessionId: string, profile: Partial<InsertProfile>): Promise<Profile | undefined>;
  
  getDocuments(sessionId: string): Promise<Document[]>;
  getDocumentsByUserId(userId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<boolean>;
  
  getAiResults(sessionId: string, mode?: string): Promise<AiResult[]>;
  createAiResult(result: InsertAiResult): Promise<AiResult>;
  
  // User invitation methods
  createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation>;
  getInvitationByToken(token: string): Promise<UserInvitation | undefined>;
  markInvitationAsUsed(token: string): Promise<boolean>;
  getActiveInvitations(): Promise<UserInvitation[]>;
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

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const userIdNumber = parseInt(userId);
    if (isNaN(userIdNumber)) return undefined;
    
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userIdNumber));
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

  async createProfileForUser(userId: string, profileData: InsertProfile): Promise<Profile> {
    const user = await this.getUserByUsername(userId);
    if (!user) throw new Error('User not found');
    
    const [profile] = await db
      .insert(profiles)
      .values({ ...profileData, userId: user.id })
      .returning();
    
    return profile;
  }

  async updateProfileByUserId(userId: string, profileData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const user = await this.getUserByUsername(userId);
    if (!user) return undefined;
    
    const [profile] = await db
      .update(profiles)
      .set(profileData)
      .where(eq(profiles.userId, user.id))
      .returning();
    
    return profile || undefined;
  }

  async getDocuments(sessionId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.sessionId, sessionId));
  }

  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser || undefined;
  }

  async createInvitation(insertInvitation: InsertUserInvitation): Promise<UserInvitation> {
    const [invitation] = await db
      .insert(userInvitations)
      .values(insertInvitation)
      .returning();
    
    return invitation;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    const [invitation] = await db
      .select()
      .from(userInvitations)
      .where(eq(userInvitations.token, token));
    
    return invitation || undefined;
  }

  async markInvitationAsUsed(token: string): Promise<boolean> {
    const result = await db
      .update(userInvitations)
      .set({ isUsed: true })
      .where(eq(userInvitations.token, token));
    
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveInvitations(): Promise<UserInvitation[]> {
    return await db
      .select()
      .from(userInvitations)
      .where(and(
        eq(userInvitations.isUsed, false),
        // Only get invitations that haven't expired
        sql`expires_at > NOW()`
      ));
  }
}

export const storage = new DatabaseStorage();
