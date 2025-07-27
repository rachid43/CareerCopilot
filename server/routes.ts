import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import OpenAI from "openai";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProfileSchema, insertDocumentSchema, insertAiResultSchema, insertUserInvitationSchema } from "@shared/schema";
import { sendEmailWithFallback, generateInvitationEmail } from "./emailServiceSMTP";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import fs from "fs/promises";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY 
});

const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function getSessionId(req: any): string {
  return req.sessionID || req.headers['x-session-id'] || 'default-session';
}

function getUserId(req: any): string {
  return req.user?.claims?.sub || 'anonymous';
}

// Superadmin middleware
const isSuperAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUserByUsername(userId);
    if (!user || user.role !== 'superadmin') {
      return res.status(403).json({ message: "Superadmin access required" });
    }
    
    // Check if account is active and not expired
    if (!user.isActive || (user.accountExpiresAt && new Date() > user.accountExpiresAt)) {
      return res.status(403).json({ message: "Account inactive or expired" });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify admin privileges" });
  }
};

// Generate random token for invitations
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

async function parseDocument(filePath: string, mimetype: string): Promise<string> {
  try {
    const buffer = await fs.readFile(filePath);
    
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    
    throw new Error('Unsupported file type');
  } catch (error: any) {
    throw new Error(`Failed to parse document: ${error.message}`);
  } finally {
    // Clean up uploaded file
    try {
      await fs.unlink(filePath);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUserByUsername(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Protected profile endpoints
  app.get("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const profile = await storage.getProfile(sessionId);
      res.json(profile || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get profile" });
    }
  });

  app.post("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const profileData = insertProfileSchema.parse({ ...req.body, sessionId });
      
      const existingProfile = await storage.getProfile(sessionId);
      let profile;
      
      if (existingProfile) {
        profile = await storage.updateProfile(sessionId, profileData);
      } else {
        profile = await storage.createProfile(profileData);
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

  // Document upload endpoints
  app.post("/api/documents/upload", isAuthenticated, upload.single('document'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const sessionId = getSessionId(req);
      const { type } = req.body; // 'cv' or 'cover-letter'
      
      if (!type || !['cv', 'cover-letter'].includes(type)) {
        return res.status(400).json({ message: "Invalid document type" });
      }

      const content = await parseDocument(req.file.path, req.file.mimetype);
      
      const documentData = insertDocumentSchema.parse({
        filename: req.file.originalname,
        content,
        type,
        sessionId
      });

      const document = await storage.createDocument(documentData);
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ message: `Failed to upload document: ${error.message}` });
    }
  });

  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const documents = await storage.getDocuments(sessionId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get documents" });
    }
  });

  app.delete("/api/documents/:id", isAuthenticated, async (req, res) => {
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

  // AI processing endpoints
  app.post("/api/ai/create", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { profile, jobDescription } = req.body;

      if (!profile || !jobDescription) {
        return res.status(400).json({ message: "Profile and job description are required" });
      }

      const prompt = `Generate a professional CV and cover letter based on the following information:

Profile:
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone}
Position: ${profile.position}
Skills: ${profile.skills}

Job Description:
${jobDescription}

Please create both a CV and cover letter tailored to this job. Return the response in JSON format with the following structure:
{
  "cv": "Complete CV content in plain text",
  "coverLetter": "Complete cover letter content in plain text"
}

Make the content professional, relevant to the job requirements, and well-formatted.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const aiResult = await storage.createAiResult({
        mode: 'create',
        input: JSON.stringify({ profile, jobDescription }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  app.post("/api/ai/review", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const documents = await storage.getDocuments(sessionId);
      
      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for review" });
      }

      const cvDoc = documents.find(doc => doc.type === 'cv');
      const coverLetterDoc = documents.find(doc => doc.type === 'cover-letter');

      let prompt = `Please review the following documents and provide detailed feedback:

`;

      if (cvDoc) {
        prompt += `CV/Resume:
${cvDoc.content}

`;
      }

      if (coverLetterDoc) {
        prompt += `Cover Letter:
${coverLetterDoc.content}

`;
      }

      prompt += `Please analyze these documents and provide feedback in JSON format with the following structure:
{
  "overallScore": 85,
  "strengths": ["List of strengths"],
  "improvements": ["List of improvement suggestions"],
  "summary": "Brief summary of the analysis"
}

Focus on professional formatting, content quality, clarity, and overall effectiveness.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const aiResult = await storage.createAiResult({
        mode: 'review',
        input: JSON.stringify({ documents: documents.map(d => ({ type: d.type, filename: d.filename })) }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  app.post("/api/ai/assess", isAuthenticated, async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const { jobDescription } = req.body;
      const documents = await storage.getDocuments(sessionId);

      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }

      if (documents.length === 0) {
        return res.status(400).json({ message: "No documents uploaded for assessment" });
      }

      const cvDoc = documents.find(doc => doc.type === 'cv');
      
      if (!cvDoc) {
        return res.status(400).json({ message: "CV is required for assessment" });
      }

      const prompt = `Compare the following CV against the job description and provide a match assessment:

Job Description:
${jobDescription}

CV:
${cvDoc.content}

Please analyze the match and provide assessment in JSON format with the following structure:
{
  "matchScore": 78,
  "skillsAnalysis": [
    {"skill": "React", "match": 100, "status": "excellent"},
    {"skill": "AWS", "match": 70, "status": "good"},
    {"skill": "Kubernetes", "match": 0, "status": "missing"}
  ],
  "recommendations": {
    "high": ["High priority recommendations"],
    "medium": ["Medium priority recommendations"]
  },
  "summary": "Brief summary of the assessment"
}

Provide a match score from 0-100, analyze key skills, and give specific improvement recommendations.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      const aiResult = await storage.createAiResult({
        mode: 'assess',
        input: JSON.stringify({ jobDescription, cvFilename: cvDoc.filename }),
        result: JSON.stringify(result),
        sessionId
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: `AI processing failed: ${error.message}` });
    }
  });

  // Superadmin routes
  
  // Get all users (superadmin only)
  app.get("/api/admin/users", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  // Update user status (activate/deactivate)
  app.patch("/api/admin/users/:id", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive, accountExpiresAt } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { 
        isActive,
        accountExpiresAt: accountExpiresAt ? new Date(accountExpiresAt) : undefined
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  
  // Send user invitation
  app.post("/api/admin/invite", isAuthenticated, isSuperAdmin, async (req: any, res) => {
    try {
      const { email } = req.body;
      const currentUser = req.currentUser;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if email already exists
      const existingUser = await storage.getUserByUsername(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now
      
      // Create invitation
      const invitation = await storage.createInvitation({
        email,
        token,
        expiresAt,
        isUsed: false,
        invitedBy: currentUser.id
      });
      
      // Send email
      const emailParams = generateInvitationEmail(
        email, 
        token, 
        `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username
      );
      
      const emailSent = await sendEmailWithFallback(emailParams);
      
      if (!emailSent) {
        return res.status(500).json({ message: "Failed to send invitation email" });
      }
      
      res.json({ 
        message: "Invitation sent successfully",
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expiresAt
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: `Failed to send invitation: ${error.message}` });
    }
  });
  
  // Get active invitations
  app.get("/api/admin/invitations", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const invitations = await storage.getActiveInvitations();
      res.json(invitations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });
  
  // Test Hostinger SMTP (for debugging)
  app.post("/api/test-email", async (req, res) => {
    try {
      console.log('Testing Hostinger SMTP...');
      const testEmailParams = {
        to: 'test@example.com',
        from: process.env.SMTP_USER || 'info@maptheorie.nl',
        subject: 'Hostinger SMTP Test',
        text: 'Testing Hostinger SMTP email delivery.',
      };
      
      const emailSent = await sendEmailWithFallback(testEmailParams);
      
      res.json({ 
        success: emailSent,
        message: emailSent ? "Email sent successfully" : "Email failed - check logs"
      });
    } catch (error: any) {
      console.error('Email test error:', error);
      res.status(500).json({ message: `Test failed: ${error.message}` });
    }
  });

  // Test SendGrid configuration (for debugging)
  app.post("/api/admin/test-sendgrid", isAuthenticated, isSuperAdmin, async (req, res) => {
    try {
      const { testEmail } = req.body;
      const emailToUse = testEmail || 'test@example.com';
      
      const testEmailParams = {
        to: emailToUse,
        from: process.env.SMTP_USER || 'info@maptheorie.nl',
        subject: 'Hostinger SMTP Test - CareerCopilot',
        text: 'This is a test email to verify Hostinger SMTP configuration is working properly.',
        html: '<h3>Hostinger SMTP Test</h3><p>This is a test email to verify Hostinger SMTP configuration is working properly.</p>'
      };
      
      console.log('Testing Hostinger SMTP configuration...');
      console.log('SMTP Host exists:', !!process.env.SMTP_HOST);
      console.log('SMTP User:', process.env.SMTP_USER);
      console.log('From email:', testEmailParams.from);
      console.log('Test email to:', emailToUse);
      
      // Actually attempt to send the test email
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
    } catch (error: any) {
      res.status(500).json({ message: `SendGrid test failed: ${error.message}` });
    }
  });

  // Accept invitation and create account
  app.post("/api/invite/:token", async (req, res) => {
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
      
      if (new Date() > invitation.expiresAt) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Create user account
      const accountExpiry = new Date();
      accountExpiry.setDate(accountExpiry.getDate() + 30); // 30 days active
      
      const newUser = await storage.createUser({
        username: invitation.email,
        email: invitation.email,
        firstName: firstName || null,
        lastName: lastName || null,
        role: 'user',
        isActive: true,
        accountExpiresAt: accountExpiry
      });
      
      // Mark invitation as used
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
    } catch (error: any) {
      res.status(500).json({ message: `Failed to create account: ${error.message}` });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
