var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/interview-ai.ts
var interview_ai_exports = {};
__export(interview_ai_exports, {
  InterviewAI: () => InterviewAI
});
import OpenAI from "openai";
var openai, InterviewAI;
var init_interview_ai = __esm({
  "server/interview-ai.ts"() {
    "use strict";
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    InterviewAI = class {
      async generateQuestion(context) {
        const { jobTitle, company, jobDescription, interviewType, difficultyLevel, recruiterPersona, language, currentQuestionIndex, previousQuestions, cvContent } = context;
        const languageMap = {
          "nl": "Dutch",
          "en": "English",
          "ar": "Arabic",
          "tr": "Turkish"
        };
        const responseLanguage = languageMap[language] || "English";
        let questionType = "behavioral";
        if (currentQuestionIndex === 0) {
          questionType = "opening";
        } else if (currentQuestionIndex >= 8) {
          questionType = "closing";
        } else {
          switch (interviewType) {
            case "behavioral":
              questionType = Math.random() > 0.3 ? "behavioral" : "situational";
              break;
            case "technical":
              questionType = Math.random() > 0.2 ? "technical" : "behavioral";
              break;
            case "situational":
              questionType = Math.random() > 0.3 ? "situational" : "behavioral";
              break;
            case "mixed":
              const types = ["behavioral", "technical", "situational"];
              questionType = types[Math.floor(Math.random() * types.length)];
              break;
          }
        }
        const personaContext = {
          friendly: "You are a warm, encouraging recruiter who asks questions with genuine interest and provides supportive follow-ups.",
          formal: "You are a professional, structured recruiter who asks precise questions and maintains a business-like tone throughout.",
          challenging: "You are a thorough recruiter who asks probing questions and seeks detailed examples to really test the candidate's capabilities."
        };
        const difficultyContext = {
          junior: "Focus on foundational knowledge, willingness to learn, and basic problem-solving abilities.",
          mid: "Focus on practical experience, leadership potential, and ability to work independently on complex tasks.",
          senior: "Focus on strategic thinking, mentorship abilities, architecture decisions, and industry expertise."
        };
        const prompt = `You are an AI recruiter conducting a ${interviewType} interview for a ${jobTitle} position at ${company}.

CONTEXT:
- Position: ${jobTitle}
- Company: ${company}
- Interview Type: ${interviewType}
- Difficulty: ${difficultyLevel}
- Your Persona: ${personaContext[recruiterPersona]}
- Question Number: ${currentQuestionIndex + 1}
- Expected Question Type: ${questionType}
- Language: Respond in ${responseLanguage}

JOB REQUIREMENTS:
${jobDescription.substring(0, 1e3)}

${cvContent ? `CANDIDATE CV SUMMARY:
${cvContent.substring(0, 800)}

PERSONALIZATION: Use the candidate's CV to create targeted questions about their specific experience, skills, and achievements. Reference their background when relevant.` : ""}

DIFFICULTY FOCUS:
${difficultyContext[difficultyLevel]}

PREVIOUS QUESTIONS (avoid repetition):
${previousQuestions.join("\n")}

Generate a ${questionType} interview question that:
1. Is appropriate for the ${difficultyLevel} level
2. Relates to the job requirements
3. Matches your ${recruiterPersona} persona
4. Follows natural interview progression
5. Is different from previous questions
${cvContent ? "6. References or builds upon the candidate's CV experience when relevant" : ""}

Respond in JSON format:
{
  "question": "Your interview question in ${responseLanguage}",
  "questionType": "${questionType}",
  "expectedTopics": ["topic1", "topic2", "topic3"]
}`;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: "You are an expert AI recruiter specializing in conducting realistic job interviews. Respond only with valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 500
          });
          return JSON.parse(response.choices[0].message.content || "{}");
        } catch (error) {
          console.error("Error generating interview question:", error);
          return {
            question: "Can you tell me about yourself and what interests you about this role?",
            questionType: "opening",
            expectedTopics: ["background", "motivation", "interest"]
          };
        }
      }
      async evaluateAnswer(context, question, answer) {
        const { jobTitle, jobDescription, difficultyLevel, language } = context;
        const languageMap = {
          "nl": "Dutch",
          "en": "English",
          "ar": "Arabic",
          "tr": "Turkish"
        };
        const responseLanguage = languageMap[language] || "English";
        const prompt = `Evaluate this interview answer for a ${jobTitle} position.

QUESTION: ${question}
ANSWER: ${answer}
POSITION LEVEL: ${difficultyLevel}
JOB CONTEXT: ${jobDescription.substring(0, 800)}

Evaluate based on:
1. Relevance to the question (25%)
2. Depth and specificity of examples (25%) 
3. Communication clarity (20%)
4. Job-relevant skills demonstration (20%)
5. Professional confidence (10%)

Score: 1-10 scale
Language: Respond in ${responseLanguage}

Provide JSON response:
{
  "score": 7,
  "feedback": "Detailed constructive feedback in ${responseLanguage}",
  "suggestions": ["Specific improvement suggestion 1", "suggestion 2"],
  "strengths": ["What was done well 1", "strength 2"],
  "improvements": ["Area for improvement 1", "area 2"]
}`;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: "You are an expert interview evaluator providing constructive feedback. Respond only with valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
            max_tokens: 600
          });
          return JSON.parse(response.choices[0].message.content || "{}");
        } catch (error) {
          console.error("Error evaluating answer:", error);
          return {
            score: 5,
            feedback: "Unable to evaluate answer at this time.",
            suggestions: ["Try providing more specific examples"],
            strengths: ["Responded to the question"],
            improvements: ["Add more detail and examples"]
          };
        }
      }
      async generateFinalFeedback(context, questions, answers, forcedStop, currentProgress) {
        const { jobTitle, company, language, difficultyLevel } = context;
        const languageMap = {
          "nl": "Dutch",
          "en": "English",
          "ar": "Arabic",
          "tr": "Turkish"
        };
        const responseLanguage = languageMap[language] || "English";
        const qaText = questions.map((q, i) => `Q${i + 1}: ${q}
A${i + 1}: ${answers[i] || "No answer provided"}`).join("\n\n");
        const stopInfo = forcedStop && currentProgress ? `

NOTE: Interview was stopped early after ${currentProgress.questionsAnswered} out of ${currentProgress.totalQuestions} questions.` : "";
        const prompt = `Provide comprehensive interview feedback for ${jobTitle} at ${company}.

INTERVIEW TRANSCRIPT:
${qaText}${stopInfo}

POSITION LEVEL: ${difficultyLevel}
LANGUAGE: Respond in ${responseLanguage}

Analyze and provide:
1. Overall interview performance
2. Category-specific scores (1-10)
3. Top strengths demonstrated
4. Key improvement areas  
5. Actionable recommendations

JSON format:
{
  "overallScore": 75,
  "summary": "Comprehensive interview summary in ${responseLanguage}",
  "categoryScores": {
    "communication": 8,
    "technical": 7, 
    "cultural": 6,
    "experience": 7
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"], 
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: "You are an expert interview analyst providing comprehensive performance feedback. Respond only with valid JSON." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 800
          });
          return JSON.parse(response.choices[0].message.content || "{}");
        } catch (error) {
          console.error("Error generating final feedback:", error);
          return {
            overallScore: 60,
            summary: "Interview completed successfully.",
            categoryScores: {
              communication: 6,
              technical: 6,
              cultural: 6,
              experience: 6
            },
            strengths: ["Participated actively", "Answered all questions"],
            improvements: ["Provide more specific examples", "Show more enthusiasm"],
            recommendations: ["Practice behavioral questions", "Research company culture"]
          };
        }
      }
    };
  }
});

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
import OpenAI2 from "openai";
import Stripe from "stripe";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  aiResults: () => aiResults,
  chatConversations: () => chatConversations,
  chatMessages: () => chatMessages,
  documents: () => documents,
  insertAiResultSchema: () => insertAiResultSchema,
  insertChatConversationSchema: () => insertChatConversationSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertDocumentSchema: () => insertDocumentSchema,
  insertInterviewFeedbackSchema: () => insertInterviewFeedbackSchema,
  insertInterviewQASchema: () => insertInterviewQASchema,
  insertInterviewSessionSchema: () => insertInterviewSessionSchema,
  insertJobApplicationSchema: () => insertJobApplicationSchema,
  insertProfileSchema: () => insertProfileSchema,
  insertUserInvitationSchema: () => insertUserInvitationSchema,
  insertUserSchema: () => insertUserSchema,
  interviewFeedback: () => interviewFeedback,
  interviewQA: () => interviewQA,
  interviewSessions: () => interviewSessions,
  jobApplications: () => jobApplications,
  profiles: () => profiles,
  sessions: () => sessions,
  userInvitations: () => userInvitations,
  users: () => users
});
import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  varchar,
  jsonb,
  boolean,
  index,
  date
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  firstName: text("firstName"),
  lastName: text("lastName"),
  profileImageUrl: text("profileImageUrl"),
  role: text("role").notNull().default("user"),
  // 'user' | 'superadmin'
  isActive: boolean("isActive").notNull().default(true),
  accountExpiresAt: timestamp("accountExpiresAt"),
  subscriptionStatus: text("subscriptionStatus").notNull().default("active"),
  // 'active' | 'hold' | 'cancelled'
  subscriptionTier: text("subscriptionTier").notNull().default("essential"),
  // 'essential' | 'professional' | 'elite'
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  // Stripe integration fields
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});
var profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  position: text("position"),
  skills: text("skills"),
  experience: text("experience"),
  languages: text("languages"),
  sessionId: text("sessionId").notNull(),
  userId: integer("userId").references(() => users.id)
});
var documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(),
  // 'cv' | 'cover-letter'
  sessionId: text("sessionId").notNull(),
  userId: integer("userId").references(() => users.id)
});
var aiResults = pgTable("ai_results", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(),
  // 'create' | 'review' | 'assess'
  input: text("input").notNull(),
  result: text("result").notNull(),
  sessionId: text("sessionId").notNull()
});
var chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull().references(() => users.id),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow()
});
var chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull().references(() => chatConversations.id),
  role: text("role").notNull(),
  // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow()
});
var userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  invitedBy: integer("invited_by").references(() => users.id),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  appliedRoles: text("applied_roles").notNull(),
  company: text("company").notNull(),
  applyDate: date("apply_date").notNull(),
  whereApplied: text("where_applied").notNull(),
  // 'LinkedIn' | 'Website' | 'Referral' | 'Other'
  credentialsUsed: text("credentials_used"),
  commentsInformation: text("comments_information"),
  response: text("response").notNull().default("No Response"),
  // 'No Response' | 'Interview' | 'Offer' | 'Rejected' | 'Open' | 'Under Interview' | 'WithDrawn' | 'Other'
  responseDate: date("response_date"),
  locationCity: text("location_city"),
  locationCountry: text("location_country"),
  interviewComments: text("interview_comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobDescription: text("job_description").notNull(),
  interviewType: text("interview_type").notNull(),
  // 'behavioral' | 'technical' | 'situational' | 'mixed'
  difficultyLevel: text("difficulty_level").notNull().default("mid"),
  // 'junior' | 'mid' | 'senior'
  recruiterPersona: text("recruiter_persona").notNull().default("friendly"),
  // 'friendly' | 'formal' | 'challenging'
  status: text("status").notNull().default("active"),
  // 'active' | 'completed' | 'paused'
  totalQuestions: integer("total_questions").notNull().default(0),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  overallScore: integer("overall_score"),
  // 1-100 scale
  duration: integer("duration"),
  // in minutes
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var interviewQA = pgTable("interview_qa", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(),
  // 'opening' | 'behavioral' | 'technical' | 'situational' | 'closing'
  userAnswer: text("user_answer").notNull(),
  answerScore: integer("answer_score"),
  // 1-10 scale
  feedback: text("feedback"),
  // AI feedback on the answer
  suggestions: text("suggestions"),
  // Improvement suggestions
  responseTime: integer("response_time"),
  // in seconds
  createdAt: timestamp("created_at").defaultNow()
});
var interviewFeedback = pgTable("interview_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id),
  category: text("category").notNull(),
  // 'communication' | 'content' | 'confidence' | 'technical' | 'overall'
  score: integer("score").notNull(),
  // 1-10 scale
  strengths: text("strengths"),
  // JSON array of strengths
  improvements: text("improvements"),
  // JSON array of improvement areas
  detailedFeedback: text("detailed_feedback"),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertProfileSchema = createInsertSchema(profiles).omit({
  id: true
});
var insertDocumentSchema = createInsertSchema(documents).omit({
  id: true
});
var insertAiResultSchema = createInsertSchema(aiResults).omit({
  id: true
});
var insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true
});
var insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});
var insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInterviewQASchema = createInsertSchema(interviewQA).omit({
  id: true,
  createdAt: true
});
var insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).omit({
  id: true,
  createdAt: true
});

