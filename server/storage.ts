import { users, profiles, documents, aiResults, type User, type InsertUser, type Profile, type InsertProfile, type Document, type InsertDocument, type AiResult, type InsertAiResult } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private profiles: Map<string, Profile>;
  private documents: Map<number, Document>;
  private aiResults: Map<number, AiResult>;
  private currentUserId: number;
  private currentProfileId: number;
  private currentDocumentId: number;
  private currentAiResultId: number;

  constructor() {
    this.users = new Map();
    this.profiles = new Map();
    this.documents = new Map();
    this.aiResults = new Map();
    this.currentUserId = 1;
    this.currentProfileId = 1;
    this.currentDocumentId = 1;
    this.currentAiResultId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProfile(sessionId: string): Promise<Profile | undefined> {
    return this.profiles.get(sessionId);
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = this.currentProfileId++;
    const profile: Profile = { 
      ...insertProfile, 
      id,
      phone: insertProfile.phone || null,
      position: insertProfile.position || null,
      skills: insertProfile.skills || null
    };
    this.profiles.set(insertProfile.sessionId, profile);
    return profile;
  }

  async updateProfile(sessionId: string, updateData: Partial<InsertProfile>): Promise<Profile | undefined> {
    const existing = this.profiles.get(sessionId);
    if (!existing) return undefined;
    
    const updated: Profile = { ...existing, ...updateData };
    this.profiles.set(sessionId, updated);
    return updated;
  }

  async getDocuments(sessionId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.sessionId === sessionId);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentDocumentId++;
    const document: Document = { ...insertDocument, id };
    this.documents.set(id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async getAiResults(sessionId: string, mode?: string): Promise<AiResult[]> {
    const results = Array.from(this.aiResults.values()).filter(result => result.sessionId === sessionId);
    if (mode) {
      return results.filter(result => result.mode === mode);
    }
    return results;
  }

  async createAiResult(insertAiResult: InsertAiResult): Promise<AiResult> {
    const id = this.currentAiResultId++;
    const result: AiResult = { ...insertAiResult, id };
    this.aiResults.set(id, result);
    return result;
  }
}

export const storage = new MemStorage();
