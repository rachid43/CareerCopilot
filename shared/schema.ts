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
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  role: text("role").notNull().default("user"), // 'user' | 'superadmin'
  isActive: boolean("is_active").notNull().default(true),
  accountExpiresAt: timestamp("account_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  position: text("position"),
  skills: text("skills"),
  experience: text("experience"),
  languages: text("languages"),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'cv' | 'cover-letter'
  sessionId: text("session_id").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const aiResults = pgTable("ai_results", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(), // 'create' | 'review' | 'assess'
  input: text("input").notNull(),
  result: text("result").notNull(),
  sessionId: text("session_id").notNull(),
});

// Chat conversations table for AI Career Mentor
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull().default("New Conversation"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => chatConversations.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User invitations table for email-based account creation
export const userInvitations = pgTable("user_invitations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Applications Tracker table
export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  appliedRoles: text("applied_roles").notNull(),
  company: text("company").notNull(),
  applyDate: date("apply_date").notNull(),
  whereApplied: text("where_applied").notNull(), // 'LinkedIn' | 'Website' | 'Referral' | 'Other'
  credentialsUsed: text("credentials_used"),
  commentsInformation: text("comments_information"),
  response: text("response").notNull().default("No Response"), // 'No Response' | 'Interview' | 'Offer' | 'Rejected' | 'Open' | 'Under Interview' | 'WithDrawn' | 'Other'
  responseDate: date("response_date"),
  locationCity: text("location_city"),
  locationCountry: text("location_country"),
  interviewComments: text("interview_comments"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mock Interview Sessions table
export const interviewSessions = pgTable("interview_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  jobTitle: text("job_title").notNull(),
  company: text("company").notNull(),
  jobDescription: text("job_description").notNull(),
  interviewType: text("interview_type").notNull(), // 'behavioral' | 'technical' | 'situational' | 'mixed'
  difficultyLevel: text("difficulty_level").notNull().default("mid"), // 'junior' | 'mid' | 'senior'
  recruiterPersona: text("recruiter_persona").notNull().default("friendly"), // 'friendly' | 'formal' | 'challenging'
  status: text("status").notNull().default("active"), // 'active' | 'completed' | 'paused'
  totalQuestions: integer("total_questions").notNull().default(0),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  overallScore: integer("overall_score"), // 1-100 scale
  duration: integer("duration"), // in minutes
  language: text("language").notNull().default("en"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview Questions and Answers table
export const interviewQA = pgTable("interview_qa", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id),
  questionNumber: integer("question_number").notNull(),
  question: text("question").notNull(),
  questionType: text("question_type").notNull(), // 'opening' | 'behavioral' | 'technical' | 'situational' | 'closing'
  userAnswer: text("user_answer").notNull(),
  answerScore: integer("answer_score"), // 1-10 scale
  feedback: text("feedback"), // AI feedback on the answer
  suggestions: text("suggestions"), // Improvement suggestions
  responseTime: integer("response_time"), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// Interview Feedback and Analytics table
export const interviewFeedback = pgTable("interview_feedback", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => interviewSessions.id),
  category: text("category").notNull(), // 'communication' | 'content' | 'confidence' | 'technical' | 'overall'
  score: integer("score").notNull(), // 1-10 scale
  strengths: text("strengths"), // JSON array of strengths
  improvements: text("improvements"), // JSON array of improvement areas
  detailedFeedback: text("detailed_feedback"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
});

export const insertAiResultSchema = createInsertSchema(aiResults).omit({
  id: true,
});

export const insertUserInvitationSchema = createInsertSchema(userInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSessionSchema = createInsertSchema(interviewSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewQASchema = createInsertSchema(interviewQA).omit({
  id: true,
  createdAt: true,
});

export const insertInterviewFeedbackSchema = createInsertSchema(interviewFeedback).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AiResult = typeof aiResults.$inferSelect;
export type InsertAiResult = z.infer<typeof insertAiResultSchema>;
export type UserInvitation = typeof userInvitations.$inferSelect;
export type InsertUserInvitation = z.infer<typeof insertUserInvitationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type InterviewSession = typeof interviewSessions.$inferSelect;
export type InsertInterviewSession = z.infer<typeof insertInterviewSessionSchema>;
export type InterviewQA = typeof interviewQA.$inferSelect;
export type InsertInterviewQA = z.infer<typeof insertInterviewQASchema>;
export type InterviewFeedback = typeof interviewFeedback.$inferSelect;
export type InsertInterviewFeedback = z.infer<typeof insertInterviewFeedbackSchema>;
