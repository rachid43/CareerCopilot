import { users, profiles, documents, aiResults, userInvitations, chatConversations, chatMessages, jobApplications, type User, type InsertUser, type Profile, type InsertProfile, type Document, type InsertDocument, type AiResult, type InsertAiResult, type UserInvitation, type InsertUserInvitation, type ChatConversation, type InsertChatConversation, type ChatMessage, type InsertChatMessage, type JobApplication, type InsertJobApplication } from "@shared/schema";
import { db } from './db';
import { eq, and, sql, desc } from 'drizzle-orm';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserSubscription(id: number, subscriptionStatus: string, subscriptionExpiresAt?: Date): Promise<User | undefined>;
  updateUserSubscriptionTier(id: number, subscriptionTier: string): Promise<User | undefined>;
  makeUserSuperadmin(username: string): Promise<User | undefined>;
  
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
  
  // Chat methods
  getConversations(userId: number): Promise<ChatConversation[]>;
  createConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getConversationMessages(conversationId: number): Promise<ChatMessage[]>;
  createMessage(message: InsertChatMessage): Promise<ChatMessage>;
  updateConversationTitle(conversationId: number, title: string): Promise<ChatConversation | undefined>;
  
  // Job Applications methods
  getJobApplications(userId: number): Promise<JobApplication[]>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, updates: Partial<InsertJobApplication>): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;
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
    console.log('getProfileByUserId called with userId:', userId, 'type:', typeof userId);
    
    // First try to find user by username to get the actual user ID
    const user = await this.getUserByUsername(userId);
    if (!user) {
      console.log('No user found with username:', userId);
      return undefined;
    }
    
    console.log('Found user:', user.id, 'looking for profile...');
    
    const profileResults = await db.select().from(profiles).where(eq(profiles.userId, user.id)).orderBy(desc(profiles.id));
    const profile = profileResults[0]; // Get the most recent profile
    console.log('Found profile:', profile);
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
    console.log('getDocumentsByUserId called with userId:', userId, 'type:', typeof userId);
    
    // First get the user by username to get the actual numeric user ID
    const user = await this.getUserByUsername(userId);
    if (!user) {
      console.log('No user found with username:', userId);
      return [];
    }
    
    console.log('Found user for documents retrieval:', user.id);
    
    // Query documents using the actual numeric user ID
    const results = await db.select().from(documents).where(eq(documents.userId, user.id));
    console.log('getDocumentsByUserId results:', results.length, 'documents for user ID:', user.id);
    
    return results;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    console.log('createDocument called with:', insertDocument);
    console.log('insertDocument.userId type:', typeof insertDocument.userId, 'value:', insertDocument.userId);
    
    // Remove existing document of same type first
    const deleteResult = await db
      .delete(documents)
      .where(and(
        eq(documents.sessionId, insertDocument.sessionId),
        eq(documents.type, insertDocument.type)
      ));
    console.log('Deleted existing documents of same type');

    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    
    console.log('Inserted new document:', document);
    console.log('Inserted document userId type:', typeof document.userId, 'value:', document.userId);
    
    // Immediately verify the document was stored correctly
    const verifyDocs = await db.select().from(documents).where(eq(documents.id, document.id));
    console.log('Verification query result:', verifyDocs);
    
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      await db
        .delete(documents)
        .where(eq(documents.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
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
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserSubscription(id: number, subscriptionStatus: string, subscriptionExpiresAt?: Date): Promise<User | undefined> {
    const updates: any = { 
      subscriptionStatus,
      updatedAt: new Date()
    };
    
    if (subscriptionExpiresAt !== undefined) {
      updates.subscriptionExpiresAt = subscriptionExpiresAt;
    }
    
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserSubscriptionTier(id: number, subscriptionTier: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionTier,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async makeUserSuperadmin(username: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        role: 'superadmin',
        updatedAt: new Date()
      })
      .where(eq(users.username, username))
      .returning();
    return user || undefined;
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
    try {
      await db
        .update(userInvitations)
        .set({ isUsed: true })
        .where(eq(userInvitations.token, token));
      return true;
    } catch (error) {
      console.error('Error marking invitation as used:', error);
      return false;
    }
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

  // Chat methods implementation
  async getConversations(userId: number): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt));
  }

  async createConversation(insertConversation: InsertChatConversation): Promise<ChatConversation> {
    const [conversation] = await db
      .insert(chatConversations)
      .values(insertConversation)
      .returning();
    return conversation;
  }

  async getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.conversationId, conversationId))
      .orderBy(chatMessages.createdAt);
  }

  async createMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
      
    // Update conversation's updatedAt timestamp
    await db
      .update(chatConversations)
      .set({ updatedAt: new Date() })
      .where(eq(chatConversations.id, insertMessage.conversationId));
      
    return message;
  }

  async updateConversationTitle(conversationId: number, title: string): Promise<ChatConversation | undefined> {
    const [updatedConversation] = await db
      .update(chatConversations)
      .set({ title, updatedAt: new Date() })
      .where(eq(chatConversations.id, conversationId))
      .returning();
    
    return updatedConversation || undefined;
  }

  // Job Applications methods implementation
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    return await db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(desc(jobApplications.createdAt));
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const [application] = await db
      .insert(jobApplications)
      .values(insertApplication)
      .returning();
    return application;
  }

  async updateJobApplication(id: number, updates: Partial<InsertJobApplication>): Promise<JobApplication | undefined> {
    const [updatedApplication] = await db
      .update(jobApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobApplications.id, id))
      .returning();
    
    return updatedApplication || undefined;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    try {
      await db.delete(jobApplications).where(eq(jobApplications.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting job application:', error);
      return false;
    }
  }
}