// server/db.ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
var databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Please configure your Supabase database connection string."
  );
}
var sql = postgres(databaseUrl, {
  ssl: "require",
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 30
});
var db = drizzle(sql, { schema: schema_exports });

// server/storage.ts
import { eq, and, sql as sql2, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async getUserByStripeCustomerId(stripeCustomerId) {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getProfile(sessionId) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.sessionId, sessionId));
    return profile || void 0;
  }
  async getProfileByUserId(userId) {
    console.log("getProfileByUserId called with userId:", userId, "type:", typeof userId);
    const user = await this.getUserByUsername(userId);
    if (!user) {
      console.log("No user found with username:", userId);
      return void 0;
    }
    console.log("Found user:", user.id, "looking for profile...");
    const profileResults = await db.select().from(profiles).where(eq(profiles.userId, user.id)).orderBy(desc(profiles.id));
    const profile = profileResults[0];
    console.log("Found profile:", profile);
    return profile || void 0;
  }
  async createProfile(insertProfile) {
    const [profile] = await db.insert(profiles).values(insertProfile).returning();
    return profile;
  }
  async updateProfile(sessionId, updateData) {
    const existingProfile = await this.getProfile(sessionId);
    if (!existingProfile) return void 0;
    const [updatedProfile] = await db.update(profiles).set(updateData).where(eq(profiles.sessionId, sessionId)).returning();
    return updatedProfile;
  }
  async createProfileForUser(userId, profileData) {
    const user = await this.getUserByUsername(userId);
    if (!user) throw new Error("User not found");
    const [profile] = await db.insert(profiles).values({ ...profileData, userId: user.id }).returning();
    return profile;
  }
  async updateProfileByUserId(userId, profileData) {
    const user = await this.getUserByUsername(userId);
    if (!user) return void 0;
    const [profile] = await db.update(profiles).set(profileData).where(eq(profiles.userId, user.id)).returning();
    return profile || void 0;
  }
  async getDocuments(sessionId) {
    return await db.select().from(documents).where(eq(documents.sessionId, sessionId));
  }
  async getDocumentsByUserId(userId) {
    console.log("getDocumentsByUserId called with userId:", userId, "type:", typeof userId);
    const user = await this.getUserByUsername(userId);
    if (!user) {
      console.log("No user found with username:", userId);
      return [];
    }
    console.log("Found user for documents retrieval:", user.id);
    const results = await db.select().from(documents).where(eq(documents.userId, user.id));
    console.log("getDocumentsByUserId results:", results.length, "documents for user ID:", user.id);
    return results;
  }
  async createDocument(insertDocument) {
    console.log("createDocument called with:", insertDocument);
    console.log("insertDocument.userId type:", typeof insertDocument.userId, "value:", insertDocument.userId);
    const deleteResult = await db.delete(documents).where(and(
      eq(documents.sessionId, insertDocument.sessionId),
      eq(documents.type, insertDocument.type)
    ));
    console.log("Deleted existing documents of same type");
    const [document] = await db.insert(documents).values(insertDocument).returning();
    console.log("Inserted new document:", document);
    console.log("Inserted document userId type:", typeof document.userId, "value:", document.userId);
    const verifyDocs = await db.select().from(documents).where(eq(documents.id, document.id));
    console.log("Verification query result:", verifyDocs);
    return document;
  }
  async deleteDocument(id) {
    try {
      await db.delete(documents).where(eq(documents.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting document:", error);
      return false;
    }
  }
  async getAiResults(sessionId, mode) {
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
  async createAiResult(insertAiResult) {
    const [aiResult] = await db.insert(aiResults).values(insertAiResult).returning();
    return aiResult;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUserSubscription(id, subscriptionStatus, subscriptionExpiresAt) {
    const updates = {
      subscriptionStatus,
      updatedAt: /* @__PURE__ */ new Date()
    };
    if (subscriptionExpiresAt !== void 0) {
      updates.subscriptionExpiresAt = subscriptionExpiresAt;
    }
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async updateUserSubscriptionTier(id, subscriptionTier) {
    const [user] = await db.update(users).set({
      subscriptionTier,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async makeUserSuperadmin(username) {
    const [user] = await db.update(users).set({
      role: "superadmin",
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.username, username)).returning();
    return user || void 0;
  }
  async updateUser(id, updates) {
    const [updatedUser] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updatedUser || void 0;
  }
  async createInvitation(insertInvitation) {
    const [invitation] = await db.insert(userInvitations).values(insertInvitation).returning();
    return invitation;
  }
  async getInvitationByToken(token) {
    const [invitation] = await db.select().from(userInvitations).where(eq(userInvitations.token, token));
    return invitation || void 0;
  }
  async markInvitationAsUsed(token) {
    try {
      await db.update(userInvitations).set({ isUsed: true }).where(eq(userInvitations.token, token));
      return true;
    } catch (error) {
      console.error("Error marking invitation as used:", error);
      return false;
    }
  }
  async getActiveInvitations() {
    return await db.select().from(userInvitations).where(and(
      eq(userInvitations.isUsed, false),
      // Only get invitations that haven't expired
      sql2`expires_at > NOW()`
    ));
  }
  // Chat methods implementation
  async getConversations(userId) {
    return await db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.updatedAt));
  }
  async createConversation(insertConversation) {
    const [conversation] = await db.insert(chatConversations).values(insertConversation).returning();
    return conversation;
  }
  async getConversationMessages(conversationId) {
    return await db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(chatMessages.createdAt);
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(chatMessages).values(insertMessage).returning();
    await db.update(chatConversations).set({ updatedAt: /* @__PURE__ */ new Date() }).where(eq(chatConversations.id, insertMessage.conversationId));
    return message;
  }
  async updateConversationTitle(conversationId, title) {
    const [updatedConversation] = await db.update(chatConversations).set({ title, updatedAt: /* @__PURE__ */ new Date() }).where(eq(chatConversations.id, conversationId)).returning();
    return updatedConversation || void 0;
  }
  // Job Applications methods implementation
  async getJobApplications(userId) {
    return await db.select().from(jobApplications).where(eq(jobApplications.userId, userId)).orderBy(desc(jobApplications.createdAt));
  }
  async createJobApplication(insertApplication) {
    const [application] = await db.insert(jobApplications).values(insertApplication).returning();
    return application;
  }
  async updateJobApplication(id, updates) {
    const [updatedApplication] = await db.update(jobApplications).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(jobApplications.id, id)).returning();
    return updatedApplication || void 0;
  }
  async deleteJobApplication(id) {
    try {
      await db.delete(jobApplications).where(eq(jobApplications.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting job application:", error);
      return false;
    }
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import MemoryStore from "memorystore";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const memoryStore = MemoryStore(session);
  const sessionStore = new memoryStore({
    checkPeriod: 864e5
    // prune expired entries every 24h
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  const existingUser = await storage.getUserByUsername(claims["sub"]);
  if (!existingUser) {
    await storage.createUser({
      username: claims["sub"],
      email: claims["email"] || null,
      firstName: claims["firstName"] || null,
      lastName: claims["lastName"] || null,
      profileImageUrl: claims["profileImageUrl"] || null
    });
  }
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
      isDevelopmentLoggedOut = false;
      return res.redirect("/");
    }
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      if (process.env.NODE_ENV === "development") {
        isDevelopmentLoggedOut = true;
        return res.redirect("/");
      }
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isDevelopmentLoggedOut = false;
var isAuthenticated = async (req, res, next) => {
  if (process.env.NODE_ENV === "development") {
    if (isDevelopmentLoggedOut) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = {
      claims: {
        sub: "dev-user-123",
        email: "admin@careercopilot.demo",
        first_name: "Demo",
        last_name: "Administrator"
      }
    };
    req.isAuthenticated = () => true;
    try {
      const existingUser = await storage.getUserByUsername("dev-user-123");
      if (!existingUser) {
        await storage.createUser({
          username: "dev-user-123",
          email: "admin@careercopilot.demo",
          firstName: "Demo",
          lastName: "Administrator",
          profileImageUrl: null
        });
      }
    } catch (error) {
      console.log("Development user creation/check failed:", error);
    }
    return next();
  }
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/emailServiceSMTP.ts
import nodemailer from "nodemailer";
async function sendEmailSMTP(params) {
  try {
    console.log("Sending email with Hostinger SMTP...");
    console.log("To:", params.to);
    console.log("Subject:", params.subject);
    if (!process.env.SMTP_PASSWORD || !process.env.SMTP_HOST) {
      console.error("Hostinger SMTP credentials not configured");
      return false;
    }
    console.log("SMTP Host:", process.env.SMTP_HOST);
    console.log("SMTP Port:", process.env.SMTP_PORT);
    console.log("SMTP User:", process.env.SMTP_USER);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: parseInt(process.env.SMTP_PORT || "587") === 465,
      // true for 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        // Don't fail on invalid certs
        rejectUnauthorized: false
      }
    });
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      // Use SMTP user as sender
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html
    });
    console.log("Email sent successfully via Hostinger SMTP");
    return true;
  } catch (error) {
    console.error("Hostinger SMTP email error:", error);
    console.error("Error message:", error.message);
    return false;
  }
}
async function sendEmailWithFallback(params) {
  try {
    console.log("Attempting to send email via Hostinger SMTP...");
    const success = await Promise.race([
      sendEmailSMTP(params),
      new Promise(
        (_, reject) => setTimeout(() => reject(new Error("Email timeout after 10 seconds")), 1e4)
      )
    ]);
    if (success) {
      console.log("\u2705 Email sent successfully");
      return true;
    } else {
      console.log("\u274C Email sending failed");
      return false;
    }
  } catch (error) {
    console.error("Email service error:", error.message);
    return false;
  }
}
function generateInvitationEmail(email, token, inviterName) {
  const baseUrl = process.env.REPLIT_DOMAINS ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` : "https://careercopilot.replit.app";
  const inviteUrl = `${baseUrl}/invite/${token}`;
  return {
    to: email,
    from: process.env.SMTP_USER || "info@maptheorie.nl",
    subject: "Welcome to CareerCopilot - Complete Your Account Setup",
    text: `
Hello,

You've been invited by ${inviterName} to join CareerCopilot, an AI-powered career assistant.

To complete your account setup, please visit: ${inviteUrl}

This invitation will expire in 30 days.

Best regards,
CareerCopilot Team
    `,
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #F08A5D;">Welcome to CareerCopilot!</h2>
  
  <p>Hello,</p>
  
  <p>You've been invited by <strong>${inviterName}</strong> to join CareerCopilot, an AI-powered career assistant that helps you create outstanding CVs and cover letters.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${inviteUrl}" style="background-color: #F08A5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Account Setup</a>
  </div>
  
  <p>Or copy and paste this link into your browser:</p>
  <p style="word-break: break-all; color: #666;">${inviteUrl}</p>
  
  <p><strong>Important:</strong> This invitation will expire in 30 days.</p>
  
  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
  
  <p style="color: #666; font-size: 12px;">
    Best regards,<br>
    CareerCopilot Team<br>
    <a href="mailto:info@maptheorie.nl">info@maptheorie.nl</a>
  </p>
</div>
    `
  };
}

// server/routes.ts
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
var openai2 = new OpenAI2({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
});
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
}
var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil"
});
var upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }
  // 100MB limit
});
function getSessionId(req) {
  return req.sessionID || req.headers["x-session-id"] || "default-session";
}
function getUserId(req) {
  return req.user?.claims?.sub || "anonymous";
}
var isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await storage.getUserByUsername(userId);
    if (!user || user.role !== "superadmin") {
      return res.status(403).json({ message: "Superadmin access required" });
    }
    if (!user.isActive || user.accountExpiresAt && /* @__PURE__ */ new Date() > user.accountExpiresAt) {
      return res.status(403).json({ message: "Account inactive or expired" });
    }
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin privileges" });
  }
};
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function parseDocument(filePath, mimetype) {
  try {
    const buffer = await fs.readFile(filePath);
    if (mimetype === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    throw new Error("Unsupported file type");
  } catch (error) {
    throw new Error(`Failed to parse document: ${error.message}`);
  } finally {
    try {
      await fs.unlink(filePath);
    } catch (e) {
    }
  }
}
async function extractProfileFromCV(cvContent) {
  try {
    const prompt = `
Extract personal information from this CV/Resume content and return it in JSON format with these exact fields:
- name: Full name of the person
- email: Email address if found
- phone: Phone number if found
- position: Current or desired job title/position
- skills: Comma-separated list of key skills and technologies
- experience: Brief summary of key work experience and achievements
- languages: If languages are found, return as array: [{"language": "English", "proficiency": "Native"}, {"language": "Spanish", "proficiency": "Fluent"}]. If no languages found, return null.

IMPORTANT: For languages field:
- Only include languages that are clearly mentioned in the CV
- If proficiency level is not specified, use "Not specified" 
- If no languages are mentioned at all, return null
- Never use "undefined" values

If any information is not found, use null for that field.
Only return valid JSON, no additional text or explanations.

CV Content:
${cvContent}
`;
    const response = await openai2.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert at extracting personal information from CVs. Always return valid JSON only." },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 500
    });
    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error("No response from OpenAI");
    }
    try {
      let cleanResult = result.trim();
      if (cleanResult.startsWith("```json")) {
        cleanResult = cleanResult.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (cleanResult.startsWith("```")) {
        cleanResult = cleanResult.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      const profileData = JSON.parse(cleanResult);
      return profileData;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response as JSON:", result);
      return null;
    }
  } catch (error) {
    console.error("Error extracting profile from CV:", error.message);
    return null;
  }
}
async function registerRoutes(app2) {
  await setupAuth(app2);
  try {
    let devUser = await storage.getUserByUsername("dev-user-123");
    if (!devUser) {
      const expiryDate = /* @__PURE__ */ new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      devUser = await storage.createUser({
        username: "dev-user-123",
        email: "dev@example.com",
        firstName: "Development",
        lastName: "User",
        role: "superadmin",
        isActive: true,
        subscriptionStatus: "active",
        subscriptionExpiresAt: expiryDate
      });
      console.log("\u2705 Created dev-user-123 as superadmin with 12-month subscription");
    } else {
      await storage.makeUserSuperadmin("dev-user-123");
      console.log("\u2705 Made existing dev-user-123 a superadmin");
    }
  } catch (error) {
    console.log("Note: Could not initialize dev-user-123 superadmin");
  }
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByUsername(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId || userId === "anonymous") {
        return res.status(401).json({ message: "User not authenticated" });
      }
      console.log("Getting profile for userId:", userId);
      const profile = await storage.getProfileByUserId(userId);
      console.log("Retrieved profile:", profile);
      res.json(profile || null);
    } catch (error) {
      console.error("Error retrieving profile:", error);
      res.status(500).json({ message: "Failed to get profile" });
    }
  });
  app2.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId || userId === "anonymous") {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const sessionId = getSessionId(req);
      const profileData = insertProfileSchema.parse({ ...req.body, sessionId });
      const existingProfile = await storage.getProfileByUserId(userId);
      let profile;
      if (existingProfile) {
        profile = await storage.updateProfileByUserId(userId, profileData);
      } else {
        profile = await storage.createProfileForUser(userId, profileData);
      }
      res.json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = fromZodError(error);
        res.status(400).json({ message: validationError.message });
      } else {
        res.status(500).json({ message: "Failed to save profile" });
      }
    }
  });
  app2.post("/api/documents/upload", isAuthenticated, upload.single("document"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const sessionId = getSessionId(req);
      const userId = getUserId(req);
      const { type } = req.body;
      if (!type || !["cv", "cover-letter"].includes(type)) {
        return res.status(400).json({ message: "Invalid document type" });
      }
      const content = await parseDocument(req.file.path, req.file.mimetype);
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documentData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        content,
        type,
        sessionId,
        userId: user.id
        // Use the actual user.id as number for consistency with database schema
      });
      console.log("About to create document with data:", {
        filename: documentData.filename,
        type: documentData.type,
        userId: documentData.userId,
        sessionId: documentData.sessionId
      });
      const document = await storage.createDocument(documentData);
      console.log("Created document:", { id: document.id, filename: document.filename, userId: document.userId });
      if (type === "cv") {
        try {
          console.log("Starting CV profile extraction for user:", userId);
          const extractedProfile = await extractProfileFromCV(content);
          console.log("Extracted profile data:", extractedProfile);
          if (extractedProfile && (extractedProfile.name || extractedProfile.email || extractedProfile.phone || extractedProfile.position || extractedProfile.skills || extractedProfile.experience || extractedProfile.languages)) {
            const existingProfile = await storage.getProfileByUserId(userId);
            const user2 = await storage.getUserByUsername(userId.toString());
            if (!user2) {
              console.error("User not found for CV profile extraction:", userId);
              return;
            }
            const profileData = {
              userId: user2.id,
              // Use the actual user.id from users table
              sessionId,
              name: extractedProfile.name || (existingProfile?.name || ""),
              email: extractedProfile.email || (existingProfile?.email || ""),
              phone: extractedProfile.phone || (existingProfile?.phone || ""),
              position: extractedProfile.position || (existingProfile?.position || ""),
              skills: extractedProfile.skills || (existingProfile?.skills || ""),
              experience: extractedProfile.experience || (existingProfile?.experience || ""),
              languages: extractedProfile.languages || (existingProfile?.languages || "")
            };
            Object.keys(profileData).forEach((key) => {
              if (!profileData[key] && existingProfile && existingProfile[key]) {
                if (key !== "skills" && key !== "name" && key !== "email" && key !== "phone" && key !== "position") {
                  profileData[key] = existingProfile[key];
                }
              }
            });
            if (extractedProfile.skills && extractedProfile.skills.trim()) {
              profileData.skills = extractedProfile.skills;
            }
            if (extractedProfile.experience && typeof extractedProfile.experience === "string" && extractedProfile.experience.trim()) {
              profileData.experience = extractedProfile.experience;
            }
            if (extractedProfile.languages) {
              if (typeof extractedProfile.languages === "string" && extractedProfile.languages.trim()) {
                profileData.languages = extractedProfile.languages;
              } else if (Array.isArray(extractedProfile.languages)) {
                const languageString = extractedProfile.languages.filter((lang) => lang && lang.language && lang.language !== "undefined" && lang.proficiency && lang.proficiency !== "undefined").map((lang) => `${lang.language} (${lang.proficiency})`).join(", ");
                if (languageString) {
                  profileData.languages = languageString;
                } else {
                  profileData.languages = "not found";
                }
              }
            } else {
              profileData.languages = "not found";
            }
            console.log("About to save/update profile with data:", profileData);
            if (existingProfile) {
              console.log("Updating existing profile");
              await storage.updateProfileByUserId(user2.id.toString(), profileData);
            } else {
              console.log("Creating new profile");
              const validatedProfileData = insertProfileSchema.parse(profileData);
              await storage.createProfile(validatedProfileData);
            }
            console.log("Profile save/update completed successfully");
          } else {
            console.log("No valid profile data extracted from CV");
          }
        } catch (profileError) {
          console.error("Failed to extract/update profile from CV:", profileError);
        }
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: `Failed to upload document: ${error.message}` });
    }
  });
  app2.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("GET /api/documents - userId from getUserId:", userId);
      if (!userId || userId === "anonymous") {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const user = await storage.getUserByUsername(userId.toString());
      console.log("Found user for documents retrieval:", user?.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("About to call storage.getDocumentsByUserId with userId (username):", userId);
      console.log("User object found:", user);
      const documents2 = await storage.getDocumentsByUserId(userId);
      console.log("Documents retrieved:", documents2.length, "documents:", documents2.map((d) => ({ id: d.id, filename: d.filename, type: d.type, userId: d.userId })));
      res.json(documents2);
    } catch (error) {
      console.error("Error in GET /api/documents:", error);
      res.status(500).json({ message: "Failed to get documents" });
    }
  });
  app2.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      if (success) {
        res.json({ message: "Document deleted successfully" });
      } else {
        res.status(404).json({ message: "Document not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  app2.post("/api/ai/create", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const userId = getUserId(req);
      const { profile, jobDescription, hasDocuments, language = "en" } = req.body;
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents2 = await storage.getDocumentsByUserId(userId);
      const languageMap = {
        "nl": "Dutch",
        "en": "English",
        "ar": "Arabic",
        "tr": "Turkish"
      };
      const responseLanguage = languageMap[language] || "English";
      if (!profile && documents2.length === 0) {
        return res.status(400).json({ message: "Profile or uploaded documents are required" });
      }
      let prompt;
      if (documents2.length > 0) {
        const cvDoc = documents2.find((doc) => doc.type === "cv");
        const coverLetterDoc = documents2.find((doc) => doc.type === "cover-letter");
        prompt = `LANGUAGE: ${responseLanguage}

CareerCopilot: Enhance documents using professional best practices.

${cvDoc ? `CV:
${cvDoc.content.substring(0, 2e3)}${cvDoc.content.length > 2e3 ? "..." : ""}

` : ""}${coverLetterDoc ? `COVER LETTER:
${coverLetterDoc.content.substring(0, 1500)}${coverLetterDoc.content.length > 1500 ? "..." : ""}

` : ""}${jobDescription ? `JOB:
${jobDescription.substring(0, 1e3)}${jobDescription.length > 1e3 ? "..." : ""}

` : ""}ENHANCE with:
- Professional structure & ATS optimization
- Strong action verbs & quantified results  
- ${jobDescription ? "Job-specific tailoring" : "Modern standards alignment"}

JSON response:
{
  "cv": "Enhanced CV",
  "coverLetter": "Enhanced cover letter", 
  "improvements": ["Key changes made"]
}`;
      } else {
        prompt = `LANGUAGE: ${responseLanguage}

Generate professional CV & cover letter.

PROFILE:
${profile.name} | ${profile.email} | ${profile.phone}
Position: ${profile.position}
Skills: ${profile.skills}

${jobDescription ? `JOB: ${jobDescription.substring(0, 800)}${jobDescription.length > 800 ? "..." : ""}` : "Create general professional documents."}

JSON format:
{
  "cv": "Professional CV in ${responseLanguage}",
  "coverLetter": "Tailored cover letter in ${responseLanguage}"
}`;
      }
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are CareerCopilot, an expert career advisor. Provide comprehensive, professional CV and cover letter content in the requested language. Be concise yet complete." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
        max_tokens: 2e3,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });
      const result = JSON.parse(response.choices[0].message.content || "{}");
      const aiResult = await storage.createAiResult({
        mode: "create",
        input: JSON.stringify({
          profile,
          jobDescription,
          hasDocuments: documents2.length > 0,
          documentTypes: documents2.map((d) => d.type)
        }),
        result: JSON.stringify(result),
        sessionId
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });
  app2.post("/api/ai/review", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessionId = getSessionId(req);
      const { language = "en" } = req.body;
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents2 = await storage.getDocumentsByUserId(userId);
      if (documents2.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for review" });
      }
      const cvDoc = documents2.find((doc) => doc.type === "cv");
      const coverLetterDoc = documents2.find((doc) => doc.type === "cover-letter");
      const languageMap = {
        "nl": "Dutch",
        "en": "English",
        "ar": "Arabic",
        "tr": "Turkish"
      };
      const responseLanguage = languageMap[language] || "English";
      let prompt = `LANGUAGE: ${responseLanguage}

CareerCopilot: Professional document analysis.

`;
      if (cvDoc) {
        prompt += `CV ANALYSIS (100 pts):
Format/Presentation (25): Structure, layout, consistency
Relevance (25): Keywords, industry alignment, quantified impact  
Experience (20): Chronological order, action-result format
Skills (15): Clear technical/soft skills, avoid buzzwords
Education (10): Relevant degrees, clear dates
Bonus (5): Projects, languages, portfolio links

CV Content:
${cvDoc.content.substring(0, 2500)}${cvDoc.content.length > 2500 ? "..." : ""}

`;
      }
      if (coverLetterDoc) {
        prompt += `COVER LETTER ANALYSIS CRITERIA:
\u270D\uFE0F Structure (30 points):
- Header with contact info and date
- Personalized greeting (avoid "To Whom It May Concern")
- Introduction: Position applied for and compelling hook
- Body: Short paragraphs highlighting fit, achievements, motivation
- Conclusion: Call to action and professional closing

\u{1F4AC} Tone & Language (25 points):
- Professional, confident, polite
- Avoids clich\xE9s and generic phrases
- Active voice and strong verbs

\u{1F4E3} Content Quality (45 points):
- Summarizes unique value proposition
- Shows interest in company/industry, not just the job
- Adds narrative/examples instead of restating CV
- Demonstrates company knowledge and cultural fit

Cover Letter Content:
${coverLetterDoc.content}

`;
      }
      const analysisPromises = [];
      if (cvDoc) {
        analysisPromises.push(
          openai2.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: `CV analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score CV (0-100) + 3 strengths + 3 improvements:
${cvDoc.content.substring(0, 1500)}

JSON: {"score":85, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 800
          })
        );
      }
      if (coverLetterDoc) {
        analysisPromises.push(
          openai2.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: `Cover letter analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score cover letter (0-100) + 3 strengths + 3 improvements:
${coverLetterDoc.content.substring(0, 1e3)}

JSON: {"score":80, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 700
          })
        );
      }
      const responses = await Promise.all(analysisPromises);
      let cvAnalysis = null;
      let coverLetterAnalysis = null;
      let responseIndex = 0;
      if (cvDoc) {
        const cvResult = JSON.parse(responses[responseIndex].choices[0].message.content || "{}");
        cvAnalysis = {
          formatScore: Math.round(cvResult.score * 0.25) || 20,
          relevanceScore: Math.round(cvResult.score * 0.25) || 20,
          experienceScore: Math.round(cvResult.score * 0.2) || 16,
          skillsScore: Math.round(cvResult.score * 0.15) || 12,
          educationScore: Math.round(cvResult.score * 0.1) || 8,
          bonusScore: Math.round(cvResult.score * 0.05) || 4,
          strengths: cvResult.strengths || ["Well-structured format", "Relevant experience", "Clear skills section"],
          improvements: cvResult.improvements || ["Add quantified achievements", "Include more keywords", "Improve layout consistency"],
          summary: cvResult.summary || "Professional CV with good foundation"
        };
        responseIndex++;
      }
      if (coverLetterDoc) {
        const clResult = JSON.parse(responses[responseIndex].choices[0].message.content || "{}");
        coverLetterAnalysis = {
          structureScore: Math.round(clResult.score * 0.3) || 24,
          toneScore: Math.round(clResult.score * 0.25) || 20,
          contentScore: Math.round(clResult.score * 0.45) || 36,
          strengths: clResult.strengths || ["Professional tone", "Clear structure", "Relevant content"],
          improvements: clResult.improvements || ["Add company research", "Include specific examples", "Strengthen conclusion"],
          summary: clResult.summary || "Well-written cover letter with good potential"
        };
      }
      let overallScore = 0;
      if (cvAnalysis && coverLetterAnalysis) {
        const cvTotal = cvAnalysis.formatScore + cvAnalysis.relevanceScore + cvAnalysis.experienceScore + cvAnalysis.skillsScore + cvAnalysis.educationScore + cvAnalysis.bonusScore;
        const clTotal = coverLetterAnalysis.structureScore + coverLetterAnalysis.toneScore + coverLetterAnalysis.contentScore;
        overallScore = Math.round((cvTotal + clTotal) / 2);
      } else if (cvAnalysis) {
        overallScore = cvAnalysis.formatScore + cvAnalysis.relevanceScore + cvAnalysis.experienceScore + cvAnalysis.skillsScore + cvAnalysis.educationScore + cvAnalysis.bonusScore;
      } else if (coverLetterAnalysis) {
        overallScore = coverLetterAnalysis.structureScore + coverLetterAnalysis.toneScore + coverLetterAnalysis.contentScore;
      }
      const result = {
        overallScore,
        ...cvAnalysis && { cvAnalysis },
        ...coverLetterAnalysis && { coverLetterAnalysis }
      };
      const aiResult = await storage.createAiResult({
        mode: "review",
        input: JSON.stringify({ documents: documents2.map((d) => ({ type: d.type, filename: d.filename })) }),
        result: JSON.stringify(result),
        sessionId
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });
  app2.post("/api/ai/assess", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const sessionId = getSessionId(req);
      const { jobDescription, language = "en" } = req.body;
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const documents2 = await storage.getDocumentsByUserId(userId);
      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }
      if (documents2.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for assessment" });
      }
      const cvDoc = documents2.find((doc) => doc.type === "cv");
      if (!cvDoc) {
        return res.status(400).json({ message: "CV is required for assessment" });
      }
      const coverLetterDoc = documents2.find((doc) => doc.type === "cover-letter");
      const languageMap = {
        "nl": "Dutch",
        "en": "English",
        "ar": "Arabic",
        "tr": "Turkish"
      };
      const responseLanguage = languageMap[language] || "English";
      let prompt = `You are CareerCopilot conducting a comprehensive job match assessment. Analyze alignment between the candidate's documents and job requirements.

IMPORTANT: Respond in ${responseLanguage} language. All feedback, recommendations, and analysis should be provided in ${responseLanguage}.

JOB DESCRIPTION:
${jobDescription}

CV/RESUME:
${cvDoc.content}

`;
      if (coverLetterDoc) {
        prompt += `COVER LETTER:
${coverLetterDoc.content}

COVER LETTER ALIGNMENT ASSESSMENT:
\u{1F50D} Tailoring & Relevance (40 points):
- Mentions company name, role title, specific job requirements
- References exact qualifications/responsibilities from job ad
- Highlights how applicant meets/exceeds key requirements

\u{1F3AF} Keyword Matching (30 points):
- Uses role-specific terms and industry language from job description
- Reflects skills, technologies, methodologies mentioned in posting

\u{1F4BC} Fit & Motivation (30 points):
- Expresses why applicant wants THIS role at THIS company
- Demonstrates alignment with company values/mission

`;
      }
      const assessmentPromises = [];
      assessmentPromises.push(
        openai2.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: `Job match analyzer. Respond in ${responseLanguage} with JSON only.` },
            { role: "user", content: `Match CV to job (0-100 score) + missing skills + recommendations:
JOB: ${jobDescription.substring(0, 800)}
CV: ${cvDoc.content.substring(0, 1500)}

JSON: {"score":75, "foundSkills":[".."], "missingSkills":[".."], "recommendations":[".."], "summary":".."}` }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1,
          max_tokens: 900
        })
      );
      if (coverLetterDoc) {
        assessmentPromises.push(
          openai2.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: `Cover letter-job alignment analyzer. Respond in ${responseLanguage} with JSON only.` },
              { role: "user", content: `Score cover letter alignment to job (0-100) + improvements:
JOB: ${jobDescription.substring(0, 600)}
COVER LETTER: ${coverLetterDoc.content.substring(0, 800)}

JSON: {"score":80, "strengths":[".."], "improvements":[".."], "summary":".."}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1,
            max_tokens: 700
          })
        );
      }
      const responses = await Promise.all(assessmentPromises);
      const cvMatchResult = JSON.parse(responses[0].choices[0].message.content || "{}");
      let coverLetterResult = null;
      if (coverLetterDoc && responses.length > 1) {
        coverLetterResult = JSON.parse(responses[1].choices[0].message.content || "{}");
      }
      const result = {
        matchScore: cvMatchResult.score || 75,
        skillsMatch: {
          score: cvMatchResult.score || 75,
          foundSkills: cvMatchResult.foundSkills || ["Relevant technical skills", "Industry experience"],
          missingSkills: cvMatchResult.missingSkills || ["Specific certification", "Advanced framework"],
          recommendations: cvMatchResult.recommendations || ["Highlight quantified achievements", "Add missing keywords"]
        },
        experienceAlignment: {
          score: Math.round((cvMatchResult.score || 75) * 0.9),
          relevantExperience: ["Professional background aligns with role requirements"],
          gaps: ["Could benefit from more specific industry experience"],
          recommendations: ["Emphasize transferable skills", "Add project examples"]
        },
        educationMatch: {
          score: Math.round((cvMatchResult.score || 75) * 1.1),
          matches: ["Educational background supports role"],
          missing: [],
          recommendations: ["Highlight relevant coursework or certifications"]
        },
        keywordOptimization: {
          score: Math.round((cvMatchResult.score || 75) * 0.8),
          presentKeywords: cvMatchResult.foundSkills?.slice(0, 3) || ["job-relevant", "industry-specific"],
          missingKeywords: cvMatchResult.missingSkills?.slice(0, 3) || ["optimization", "specific-tech"],
          recommendations: ["Include more job-specific terminology", "Use exact phrases from job description"]
        },
        ...coverLetterResult && {
          coverLetterAlignment: {
            tailoringScore: Math.round((coverLetterResult.score || 80) * 0.35),
            keywordScore: Math.round((coverLetterResult.score || 80) * 0.3),
            fitScore: Math.round((coverLetterResult.score || 80) * 0.35),
            strengths: coverLetterResult.strengths || ["Professional tone", "Clear structure"],
            improvements: coverLetterResult.improvements || ["Add company-specific details", "Include concrete examples"]
          }
        },
        overallRecommendations: [
          ...(cvMatchResult.recommendations || []).slice(0, 2),
          ...(coverLetterResult?.improvements || []).slice(0, 1)
        ],
        summary: `Match score: ${cvMatchResult.score || 75}%. ${cvMatchResult.summary || "Good alignment with some areas for improvement."}`
      };
      const aiResult = await storage.createAiResult({
        mode: "assess",
        input: JSON.stringify({ jobDescription, cvFilename: cvDoc.filename }),
        result: JSON.stringify(result),
        sessionId
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.patch("/api/admin/users/:id", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive, accountExpiresAt } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        isActive,
        accountExpiresAt: accountExpiresAt ? new Date(accountExpiresAt) : void 0
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.put("/api/admin/users/:id/subscription", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionStatus, subscriptionExpiresAt } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        subscriptionStatus,
        subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });
  app2.post("/api/admin/invite", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      const currentUser = req.currentUser;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const token = generateToken();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const invitation = await storage.createInvitation({
        email,
        token,
        expiresAt,
        isUsed: false,
        invitedBy: currentUser.id
      });
      const emailParams = generateInvitationEmail(
        email,
        token,
        `${currentUser.firstName || ""} ${currentUser.lastName || ""}`.trim() || currentUser.username
      );
      try {
        const emailSent = await sendEmailWithFallback(emailParams);
        if (emailSent) {
          console.log(`\u2705 Invitation email sent to ${email}`);
        } else {
          console.log(`\u274C Failed to send invitation email to ${email}`);
        }
      } catch (emailError) {
        console.error("Email sending error:", emailError);
      }
      res.json({
        message: "Invitation created and email is being sent",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to send invitation: ${error.message}` });
    }
  });
  app2.get("/api/admin/invitations", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const invitations = await storage.getActiveInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  app2.post("/api/test-email", async (req, res) => {
    try {
      console.log("Testing Hostinger SMTP...");
      const testEmailParams = {
        to: "test@example.com",
        from: process.env.SMTP_USER || "info@maptheorie.nl",
        subject: "Hostinger SMTP Test",
        text: "Testing Hostinger SMTP email delivery."
      };
      const emailSent = await sendEmailWithFallback(testEmailParams);
      res.json({
        success: emailSent,
        message: emailSent ? "Email sent successfully" : "Email failed - check logs"
      });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ message: `Test failed: ${error.message}` });
    }
  });
  app2.post("/api/admin/test-sendgrid", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { testEmail } = req.body;
      const emailToUse = testEmail || "test@example.com";
      const testEmailParams = {
        to: emailToUse,
        from: process.env.SMTP_USER || "info@maptheorie.nl",
        subject: "Hostinger SMTP Test - CareerCopilot",
        text: "This is a test email to verify Hostinger SMTP configuration is working properly.",
        html: "<h3>Hostinger SMTP Test</h3><p>This is a test email to verify Hostinger SMTP configuration is working properly.</p>"
      };
      console.log("Testing Hostinger SMTP configuration...");
      console.log("SMTP Host exists:", !!process.env.SMTP_HOST);
      console.log("SMTP User:", process.env.SMTP_USER);
      console.log("From email:", testEmailParams.from);
      console.log("Test email to:", emailToUse);
      const emailSent = await sendEmailWithFallback(testEmailParams);
      if (emailSent) {
        res.json({
          message: "SendGrid test email sent successfully!",
          config: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            fromEmail: testEmailParams.from,
            apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10),
            testEmailSent: true,
            sentTo: emailToUse
          }
        });
      } else {
        res.status(500).json({
          message: "SendGrid test email failed to send - check server logs for details",
          config: {
            hasApiKey: !!process.env.SENDGRID_API_KEY,
            fromEmail: testEmailParams.from,
            apiKeyPrefix: process.env.SENDGRID_API_KEY?.substring(0, 10),
            testEmailSent: false
          }
        });
      }
    } catch (error) {
      res.status(500).json({ message: `SendGrid test failed: ${error.message}` });
    }
  });
  app2.post("/api/invite/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName } = req.body;
      const invitation = await storage.getInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invalid invitation token" });
      }
      if (invitation.isUsed) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      if (/* @__PURE__ */ new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      const existingUser = await storage.getUserByUsername(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const accountExpiry = /* @__PURE__ */ new Date();
      accountExpiry.setDate(accountExpiry.getDate() + 30);
      const newUser = await storage.createUser({
        username: invitation.email,
        email: invitation.email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "user",
        isActive: true,
        accountExpiresAt: accountExpiry,
        subscriptionStatus: "active",
        subscriptionExpiresAt: invitation.subscriptionExpiresAt || (() => {
          const fallbackExpiry = /* @__PURE__ */ new Date();
          fallbackExpiry.setFullYear(fallbackExpiry.getFullYear() + 1);
          return fallbackExpiry;
        })()
      });
      await storage.markInvitationAsUsed(token);
      res.json({
        message: "Account created successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to create account: ${error.message}` });
    }
  });
  app2.get("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const conversations = await storage.getConversations(user.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: `Failed to get conversations: ${error.message}` });
    }
  });
  app2.post("/api/chat/conversations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { title = "New Conversation" } = req.body;
      const conversation = await storage.createConversation({
        userId: user.id,
        title
      });
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: `Failed to create conversation: ${error.message}` });
    }
  });
  app2.get("/api/chat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: `Failed to get messages: ${error.message}` });
    }
  });
  app2.post("/api/chat/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, role = "user", language = "en" } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Message content is required" });
      }
      const userMessage = await storage.createMessage({
        conversationId,
        role: "user",
        content
      });
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      const profile = user ? await storage.getProfileByUserId(userId) : null;
      const languageMap = {
        "nl": "Dutch",
        "en": "English",
        "ar": "Arabic",
        "tr": "Turkish"
      };
      const responseLanguage = languageMap[language] || "English";
      const prompt = `You are CareerCopilot, a friendly AI career mentor and advisor. Respond in ${responseLanguage}.

USER CONTEXT:
${profile ? `Name: ${profile.name}
Position: ${profile.position || "Not specified"}
Skills: ${profile.skills || "Not specified"}
Email: ${profile.email}` : "Profile not available"}

INSTRUCTIONS:
- Provide helpful, encouraging career advice
- Be friendly, supportive, and professional
- Ask follow-up questions to understand needs better
- Offer specific, actionable guidance
- Keep responses concise but informative
- Use encouraging emojis occasionally to be more personable

USER MESSAGE: ${content}`;
      const response = await openai2.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: `You are CareerCopilot, a friendly AI career mentor. Always respond in ${responseLanguage} and be encouraging and helpful.` },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1e3
      });
      const aiResponse = response.choices[0].message.content || "Sorry, I couldn't generate a response.";
      const aiMessage = await storage.createMessage({
        conversationId,
        role: "assistant",
        content: aiResponse
      });
      const messages = await storage.getConversationMessages(conversationId);
      if (messages.length <= 2) {
        const titlePrompt = `Generate a short conversation title (2-4 words) for this career mentoring topic: "${content}". Respond only with the title, no quotes.`;
        const titleResponse = await openai2.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: titlePrompt }],
          temperature: 0.3,
          max_tokens: 50
        });
        const title = titleResponse.choices[0].message.content?.trim() || "Career Chat";
        await storage.updateConversationTitle(conversationId, title);
      }
      res.json({ userMessage, aiMessage });
    } catch (error) {
      res.status(500).json({ message: `Failed to send message: ${error.message}` });
    }
  });
  app2.get("/api/job-applications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const applications = await storage.getJobApplications(user.id);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch job applications: ${error.message}` });
    }
  });
  app2.post("/api/job-applications", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const validationResult = insertJobApplicationSchema.safeParse({
        ...req.body,
        userId: user.id
      });
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error).toString()
        });
      }
      const application = await storage.createJobApplication(validationResult.data);
      res.status(201).json(application);
    } catch (error) {
      res.status(500).json({ message: `Failed to create job application: ${error.message}` });
    }
  });
  app2.put("/api/job-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      const applicationId = parseInt(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updateSchema = insertJobApplicationSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: fromZodError(validationResult.error).toString()
        });
      }
      const updatedApplication = await storage.updateJobApplication(applicationId, validationResult.data);
      if (!updatedApplication) {
        return res.status(404).json({ message: "Job application not found" });
      }
      res.json(updatedApplication);
    } catch (error) {
      res.status(500).json({ message: `Failed to update job application: ${error.message}` });
    }
  });
  app2.delete("/api/job-applications/:id", isAuthenticated, async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const success = await storage.deleteJobApplication(applicationId);
      if (!success) {
        return res.status(404).json({ message: "Job application not found" });
      }
      res.json({ message: "Job application deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: `Failed to delete job application: ${error.message}` });
    }
  });
  app2.get("/api/job-applications/dashboard", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const applications = await storage.getJobApplications(user.id);
      const totalApplications = applications.length;
      const responses = applications.filter((app3) => app3.response && app3.response !== "No Response");
      const interviews = applications.filter((app3) => app3.response === "Interview");
      const offers = applications.filter((app3) => app3.response === "Offer");
      const rejections = applications.filter((app3) => app3.response === "Rejected");
      const now = /* @__PURE__ */ new Date();
      const followUpReminders = applications.filter((app3) => {
        if (app3.response && app3.response !== "No Response") return false;
        const applyDate = new Date(app3.applyDate);
        const daysSinceApplication = Math.floor((now.getTime() - applyDate.getTime()) / (1e3 * 60 * 60 * 24));
        return daysSinceApplication >= 45;
      });
      const lateFollowUps = applications.filter((app3) => {
        if (app3.response && app3.response !== "No Response") return false;
        const applyDate = new Date(app3.applyDate);
        const daysSinceApplication = Math.floor((now.getTime() - applyDate.getTime()) / (1e3 * 60 * 60 * 24));
        return daysSinceApplication >= 60;
      });
      const summary = {
        totalApplications,
        totalResponses: responses.length,
        interviews: interviews.length,
        offers: offers.length,
        rejections: rejections.length,
        pendingResponse: totalApplications - responses.length,
        followUpReminders: followUpReminders.length,
        lateFollowUps: lateFollowUps.length,
        responseRate: totalApplications > 0 ? Math.round(responses.length / totalApplications * 100) : 0,
        interviewRate: totalApplications > 0 ? Math.round(interviews.length / totalApplications * 100) : 0,
        offerRate: totalApplications > 0 ? Math.round(offers.length / totalApplications * 100) : 0
      };
      res.json(summary);
    } catch (error) {
      res.status(500).json({ message: `Failed to fetch dashboard data: ${error.message}` });
    }
  });
  app2.get("/api/interviews/sessions", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json([]);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interview sessions" });
    }
  });
  app2.post("/api/interviews/start", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { jobTitle, company, jobDescription, interviewType, difficultyLevel, recruiterPersona, language, cvContent } = req.body;
      if (!jobTitle || !company || !interviewType || !difficultyLevel || !recruiterPersona) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const { InterviewAI: InterviewAI2 } = await Promise.resolve().then(() => (init_interview_ai(), interview_ai_exports));
      const interviewAI = new InterviewAI2();
      const context = {
        jobTitle,
        company,
        jobDescription: jobDescription || "",
        interviewType,
        difficultyLevel,
        recruiterPersona,
        language: language || "en",
        currentQuestionIndex: 0,
        previousQuestions: [],
        previousAnswers: [],
        cvContent: cvContent || null
      };
      const firstQuestion = await interviewAI.generateQuestion(context);
      const sessionData = {
        id: Date.now().toString(),
        userId: user.id,
        jobTitle,
        company,
        jobDescription,
        interviewType,
        difficultyLevel,
        recruiterPersona,
        language: language || "en",
        status: "active",
        startedAt: (/* @__PURE__ */ new Date()).toISOString(),
        currentQuestionIndex: 0,
        questions: [firstQuestion],
        answers: [],
        context
      };
      res.json({
        session: sessionData,
        currentQuestion: firstQuestion
      });
    } catch (error) {
      console.error("Error starting interview:", error);
      res.status(500).json({ message: `Failed to start interview: ${error.message}` });
    }
  });
  app2.post("/api/interviews/:sessionId/answer", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer, questionIndex } = req.body;
      if (!answer) {
        return res.status(400).json({ message: "Answer is required" });
      }
      const { InterviewAI: InterviewAI2 } = await Promise.resolve().then(() => (init_interview_ai(), interview_ai_exports));
      const interviewAI = new InterviewAI2();
      const context = {
        jobTitle: req.body.jobTitle || "Software Engineer",
        company: req.body.company || "Tech Company",
        jobDescription: req.body.jobDescription || "",
        interviewType: req.body.interviewType || "behavioral",
        difficultyLevel: req.body.difficultyLevel || "mid",
        recruiterPersona: req.body.recruiterPersona || "friendly",
        language: req.body.language || "en",
        currentQuestionIndex: questionIndex + 1,
        previousQuestions: req.body.previousQuestions || [],
        previousAnswers: [...req.body.previousAnswers || [], answer],
        cvContent: req.body.cvContent || null
      };
      const evaluation = await interviewAI.evaluateAnswer(
        context,
        req.body.previousQuestions?.[questionIndex] || "Tell me about yourself",
        answer
      );
      let nextQuestion = null;
      if (context.currentQuestionIndex < 10) {
        nextQuestion = await interviewAI.generateQuestion(context);
      }
      res.json({
        evaluation,
        nextQuestion,
        isComplete: context.currentQuestionIndex >= 10,
        questionIndex: context.currentQuestionIndex
      });
    } catch (error) {
      console.error("Error processing interview answer:", error);
      res.status(500).json({ message: `Failed to process answer: ${error.message}` });
    }
  });
  app2.post("/api/interviews/:sessionId/complete", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { questions, answers, context, forcedStop, currentProgress } = req.body;
      const { InterviewAI: InterviewAI2 } = await Promise.resolve().then(() => (init_interview_ai(), interview_ai_exports));
      const interviewAI = new InterviewAI2();
      const finalFeedback = await interviewAI.generateFinalFeedback(
        context,
        questions,
        answers,
        forcedStop,
        currentProgress
      );
      res.json({
        feedback: finalFeedback,
        sessionId,
        completedAt: (/* @__PURE__ */ new Date()).toISOString(),
        forcedStop: forcedStop || false
      });
    } catch (error) {
      console.error("Error completing interview:", error);
      res.status(500).json({ message: `Failed to complete interview: ${error.message}` });
    }
  });
  app2.post("/api/upload", isAuthenticated, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const content = await parseDocument(req.file.path, req.file.mimetype);
      res.json({
        filename: req.file.originalname,
        content
      });
    } catch (error) {
      console.error("Error uploading CV for interview:", error);
      res.status(500).json({ message: `Failed to process CV: ${error.message}` });
    }
  });
  app2.post("/api/transcribe-audio", isAuthenticated, upload.single("audio"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No audio file uploaded" });
      }
      const syncFs = await import("fs");
      console.log("File details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      const path3 = await import("path");
      const newPath = req.file.path + ".webm";
      await fs.copyFile(req.file.path, newPath);
      const transcription = await openai2.audio.transcriptions.create({
        file: syncFs.createReadStream(newPath),
        model: "whisper-1",
        language: "en"
      });
      await fs.unlink(req.file.path).catch((err) => {
        console.error("Error deleting original temp file:", err);
      });
      await fs.unlink(newPath).catch((err) => {
        console.error("Error deleting webm temp file:", err);
      });
      res.json({
        transcription: transcription.text,
        confidence: 0.95
        // Whisper generally has high confidence
      });
    } catch (error) {
      console.error("Error transcribing audio:", error);
      res.status(500).json({ message: `Failed to transcribe audio: ${error.message}` });
    }
  });
  app2.post("/api/interviews/:sessionId/download", isAuthenticated, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { feedback, questions, answers, sessionData } = req.body;
      if (!feedback || !questions || !answers || !sessionData) {
        return res.status(400).json({ message: "Missing interview data" });
      }
      const { Document, Paragraph, TextRun, Packer, AlignmentType, HeadingLevel } = await import("docx");
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Header
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: "CareerCopilot Mock Interview Report",
                  bold: true,
                  size: 32
                })
              ]
            }),
            new Paragraph({ text: "" }),
            // Interview Details
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Interview Details", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Position: ${sessionData.jobTitle}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Company: ${sessionData.company}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Interview Type: ${sessionData.interviewType}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Difficulty Level: ${sessionData.difficultyLevel}` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Date: ${new Date(sessionData.startedAt).toLocaleDateString()}` })]
            }),
            new Paragraph({ text: "" }),
            // Overall Score
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Overall Performance", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({
                text: `Overall Score: ${feedback.overallScore}/100`,
                bold: true,
                size: 24
              })]
            }),
            new Paragraph({
              children: [new TextRun({ text: feedback.summary })]
            }),
            new Paragraph({ text: "" }),
            // Category Scores
            new Paragraph({
              heading: HeadingLevel.HEADING_2,
              children: [new TextRun({ text: "Category Scores", bold: true })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Communication: ${feedback.categoryScores.communication}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Technical: ${feedback.categoryScores.technical}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Cultural Fit: ${feedback.categoryScores.cultural}/10` })]
            }),
            new Paragraph({
              children: [new TextRun({ text: `Experience: ${feedback.categoryScores.experience}/10` })]
            }),
            new Paragraph({ text: "" }),
            // Q&A Section
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Interview Questions & Answers", bold: true })]
            }),
            ...questions.flatMap((question, index2) => [
              new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [new TextRun({ text: `Question ${index2 + 1}`, bold: true })]
              }),
              new Paragraph({
                children: [new TextRun({ text: question })]
              }),
              new Paragraph({
                children: [new TextRun({ text: "Answer:", bold: true })]
              }),
              new Paragraph({
                children: [new TextRun({ text: answers[index2] || "No answer provided" })]
              }),
              new Paragraph({ text: "" })
            ]),
            // Strengths
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Strengths", bold: true })]
            }),
            ...feedback.strengths.map(
              (strength) => new Paragraph({
                children: [new TextRun({ text: `\u2022 ${strength}` })]
              })
            ),
            new Paragraph({ text: "" }),
            // Improvements
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Areas for Improvement", bold: true })]
            }),
            ...feedback.improvements.map(
              (improvement) => new Paragraph({
                children: [new TextRun({ text: `\u2022 ${improvement}` })]
              })
            ),
            new Paragraph({ text: "" }),
            // Recommendations
            new Paragraph({
              heading: HeadingLevel.HEADING_1,
              children: [new TextRun({ text: "Recommendations", bold: true })]
            }),
            ...feedback.recommendations.map(
              (recommendation) => new Paragraph({
                children: [new TextRun({ text: `\u2022 ${recommendation}` })]
              })
            )
          ]
        }]
      });
      const buffer = await Packer.toBuffer(doc);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="Interview_Report_${sessionData.jobTitle}_${Date.now()}.docx"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating interview report:", error);
      res.status(500).json({ message: `Failed to generate report: ${error.message}` });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.put("/api/admin/users/:id/subscription", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { subscriptionStatus, subscriptionExpiresAt } = req.body;
      if (!["active", "hold", "cancelled"].includes(subscriptionStatus)) {
        return res.status(400).json({ message: "Invalid subscription status" });
      }
      const updatedUser = await storage.updateUserSubscription(
        userId,
        subscriptionStatus,
        subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : void 0
      );
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });
  app2.put("/api/admin/users/:id/status", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive, accountExpiresAt } = req.body;
      const updatedUser = await storage.updateUser(userId, {
        isActive,
        accountExpiresAt: accountExpiresAt ? new Date(accountExpiresAt) : void 0
      });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.post("/api/admin/invitations", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const token = generateToken();
      const expiresAt = /* @__PURE__ */ new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      const subscriptionExpiresAt = /* @__PURE__ */ new Date();
      subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);
      const invitation = await storage.createInvitation({
        email,
        token,
        expiresAt,
        isUsed: false,
        subscriptionExpiresAt
      });
      const invitationLink = `${req.protocol}://${req.get("host")}/invite/${token}`;
      const emailContent = generateInvitationEmail(email, token, "CareerCopilot Admin");
      console.log("Generated email content:", JSON.stringify(emailContent, null, 2));
      try {
        const emailSent = await sendEmailWithFallback(emailContent);
        if (emailSent) {
          console.log(`\u2705 Invitation email sent to ${email}`);
        } else {
          console.log(`\u274C Failed to send invitation email to ${email}`);
        }
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError);
      }
      res.json({ invitation, invitationLink });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ message: "Failed to create invitation" });
    }
  });
  app2.get("/api/admin/invitations", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const invitations = await storage.getActiveInvitations();
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  app2.post("/api/subscription/create-checkout-session", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId.toString());
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { subscriptionTier, successUrl, cancelUrl } = req.body;
      if (!["essential", "professional", "elite"].includes(subscriptionTier)) {
        return res.status(400).json({ message: "Invalid subscription tier" });
      }
      const priceIds = {
        essential: process.env.STRIPE_ESSENTIAL_PRICE_ID,
        professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        elite: process.env.STRIPE_ELITE_PRICE_ID
      };
      const priceId = priceIds[subscriptionTier];
      if (!priceId) {
        return res.status(400).json({ message: `Price ID not configured for ${subscriptionTier}` });
      }
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId });
      }
      const session2 = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId: user.id.toString(),
          subscriptionTier
        }
      });
      res.json({ url: session2.url });
    } catch (error) {
      console.error("Stripe checkout session error:", error);
      res.status(500).json({ message: `Failed to create checkout session: ${error.message}` });
    }
  });
  app2.post("/api/subscription/webhook", async (req, res) => {
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case "checkout.session.completed": {
        const session2 = event.data.object;
        const userId = parseInt(session2.metadata.userId);
        const subscriptionTier = session2.metadata.subscriptionTier;
        await storage.updateUser(userId, {
          subscriptionTier,
          subscriptionStatus: "active",
          subscriptionExpiresAt: null,
          stripeSubscriptionId: session2.subscription
        });
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const user = await storage.getUserByStripeCustomerId(subscription.customer);
        if (user) {
          const status = subscription.status === "active" ? "active" : "inactive";
          await storage.updateUser(user.id, {
            subscriptionStatus: status,
            subscriptionExpiresAt: subscription.status === "active" ? null : /* @__PURE__ */ new Date()
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const user = await storage.getUserByStripeCustomerId(subscription.customer);
        if (user) {
          await storage.updateUser(user.id, {
            subscriptionStatus: "inactive",
            subscriptionTier: "essential",
            subscriptionExpiresAt: /* @__PURE__ */ new Date(),
            stripeSubscriptionId: null
          });
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    res.json({ received: true });
  });
  app2.get("/api/subscription/portal", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserByUsername(userId.toString());
      if (!user || !user.stripeCustomerId) {
        return res.status(404).json({ message: "No Stripe customer found" });
      }
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get("host")}/`
      });
      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Stripe portal error:", error);
      res.status(500).json({ message: `Failed to create portal session: ${error.message}` });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
async function createApp() {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    const path3 = await import("path");
    const fs3 = await import("fs");
    const distPath = path3.resolve(process.cwd(), "dist", "public");
    if (fs3.existsSync(distPath)) {
      app.use(express2.static(distPath));
      app.use("*", (_req, res) => {
        const indexPath = path3.resolve(distPath, "index.html");
        if (fs3.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).send("Not found");
        }
      });
    } else {
      console.error("Static files not found at:", distPath);
      serveStatic(app);
    }
  }
  return { app, server };
}
var appInstance = null;
async function handler(req, res) {
  if (!appInstance) {
    const { app: expressApp } = await createApp();
    appInstance = expressApp;
  }
  return appInstance(req, res);
}
if (!process.env.VERCEL) {
  (async () => {
    const { server } = await createApp();
    const port = parseInt(process.env.PORT || "5000", 10);
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true
    }, () => {
      log(`serving on port ${port}`);
    });
  })();
}
export {
  handler as default
};