// Temporary in-memory storage to get app working while debugging Supabase connection
class MemoryStorage implements IStorage {
  private users: User[] = [];
  private profiles: Profile[] = [];
  private documents: Document[] = [];
  private aiResults: AiResult[] = [];
  private invitations: UserInvitation[] = [];
  private conversations: ChatConversation[] = [];
  private messages: ChatMessage[] = [];
  private jobApplications: JobApplication[] = [];
  private nextId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const defaultExpiry = new Date();
    defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1); // 12 months default
    
    const newUser = { 
      ...user, 
      id: this.nextId++, 
      role: user.role || 'user', 
      isActive: user.isActive ?? true,
      subscriptionStatus: user.subscriptionStatus || 'active',
      subscriptionExpiresAt: user.subscriptionExpiresAt || defaultExpiry,
      createdAt: new Date(),
      updatedAt: new Date()
    } as User;
    this.users.push(newUser);
    return newUser;
  }

  async getAllUsers(): Promise<User[]> {
    return [...this.users];
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    this.users[index] = { ...this.users[index], ...updates };
    return this.users[index];
  }

  async getProfile(sessionId: string): Promise<Profile | undefined> {
    return this.profiles.find(p => p.sessionId === sessionId);
  }

  async getProfileByUserId(userId: string): Promise<Profile | undefined> {
    const user = await this.getUserByUsername(userId);
    if (!user) return undefined;
    return this.profiles.find(p => p.userId === user.id);
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile = { ...profile, id: this.nextId++ } as Profile;
    this.profiles.push(newProfile);
    return newProfile;
  }

  async updateProfile(sessionId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const index = this.profiles.findIndex(p => p.sessionId === sessionId);
    if (index === -1) return undefined;
    this.profiles[index] = { ...this.profiles[index], ...updates };
    return this.profiles[index];
  }

  async getDocuments(sessionId: string): Promise<Document[]> {
    return this.documents.filter(d => d.sessionId === sessionId);
  }

  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    console.log('MemoryStorage.getDocumentsByUserId called with userId:', userId);
    console.log('All users:', this.users.map(u => ({ id: u.id, username: u.username })));
    const user = await this.getUserByUsername(userId);
    if (!user) {
      console.log('User not found for userId:', userId);
      console.log('Looking for username:', userId);
      return [];
    }
    console.log('Found user with id:', user.id);
    console.log('All documents:', this.documents.map(d => ({ id: d.id, filename: d.filename, userId: d.userId })));
    const userDocs = this.documents.filter(d => d.userId === user.id);
    console.log('Filtered documents for user:', userDocs.length);
    return userDocs;
  }

  async updateProfileByUserId(userId: string, updates: Partial<InsertProfile>): Promise<Profile | undefined> {
    const user = await this.getUserByUsername(userId);
    if (!user) return undefined;
    const index = this.profiles.findIndex(p => p.userId === user.id);
    if (index === -1) return undefined;
    this.profiles[index] = { ...this.profiles[index], ...updates };
    return this.profiles[index];
  }

  async createProfileForUser(userId: string, profileData: InsertProfile): Promise<Profile> {
    const user = await this.getUserByUsername(userId);
    if (!user) throw new Error('User not found');
    const newProfile = { ...profileData, userId: user.id, id: this.nextId++ } as Profile;
    this.profiles.push(newProfile);
    return newProfile;
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    console.log('MemoryStorage.createDocument called with:', document);
    const newDocument = { ...document, id: this.nextId++, uploadDate: new Date() } as Document;
    this.documents.push(newDocument);
    console.log('Created document in memory:', newDocument);
    console.log('Total documents in memory:', this.documents.length);
    return newDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const index = this.documents.findIndex(d => d.id === id);
    if (index === -1) return false;
    this.documents.splice(index, 1);
    return true;
  }

  async getAiResults(sessionId: string, mode?: string): Promise<AiResult[]> {
    return this.aiResults.filter(r => r.sessionId === sessionId && (!mode || r.mode === mode));
  }

  async createAiResult(result: InsertAiResult): Promise<AiResult> {
    const newResult = { ...result, id: this.nextId++, createdAt: new Date() } as AiResult;
    this.aiResults.push(newResult);
    return newResult;
  }

  async createInvitation(invitation: InsertUserInvitation): Promise<UserInvitation> {
    const newInvitation = { ...invitation, id: this.nextId++, createdAt: new Date() } as UserInvitation;
    this.invitations.push(newInvitation);
    return newInvitation;
  }

  async getInvitationByToken(token: string): Promise<UserInvitation | undefined> {
    return this.invitations.find(i => i.token === token);
  }

  async markInvitationAsUsed(token: string): Promise<boolean> {
    const invitation = this.invitations.find(i => i.token === token);
    if (!invitation) return false;
    (invitation as any).isUsed = true;
    return true;
  }

  async getActiveInvitations(): Promise<UserInvitation[]> {
    const now = new Date();
    return this.invitations.filter(i => !i.isUsed && i.expiresAt > now);
  }

  async getConversations(userId: number): Promise<ChatConversation[]> {
    return this.conversations.filter(c => c.userId === userId);
  }

  async createConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const newConversation = { ...conversation, id: this.nextId++, createdAt: new Date(), updatedAt: new Date() } as ChatConversation;
    this.conversations.push(newConversation);
    return newConversation;
  }

  async getConversationMessages(conversationId: number): Promise<ChatMessage[]> {
    return this.messages.filter(m => m.conversationId === conversationId);
  }

  async createMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const newMessage = { ...message, id: this.nextId++, createdAt: new Date() } as ChatMessage;
    this.messages.push(newMessage);
    return newMessage;
  }

  async updateConversationTitle(conversationId: number, title: string): Promise<ChatConversation | undefined> {
    const conversation = this.conversations.find(c => c.id === conversationId);
    if (!conversation) return undefined;
    (conversation as any).title = title;
    (conversation as any).updatedAt = new Date();
    return conversation;
  }

  // Job Applications methods for MemoryStorage
  async getJobApplications(userId: number): Promise<JobApplication[]> {
    return this.jobApplications.filter(app => app.userId === userId);
  }

  async createJobApplication(application: InsertJobApplication): Promise<JobApplication> {
    const newApplication = { 
      ...application, 
      id: this.nextId++, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    } as JobApplication;
    this.jobApplications.push(newApplication);
    return newApplication;
  }

  async updateJobApplication(id: number, updates: Partial<InsertJobApplication>): Promise<JobApplication | undefined> {
    const index = this.jobApplications.findIndex(app => app.id === id);
    if (index === -1) return undefined;
    this.jobApplications[index] = { 
      ...this.jobApplications[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    return this.jobApplications[index];
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    const index = this.jobApplications.findIndex(app => app.id === id);
    if (index === -1) return false;
    this.jobApplications.splice(index, 1);
    return true;
  }

  async updateUserSubscription(id: number, subscriptionStatus: string, subscriptionExpiresAt?: Date): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    if (!user) return undefined;
    
    user.subscriptionStatus = subscriptionStatus as any;
    if (subscriptionExpiresAt !== undefined) {
      user.subscriptionExpiresAt = subscriptionExpiresAt;
    }
    user.updatedAt = new Date();
    
    return user;
  }

  async makeUserSuperadmin(username: string): Promise<User | undefined> {
    const user = this.users.find(u => u.username === username);
    if (!user) return undefined;
    
    user.role = 'superadmin';
    user.updatedAt = new Date();
    
    return user;
  }
}

// Use Supabase PostgreSQL database for production
export const storage = new DatabaseStorage();
